'use strict';

const transactionRepository = require('../repositories/transactionRepository');
const userRepository = require('../repositories/userRepository');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Transaction Service
 * Handles business logic for transaction operations
 */

/**
 * Calculate base earn rate: 1 point per $0.25
 */
function calculateBaseEarned(spent) {
  return Math.round(spent / 0.25);
}

/**
 * Calculate points with promotions
 */
async function calculatePointsWithPromotions(spent, promotionIds) {
  let totalPoints = calculateBaseEarned(spent);
  const spentCents = Math.round(spent * 100);

  for (const promoId of promotionIds) {
    const promo = await prisma.promotion.findUnique({
      where: { id: promoId }
    });

    if (!promo) continue;

    // Check if promotion is active
    const now = new Date();
    if (promo.startsAt && promo.startsAt > now) continue;
    if (promo.endsAt && promo.endsAt < now) continue;
    if (promo.status !== 'active') continue;

    // Apply promotion
    if (promo.kind === 'automatic') {
      // Check minimum spending
      if (promo.minSpendCents && spentCents < promo.minSpendCents) {
        continue;
      }

      // Apply rate multiplier
      if (promo.pointsPerCentMultiplier) {
        totalPoints += Math.round(spentCents * promo.pointsPerCentMultiplier);
      }

      // Apply bonus points
      if (promo.pointsBonus) {
        totalPoints += promo.pointsBonus;
      }
    } else if (promo.kind === 'onetime') {
      // One-time promotions can have both rate multiplier and bonus points
      // Check minimum spending if specified
      if (promo.minSpendCents && spentCents < promo.minSpendCents) {
        continue;
      }

      // Apply rate multiplier
      if (promo.pointsPerCentMultiplier) {
        totalPoints += Math.round(spentCents * promo.pointsPerCentMultiplier);
      }

      // Apply bonus points
      if (promo.pointsBonus) {
        totalPoints += promo.pointsBonus;
      }
    }
  }

  return totalPoints;
}

/**
 * Validate and mark one-time promotions as used
 */
async function validateAndMarkPromotions(utorid, promotionIds) {
  const user = await userRepository.findUserByUsername(utorid);
  if (!user) throw new Error('User not found');

  const now = new Date();
  const errors = [];

  for (const promoId of promotionIds) {
    const promo = await prisma.promotion.findUnique({
      where: { id: promoId },
      include: {
        redemptions: {
          where: {
            userId: user.id
          }
        }
      }
    });

    if (!promo) {
      errors.push(`Promotion ${promoId} not found`);
      continue;
    }

    // Check if active
    if (promo.status !== 'active') {
      errors.push(`Promotion ${promoId} is not active`);
      continue;
    }

    // Check timing
    if (promo.startsAt && promo.startsAt > now) {
      errors.push(`Promotion ${promoId} has not started yet`);
      continue;
    }

    if (promo.endsAt && promo.endsAt < now) {
      errors.push(`Promotion ${promoId} has expired`);
      continue;
    }

    // Check if one-time promo is already used
    if (promo.kind === 'onetime') {
      const redemption = promo.redemptions.find(r => r.userId === user.id);
      if (redemption && redemption.usedAt) {
        errors.push(`Promotion ${promoId} has already been used`);
        continue;
      }

      // Create or update redemption record
      await prisma.singleUseRedemption.upsert({
        where: {
          promotionId_userId: {
            promotionId: promoId,
            userId: user.id
          }
        },
        create: {
          promotionId: promoId,
          userId: user.id,
          usedAt: new Date()
        },
        update: {
          usedAt: new Date()
        }
      });
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
}

/**
 * Create a purchase transaction
 */
async function createPurchase(data, createdBy) {
  const { utorid, spent, promotionIds = [], remark } = data;

  // Validate promotions
  if (promotionIds.length > 0) {
    await validateAndMarkPromotions(utorid, promotionIds);
  }

  // Calculate earned points
  const earned = await calculatePointsWithPromotions(spent, promotionIds);

  // Check if cashier is suspicious
  const cashier = await userRepository.findUserById(createdBy);
  const isSuspicious = cashier?.isSuspicious || false;

  // Create transaction
  const transaction = await transactionRepository.createPurchaseTransaction({
    utorid,
    spent,
    promotionIds,
    remark,
    createdBy,
    earned,
    isSuspicious
  });

  return mapTransactionToResponse(transaction, 'create');
}

/**
 * Create an adjustment transaction
 */
async function createAdjustment(data, createdBy) {
  const { utorid, amount, relatedId, remark } = data;

  try {
    const transaction = await transactionRepository.createAdjustmentTransaction({
      utorid,
      amount,
      relatedId,
      remark,
      createdBy
    });

    return mapTransactionToResponse(transaction, 'create');
  } catch (error) {
    // Re-throw with the error code intact
    if (error.code) {
      throw error;
    }
    throw new Error(error.message || 'Failed to create adjustment');
  }
}

/**
 * Get transactions with filters and pagination
 */
async function getTransactions(filters, page, limit, accountId = null) {
  const { transactions, total } = await transactionRepository.findTransactionsWithFilters(
    filters,
    page,
    limit,
    accountId
  );

  const results = transactions.map(mapTransactionToResponse);

  return {
    count: total,
    results
  };
}

/**
 * Get transaction by ID
 */
async function getTransactionById(transactionId) {
  const transaction = await transactionRepository.findTransactionById(transactionId);
  if (!transaction) return null;

  return mapTransactionToResponse(transaction);
}

/**
 * Toggle suspicious status
 */
async function toggleSuspicious(transactionId, suspicious) {
  const transaction = await transactionRepository.toggleSuspiciousStatus(
    transactionId,
    suspicious
  );

  return mapTransactionToResponse(transaction);
}

/**
 * Process redemption
 */
async function processRedemption(transactionId, cashierId) {
  const transaction = await transactionRepository.processRedemption(transactionId, cashierId);
  return mapTransactionToResponse(transaction);
}

/**
 * Create transfer transaction
 */
async function createTransfer(fromUtorid, toUserId, amount, remark, createdBy) {
  // Verify sender is verified
  const sender = await userRepository.findUserByUsername(fromUtorid);
  if (!sender || !sender.isStudentVerified) {
    const error = new Error('Sender must be verified to transfer points');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const transaction = await transactionRepository.createTransferTransaction({
    fromUtorid,
    toUserId,
    amount,
    remark,
    createdBy
  });

  return mapTransactionToResponse(transaction, 'create');
}

/**
 * Create redemption request
 */
async function createRedemptionRequest(utorid, amount, remark, createdBy) {
  // Verify user is verified
  const user = await userRepository.findUserByUsername(utorid);
  if (!user || !user.isStudentVerified) {
    const error = new Error('User must be verified to redeem points');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const transaction = await transactionRepository.createRedemptionRequest({
    utorid,
    amount,
    remark,
    createdBy
  });

  return mapTransactionToResponse(transaction, 'create');
}

/**
 * Map transaction from DB to API response format
 * @param {Object} transaction - Transaction object from DB
 * @param {string} context - Context of the call: 'create' or 'get'
 */
function mapTransactionToResponse(transaction, context = 'get') {
  // Base fields common to all transactions
  const result = {
    id: transaction.id,
    utorid: transaction.account?.user?.username || null,
    type: transaction.type
  };

  // Add type-specific fields before remark and createdBy
  if (transaction.type === 'purchase') {
    // For CREATE context: id, utorid, type, spent, earned, remark, promotionIds, createdBy
    //   - earned = pointsPosted (0 if suspicious, calculated if normal)
    // For GET context: id, utorid, amount, type, spent, promotionIds, suspicious, remark, createdBy
    //   - amount = pointsCalculated if suspicious (showing potential), pointsPosted if normal
    if (context === 'create') {
      result.spent = transaction.totalCents ? transaction.totalCents / 100 : 0;
      result.earned = transaction.pointsPosted !== null && transaction.pointsPosted !== undefined ? transaction.pointsPosted : 0;
    } else {
      const isSuspicious = transaction.status === 'pending_verification';
      // For suspicious purchases, show calculated points (what they would get)
      // For normal purchases, show posted points (what they got)
      const amountValue = isSuspicious 
        ? (transaction.pointsCalculated !== null && transaction.pointsCalculated !== undefined ? transaction.pointsCalculated : 0)
        : (transaction.pointsPosted !== null && transaction.pointsPosted !== undefined ? transaction.pointsPosted : 0);
      result.amount = amountValue;
      result.spent = transaction.totalCents ? transaction.totalCents / 100 : 0;
    }
  } else if (transaction.type === 'adjustment') {
    result.amount = transaction.pointsPosted !== null && transaction.pointsPosted !== undefined ? transaction.pointsPosted : 0;
    result.relatedId = transaction.adjustsTransactionId;
    result.promotionIds = transaction.promosApplied 
      ? transaction.promosApplied.map(p => p.promotionId)
      : [];
    result.suspicious = transaction.status === 'pending_verification';
  } else if (transaction.type === 'transfer') {
    // Transfer has a special response format
    delete result.utorid;
    result.sender = transaction.account?.user?.username || null;
    result.recipient = transaction.transferTo?.user?.username || null;
    result.sent = Math.abs(transaction.pointsPosted || 0);
  } else if (transaction.type === 'redemption') {
    // Redemption has a special response format
    const isProcessed = transaction.status === 'posted';
    result.processedBy = transaction.cashier ? transaction.cashier.username : null;
    
    if (isProcessed) {
      // When processed show 'redeemed' instead of 'amount'
      result.redeemed = Math.abs(transaction.pointsPosted || 0);
    }
    // When not processed keep 'amount' field with the calculated amount
    else {
      result.amount = Math.abs(transaction.pointsCalculated || 0);
    }
  } else {
    // For other transaction types, include amount
    result.amount = transaction.pointsPosted !== null && transaction.pointsPosted !== undefined ? transaction.pointsPosted : 0;
  }

  // Add common trailing fields
  // For purchase, add remark then promotionIds (for create), or promotionIds, suspicious, remark (for get)
  if (transaction.type === 'purchase') {
    if (context === 'create') {
      result.remark = transaction.notes || null;
      result.promotionIds = transaction.promosApplied 
        ? transaction.promosApplied.map(p => p.promotionId)
        : [];
    } else {
      result.promotionIds = transaction.promosApplied 
        ? transaction.promosApplied.map(p => p.promotionId)
        : [];
      result.suspicious = transaction.status === 'pending_verification';
      result.remark = transaction.notes || null;
    }
  } else {
    result.remark = transaction.notes || null;
  }
  
  result.createdBy = transaction.createdBy ? transaction.createdBy.username : null;

  return result;
}

module.exports = {
  createPurchase,
  createAdjustment,
  getTransactions,
  getTransactionById,
  toggleSuspicious,
  processRedemption,
  createTransfer,
  createRedemptionRequest
};

