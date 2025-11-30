'use strict';

const transactionService = require('../services/transactionService');
const userRepository = require('../repositories/userRepository');
const userService = require('../services/userService');
const { z } = require('zod');

/**
 * Transaction Controller
 * Handles HTTP requests for transaction operations
 */

// Validation schemas
const createTransactionSchema = z.object({
  utorid: z.string(),
  type: z.enum(['purchase', 'adjustment']),
  spent: z.number().positive().optional(),
  amount: z.number().optional(),
  promotionIds: z.array(z.number()).nullable().optional(),
  relatedId: z.number().nullable().optional(),
  remark: z.string().nullable().optional()
});

const createTransferSchema = z.object({
  type: z.literal('transfer'),
  amount: z.number().positive(),
  remark: z.string().optional()
});

const createRedemptionSchema = z.object({
  type: z.literal('redemption'),
  amount: z.number().positive(),
  remark: z.string().optional()
});

const toggleSuspiciousSchema = z.object({
  suspicious: z.boolean()
});

const processRedemptionSchema = z.object({
  processed: z.literal(true)
});

/**
 * POST /transactions
 * Create purchase or adjustment transaction (Cashier+ for purchase, Manager+ for adjustment)
 */
async function createTransactionHandler(req, res) {
  try {
    const validatedData = createTransactionSchema.parse(req.body);

    if (validatedData.type === 'purchase') {
      if (!validatedData.spent) {
        return res.status(400).json({ error: 'spent is required for purchase transactions' });
      }

      const result = await transactionService.createPurchase(
        {
          utorid: validatedData.utorid,
          spent: validatedData.spent,
          promotionIds: validatedData.promotionIds || [],
          remark: validatedData.remark
        },
        req.user.id
      );

      return res.status(201).json(result);
    } else if (validatedData.type === 'adjustment') {
      // Check if user has permission to create adjustments (Manager+)
      const userRole = userService.getUserRole(req.user);
      if (!['manager', 'superuser'].includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions to create adjustments' });
      }

      if (validatedData.amount === undefined) {
        return res.status(400).json({ error: 'amount is required for adjustment transactions' });
      }

      const result = await transactionService.createAdjustment(
        {
          utorid: validatedData.utorid,
          amount: validatedData.amount,
          relatedId: validatedData.relatedId,
          promotionIds: [],
          remark: validatedData.remark
        },
        req.user.id
      );

      return res.status(201).json(result);
    } else {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error creating transaction:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * GET /transactions
 * List transactions with filters (Manager+)
 */
async function listTransactionsHandler(req, res) {
  try {
    const filters = {};

    if (req.query.name) filters.name = req.query.name;
    if (req.query.createdBy) filters.createdBy = req.query.createdBy;
    if (req.query.suspicious !== undefined) {
      filters.suspicious = req.query.suspicious === 'true';
    }
    if (req.query.promotionId) filters.promotionId = req.query.promotionId;
    if (req.query.type) filters.type = req.query.type;
    if (req.query.relatedId) filters.relatedId = req.query.relatedId;
    if (req.query.amount) filters.amount = req.query.amount;
    if (req.query.operator) filters.operator = req.query.operator;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await transactionService.getTransactions(filters, page, limit);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error listing transactions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /users/me/transactions
 * Get own transactions (Regular+)
 */
async function getMyTransactionsHandler(req, res) {
  try {
    // Get user's account
    const user = await userRepository.findUserById(req.user.id, {
      include: { account: true }
    });

    if (!user || !user.account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Parse filter parameters from query string
    const filters = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.relatedId) filters.relatedId = req.query.relatedId;
    if (req.query.promotionId) filters.promotionId = req.query.promotionId;
    if (req.query.amount) {
      filters.amount = req.query.amount;
      filters.operator = req.query.operator || 'gte';
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await transactionService.getTransactions(filters, page, limit, user.account.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting my transactions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /transactions/:transactionId
 * Get a transaction by ID (Manager+)
 */
async function getTransactionHandler(req, res) {
  try {
    const transactionId = parseInt(req.params.transactionId);
    if (isNaN(transactionId)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    const transaction = await transactionService.getTransactionById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    console.error('Error getting transaction:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /transactions/:transactionId/suspicious
 * Toggle suspicious flag (Manager+)
 */
async function toggleSuspiciousHandler(req, res) {
  try {
    const transactionId = parseInt(req.params.transactionId);
    if (isNaN(transactionId)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    const validatedData = toggleSuspiciousSchema.parse(req.body);
    const transaction = await transactionService.toggleSuspicious(
      transactionId,
      validatedData.suspicious
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error toggling suspicious:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * PATCH /transactions/:transactionId/processed
 * Process a redemption (Cashier+)
 */
async function processRedemptionHandler(req, res) {
  try {
    const transactionId = parseInt(req.params.transactionId);
    if (isNaN(transactionId)) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    const validatedData = processRedemptionSchema.parse(req.body);
    const transaction = await transactionService.processRedemption(
      transactionId,
      req.user.id
    );

    return res.status(200).json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    console.error('Error processing redemption:', error);
    return res.status(400).json({ message: error.message || 'Bad request' });
  }
}

/**
 * POST /users/:userId/transactions
 * Create transfer to another user (Regular+)
 */
async function createTransferHandler(req, res) {
  try {
    const toUserId = parseInt(req.params.userId);
    if (isNaN(toUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const validatedData = createTransferSchema.parse(req.body);
    
    const transaction = await transactionService.createTransfer(
      req.user.username,
      toUserId,
      validatedData.amount,
      validatedData.remark,
      req.user.id
    );

    return res.status(201).json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ message: error.message });
    }
    console.error('Error creating transfer:', error);
    return res.status(400).json({ message: error.message || 'Bad request' });
  }
}

/**
 * POST /users/me/transactions
 * Create redemption request (Regular+)
 */
async function createRedemptionHandler(req, res) {
  try {
    const validatedData = createRedemptionSchema.parse(req.body);
    
    const transaction = await transactionService.createRedemptionRequest(
      req.user.username,
      validatedData.amount,
      validatedData.remark,
      req.user.id
    );

    return res.status(201).json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ message: error.message });
    }
    console.error('Error creating redemption:', error);
    return res.status(400).json({ message: error.message || 'Bad request' });
  }
}

/**
 * GET /transactions/:transactionId/redemption
 * Preview a pending redemption (Cashier+)
 * Returns limited info so cashier can verify before processing
 */
async function getRedemptionPreviewHandler(req, res) {
  try {
    const transactionId = parseInt(req.params.transactionId);
    if (isNaN(transactionId)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    const transaction = await transactionService.getTransactionById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Redemption not found' });
    }

    // Only allow viewing redemption transactions
    if (transaction.type !== 'redemption') {
      return res.status(400).json({ error: 'This transaction is not a redemption request' });
    }

    // Only allow viewing pending redemptions (not already processed)
    if (transaction.redeemed !== undefined) {
      return res.status(400).json({ error: 'This redemption has already been processed' });
    }

    // Return limited preview info for the cashier
    return res.status(200).json({
      id: transaction.id,
      type: transaction.type,
      utorid: transaction.utorid,
      amount: transaction.amount,
      remark: transaction.remark,
      createdAt: transaction.createdAt
    });
  } catch (error) {
    console.error('Error getting redemption preview:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createTransactionHandler,
  listTransactionsHandler,
  getTransactionHandler,
  toggleSuspiciousHandler,
  processRedemptionHandler,
  createTransferHandler,
  createRedemptionHandler,
  getMyTransactionsHandler,
  getRedemptionPreviewHandler
};

