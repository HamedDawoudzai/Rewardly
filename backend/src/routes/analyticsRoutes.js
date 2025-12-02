'use strict';

/**
 * Analytics Routes
 * Endpoints for spending trends and statistics
 */

const express = require('express');
const router = express.Router();

const {
  getSpendingTrends,
  getTransactionStats
} = require('../controllers/analyticsController');

const { authenticate } = require('../middleware/auth');
const { requireRankAtLeast } = require('../middleware/permissions');

// All analytics routes require authentication and manager+ role
router.use(authenticate);
router.use(requireRankAtLeast('manager'));

/**
 * GET /analytics/spending-trends
 * Get spending trend analysis using linear regression
 * Query params: period (daily|weekly|monthly), lookback
 */
router.get('/spending-trends', getSpendingTrends);

/**
 * GET /analytics/stats
 * Get general transaction statistics
 */
router.get('/stats', getTransactionStats);

module.exports = router;
