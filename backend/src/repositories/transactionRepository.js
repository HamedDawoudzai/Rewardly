'use strict';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Transaction Repository
 * Handles all database operations related to transactions
 */

/**
 * Create a purchase transaction
 */
async function createPurchaseTransaction(data) {
  const {
    utorid,
    spent,
    promotionIds = [],
    remark,
    createdBy,
    earned,
    isSuspicious
  } = data;

  return await prisma.$transaction(async (tx) => {
    // Find user's account
    const user = await tx.user.findUnique({
      where: { username: utorid },
      include: { account: true }
    });

    if (!user || !user.account) {
      throw new Error('User or account not found');
    }

    // Determine status based on whether cashier is suspicious
    const status = isSuspicious ? 'pending_verification' : 'posted';

    // Create transaction
    const transaction = await tx.transaction.create({
      data: {
        type: 'purchase',
        status,
        accountId: user.account.id,
        createdByUserId: createdBy,
        cashierId: createdBy,
        totalCents: Math.round(spent * 100),
        pointsCalculated: earned,
        pointsPosted: isSuspicious ? 0 : earned,
        notes: remark || null
      }
    });

    // Apply promotions
    for (const promoId of promotionIds) {
      await tx.transactionPromotion.create({
        data: {
          transactionId: transaction.id,
          promotionId: promoId
        }
      });
    }

    // If not suspicious, update points
    if (!isSuspicious) {
      await tx.loyaltyAccount.update({
        where: { id: user.account.id },
        data: {
          pointsCached: {
            increment: earned
          }
        }
      });

      // Create ledger entry
      await tx.ledgerEntry.create({
        data: {
          accountId: user.account.id,
          transactionId: transaction.id,
          kind: 'earn_purchase',
          pointsDelta: earned,
          postedByUserId: createdBy,
          note: remark || null
        }
      });
    }

    // Fetch the transaction with all relations
    return await tx.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        account: {
          include: {
            user: true
          }
        },
        createdBy: true,
        promosApplied: {
          include: {
            promotion: true
          }
        }
      }
    });
  });
}

/**
 * Create an adjustment transaction
 */
async function createAdjustmentTransaction(data) {
  const {
    utorid,
    amount,
    relatedId,
    remark,
    createdBy
  } = data;

  return await prisma.$transaction(async (tx) => {
    // Find user's account
    const user = await tx.user.findUnique({
      where: { username: utorid },
      include: { account: true }
    });

    if (!user || !user.account) {
      throw new Error('User or account not found');
    }

    // Validate related transaction exists if relatedId is provided
    if (relatedId) {
      const relatedTransaction = await tx.transaction.findUnique({
        where: { id: relatedId }
      });
      
      if (!relatedTransaction) {
        const error = new Error('Related transaction not found');
        error.code = 'NOT_FOUND';
        throw error;
      }
    }

    // Create transaction
    const transaction = await tx.transaction.create({
      data: {
        type: 'adjustment',
        status: 'posted',
        accountId: user.account.id,
        createdByUserId: createdBy,
        managerId: createdBy,
        adjustsTransactionId: relatedId || null,
        pointsCalculated: amount,
        pointsPosted: amount,
        notes: remark || null
      }
    });

    // Update points
    await tx.loyaltyAccount.update({
      where: { id: user.account.id },
      data: {
        pointsCached: {
          increment: amount
        }
      }
    });

    // Create ledger entry
    await tx.ledgerEntry.create({
      data: {
        accountId: user.account.id,
        transactionId: transaction.id,
        kind: amount > 0 ? 'adjustment_credit' : 'adjustment_debit',
        pointsDelta: amount,
        postedByUserId: createdBy,
        note: remark || null
      }
    });

    // Fetch the transaction with all relations
    return await tx.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        account: {
          include: {
            user: true
          }
        },
        createdBy: true,
        promosApplied: {
          include: {
            promotion: true
          }
        }
      }
    });
  });
}

/**
 * Find transactions with filters and pagination
 */
async function findTransactionsWithFilters(filters = {}, page = 1, limit = 10, accountId = null) {
  const where = {};

  // If accountId is provided, filter by user's account
  if (accountId) {
    where.accountId = accountId;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.createdBy) {
    where.createdBy = {
      username: {
        contains: filters.createdBy
        // Note: mode: 'insensitive' not supported in SQLite
      }
    };
  }

  if (filters.name) {
    // Check if it's a numeric ID search
    const numericId = parseInt(filters.name);
    if (!isNaN(numericId) && filters.name.trim() === String(numericId)) {
      // Search by transaction ID
      where.id = numericId;
    } else {
      // Search by user's name OR utorid (username)
      where.account = {
        user: {
          OR: [
            { name: { contains: filters.name } },
            { username: { contains: filters.name } }
          ]
          // Note: mode: 'insensitive' not supported in SQLite
        }
      };
    }
  }

  if (filters.suspicious !== undefined) {
    where.status = filters.suspicious ? 'pending_verification' : { not: 'pending_verification' };
  }

  if (filters.promotionId) {
    where.promosApplied = {
      some: {
        promotionId: parseInt(filters.promotionId)
      }
    };
  }

  if (filters.relatedId) {
    where.OR = [
      { adjustsTransactionId: parseInt(filters.relatedId) },
      { transferToAccountId: parseInt(filters.relatedId) },
      { cashierId: parseInt(filters.relatedId) }
    ];
  }

  if (filters.amount && filters.operator) {
    const amount = parseInt(filters.amount);
    if (filters.operator === 'gte') {
      where.pointsPosted = { gte: amount };
    } else if (filters.operator === 'lte') {
      where.pointsPosted = { lte: amount };
    }
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      include: {
        account: {
          include: {
            user: true
          }
        },
        createdBy: true,
        cashier: true,
        manager: true,
        promosApplied: {
          include: {
            promotion: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.transaction.count({ where })
  ]);

  return { transactions, total };
}

/**
 * Find transaction by ID
 */
async function findTransactionById(transactionId) {
  return await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      account: {
        include: {
          user: true
        }
      },
      createdBy: true,
      cashier: true,
      manager: true,
      promosApplied: {
        include: {
          promotion: true
        }
      },
      transferTo: {
        include: {
          user: true
        }
      }
    }
  });
}

/**
 * Toggle transaction suspicious status
 */
async function toggleSuspiciousStatus(transactionId, suspicious) {
  return await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { account: true }
    });

    if (!transaction) {
      const error = new Error('Transaction not found');
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Only purchase transactions can be marked as suspicious
    if (transaction.type !== 'purchase') {
      throw new Error('Only purchase transactions can be marked as suspicious');
    }

    const pointsToAdjust = transaction.pointsCalculated || 0;

    if (suspicious) {
      // Mark as suspicious - deduct points if they were already posted
      // Only deduct if currently posted (not already suspicious)
      if (transaction.status === 'posted' && transaction.pointsPosted > 0) {
        await tx.loyaltyAccount.update({
          where: { id: transaction.accountId },
          data: {
            pointsCached: {
              decrement: transaction.pointsPosted
            }
          }
        });
      }

      // Set transaction to pending verification with 0 posted points
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'pending_verification',
          pointsPosted: 0
        }
      });
    } else {
      // Verify transaction - credit points if currently pending verification
      // Only credit if currently pending (not already verified)
      if (transaction.status === 'pending_verification' && pointsToAdjust > 0) {
        await tx.loyaltyAccount.update({
          where: { id: transaction.accountId },
          data: {
            pointsCached: {
              increment: pointsToAdjust
            }
          }
        });

        // Create ledger entry for the verification
        await tx.ledgerEntry.create({
          data: {
            accountId: transaction.accountId,
            transactionId: transaction.id,
            kind: 'earn_purchase',
            pointsDelta: pointsToAdjust,
            postedByUserId: transaction.createdByUserId,
            note: 'Approved after verification'
          }
        });
      }

      // Set transaction to posted with calculated points
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'posted',
          pointsPosted: pointsToAdjust
        }
      });
    }

    return await tx.transaction.findUnique({
      where: { id: transactionId },
      include: {
        account: {
          include: {
            user: true
          }
        },
        createdBy: true,
        promosApplied: {
          include: {
            promotion: true
          }
        }
      }
    });
  });
}

/**
 * Process a redemption transaction
 */
async function processRedemption(transactionId, cashierId) {
  return await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { account: true }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.type !== 'redemption') {
      throw new Error('Transaction is not a redemption');
    }

    if (transaction.status === 'posted') {
      throw new Error('Transaction already processed');
    }

    const pointsToDeduct = Math.abs(transaction.pointsCalculated || 0);

    // Deduct points
    await tx.loyaltyAccount.update({
      where: { id: transaction.accountId },
      data: {
        pointsCached: {
          decrement: pointsToDeduct
        }
      }
    });

    // Update transaction
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'posted',
        cashierId,
        pointsPosted: -pointsToDeduct,
        decidedAt: new Date()
      }
    });

    // Create ledger entry
    await tx.ledgerEntry.create({
      data: {
        accountId: transaction.accountId,
        transactionId: transaction.id,
        kind: 'redeem',
        pointsDelta: -pointsToDeduct,
        postedByUserId: cashierId,
        note: 'Redemption processed'
      }
    });

    return await tx.transaction.findUnique({
      where: { id: transactionId },
      include: {
        account: {
          include: {
            user: true
          }
        },
        createdBy: true,
        cashier: true,
        promosApplied: {
          include: {
            promotion: true
          }
        }
      }
    });
  });
}

/**
 * Create a transfer transaction (creates two transactions: sender and recipient)
 */
async function createTransferTransaction(data) {
  const {
    fromUtorid,
    toUserId,
    amount,
    remark,
    createdBy
  } = data;

  return await prisma.$transaction(async (tx) => {
    // Find sender's account
    const sender = await tx.user.findUnique({
      where: { username: fromUtorid },
      include: { account: true }
    });

    if (!sender || !sender.account) {
      throw new Error('Sender not found');
    }

    // Find recipient's account
    const recipient = await tx.user.findUnique({
      where: { id: toUserId },
      include: { account: true }
    });

    if (!recipient || !recipient.account) {
      throw new Error('Recipient not found');
    }

    // Check balance
    if (sender.account.pointsCached < amount) {
      throw new Error('Insufficient points');
    }

    // Create sender transaction (debit)
    const senderTx = await tx.transaction.create({
      data: {
        type: 'transfer',
        status: 'posted',
        accountId: sender.account.id,
        createdByUserId: createdBy,
        transferToAccountId: recipient.account.id,
        pointsCalculated: -amount,
        pointsPosted: -amount,
        notes: remark || null
      }
    });

    // Create recipient transaction (credit)
    const recipientTx = await tx.transaction.create({
      data: {
        type: 'transfer',
        status: 'posted',
        accountId: recipient.account.id,
        createdByUserId: createdBy,
        transferToAccountId: sender.account.id,
        pointsCalculated: amount,
        pointsPosted: amount,
        notes: remark || null
      }
    });

    // Update sender points
    await tx.loyaltyAccount.update({
      where: { id: sender.account.id },
      data: {
        pointsCached: {
          decrement: amount
        }
      }
    });

    // Update recipient points
    await tx.loyaltyAccount.update({
      where: { id: recipient.account.id },
      data: {
        pointsCached: {
          increment: amount
        }
      }
    });

    // Create ledger entries
    await tx.ledgerEntry.create({
      data: {
        accountId: sender.account.id,
        transactionId: senderTx.id,
        kind: 'transfer_out',
        pointsDelta: -amount,
        postedByUserId: createdBy,
        note: remark || null
      }
    });

    await tx.ledgerEntry.create({
      data: {
        accountId: recipient.account.id,
        transactionId: recipientTx.id,
        kind: 'transfer_in',
        pointsDelta: amount,
        postedByUserId: createdBy,
        note: remark || null
      }
    });

    // Fetch the sender transaction with all relations
    return await tx.transaction.findUnique({
      where: { id: senderTx.id },
      include: {
        account: {
          include: {
            user: true
          }
        },
        createdBy: true,
        transferTo: {
          include: {
            user: true
          }
        }
      }
    });
  });
}

/**
 * Create a redemption request (does not deduct points yet)
 */
async function createRedemptionRequest(data) {
  const {
    utorid,
    amount,
    remark,
    createdBy
  } = data;

  return await prisma.$transaction(async (tx) => {
    // Find user's account
    const user = await tx.user.findUnique({
      where: { username: utorid },
      include: { account: true }
    });

    if (!user || !user.account) {
      throw new Error('User or account not found');
    }

    // Check balance
    if (user.account.pointsCached < amount) {
      throw new Error('Insufficient points');
    }

    // Create transaction in pending state
    const transaction = await tx.transaction.create({
      data: {
        type: 'redemption',
        status: 'pending_verification',
        accountId: user.account.id,
        createdByUserId: createdBy,
        pointsCalculated: -amount,
        pointsPosted: 0,
        notes: remark || null
      }
    });

    // Fetch the transaction with all relations
    return await tx.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        account: {
          include: {
            user: true
          }
        },
        createdBy: true,
        cashier: true,
        promosApplied: {
          include: {
            promotion: true
          }
        }
      }
    });
  });
}

module.exports = {
  createPurchaseTransaction,
  createAdjustmentTransaction,
  findTransactionsWithFilters,
  findTransactionById,
  toggleSuspiciousStatus,
  processRedemption,
  createTransferTransaction,
  createRedemptionRequest
};

