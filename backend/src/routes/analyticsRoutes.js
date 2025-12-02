'use strict';

/**
 * Analytics Routes
 * Endpoints for spending forecasts and statistics
 */

const express = require('express');
const router = express.Router();

const {
  getSpendingForecast,
  getTransactionStats
} = require('../controllers/analyticsController');

const { authenticate } = require('../middleware/auth');
const { requireRankAtLeast } = require('../middleware/permissions');

// All analytics routes require authentication and manager+ role
router.use(authenticate);
router.use(requireRankAtLeast('manager'));

/**
 * GET /analytics/spending-forecast
 * Get spending forecast using linear regression
 * Query params: period (daily|weekly|monthly), lookback, predict
 */
router.get('/spending-forecast', getSpendingForecast);

/**
 * GET /analytics/stats
 * Get general transaction statistics
 */
router.get('/stats', getTransactionStats);

module.exports = router;

