'use strict';

const express = require('express');
const router = express.Router();

const {
  createTransactionHandler,
  listTransactionsHandler,
  getTransactionHandler,
  toggleSuspiciousHandler,
  processRedemptionHandler,
  getRedemptionPreviewHandler
} = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

/**
 * Transaction Routes
 */

// POST /transactions - Create purchase or adjustment (Cashier+ for purchase, Manager+ for adjustment)
router.post('/', authenticate, requirePermission('CASHIER_CREATE_PURCHASE'), createTransactionHandler);

// GET /transactions - List transactions (Manager+)
router.get('/', authenticate, requirePermission('MANAGER_VIEW_ALL_TRANSACTIONS'), listTransactionsHandler);

// GET /transactions/:transactionId/redemption - Preview pending redemption (Cashier+)
// This allows cashiers to see redemption details before processing, without full transaction access
router.get('/:transactionId/redemption', authenticate, requirePermission('CASHIER_PROCESS_REDEMPTION'), getRedemptionPreviewHandler);

// GET /transactions/:transactionId - Get transaction (Manager+)
router.get('/:transactionId', authenticate, requirePermission('MANAGER_VIEW_ALL_TRANSACTIONS'), getTransactionHandler);

// PATCH /transactions/:transactionId/suspicious - Toggle suspicious (Manager+)
router.patch('/:transactionId/suspicious', authenticate, requirePermission('MANAGER_UPDATE_TRANSACTION'), toggleSuspiciousHandler);

// PATCH /transactions/:transactionId/processed - Process redemption (Cashier+)
router.patch('/:transactionId/processed', authenticate, requirePermission('CASHIER_PROCESS_REDEMPTION'), processRedemptionHandler);

module.exports = router;

