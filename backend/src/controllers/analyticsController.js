'use strict';

/**
 * Analytics Controller
 * Handles HTTP requests for analytics and trend analysis
 */

const analyticsService = require('../services/analyticsService');

/**
 * GET /analytics/spending-trends
 * Get spending trend analysis using linear regression
 * Query params: period (daily|weekly|monthly), lookback
 */
async function getSpendingTrends(req, res) {
  try {
    const period = req.query.period || 'weekly';
    const lookback = req.query.lookback ? parseInt(req.query.lookback) : null;

    // Validate period
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ 
        error: 'Invalid period. Must be daily, weekly, or monthly' 
      });
    }

    // Validate lookback if provided
    if (lookback !== null && (lookback < 1 || lookback > 365)) {
      return res.status(400).json({ 
        error: 'Lookback must be between 1 and 365' 
      });
    }

    const trends = await analyticsService.getSpendingTrends(period, lookback);
    return res.status(200).json(trends);

  } catch (error) {
    console.error('Error getting spending trends:', error);
    return res.status(500).json({ error: 'Failed to generate spending trends' });
  }
}

/**
 * GET /analytics/stats
 * Get general transaction statistics
 */
async function getTransactionStats(req, res) {
  try {
    const stats = await analyticsService.getTransactionStats();
    return res.status(200).json(stats);

  } catch (error) {
    console.error('Error getting transaction stats:', error);
    return res.status(500).json({ error: 'Failed to get transaction statistics' });
  }
}

module.exports = {
  getSpendingTrends,
  getTransactionStats
};
