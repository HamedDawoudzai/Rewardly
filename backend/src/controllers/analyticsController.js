'use strict';

/**
 * Analytics Controller
 * Handles HTTP requests for analytics and forecasting
 */

const analyticsService = require('../services/analyticsService');

/**
 * GET /analytics/spending-forecast
 * Get spending forecast using linear regression
 * Query params: period (daily|weekly|monthly), lookback, predict
 */
async function getSpendingForecast(req, res) {
  try {
    const period = req.query.period || 'weekly';
    const lookback = parseInt(req.query.lookback) || 12;
    const predict = parseInt(req.query.predict) || 4;

    // Validate period
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ 
        error: 'Invalid period. Must be daily, weekly, or monthly' 
      });
    }

    // Validate lookback and predict
    if (lookback < 1 || lookback > 52) {
      return res.status(400).json({ 
        error: 'Lookback must be between 1 and 52' 
      });
    }

    if (predict < 1 || predict > 12) {
      return res.status(400).json({ 
        error: 'Predict must be between 1 and 12' 
      });
    }

    const forecast = await analyticsService.getSpendingForecast(period, lookback, predict);
    return res.status(200).json(forecast);

  } catch (error) {
    console.error('Error getting spending forecast:', error);
    return res.status(500).json({ error: 'Failed to generate spending forecast' });
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
  getSpendingForecast,
  getTransactionStats
};

