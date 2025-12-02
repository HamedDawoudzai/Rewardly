'use strict';

/**
 * Export Routes
 * Handles CSV export endpoints for data download
 */

const express = require('express');
const router = express.Router();

const {
  exportTransactions,
  exportUsers,
  exportEventAttendance,
  exportPromotions
} = require('../controllers/exportController');

const { authenticate } = require('../middleware/auth');
const { requireRankAtLeast } = require('../middleware/permissions');

// All export routes require authentication
router.use(authenticate);

/**
 * GET /export/transactions
 * Export transactions to CSV (Manager+)
 * Query params: type, status, startDate, endDate
 */
router.get('/transactions',
  requireRankAtLeast('manager'),
  exportTransactions
);

/**
 * GET /export/users
 * Export users to CSV (Manager+)
 * Query params: role, verified, activated
 */
router.get('/users',
  requireRankAtLeast('manager'),
  exportUsers
);

/**
 * GET /export/events/:eventId/attendance
 * Export event attendance to CSV (Manager+)
 */
router.get('/events/:eventId/attendance',
  requireRankAtLeast('manager'),
  exportEventAttendance
);

/**
 * GET /export/promotions
 * Export promotions to CSV (Manager+)
 * Query params: status, kind
 */
router.get('/promotions',
  requireRankAtLeast('manager'),
  exportPromotions
);

module.exports = router;

