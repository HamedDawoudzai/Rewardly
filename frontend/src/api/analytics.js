/**
 * Analytics API
 * Handles requests for spending forecasts and statistics
 */

import { apiFetch } from './api';

export const analyticsAPI = {
  /**
   * Get spending forecast using linear regression
   * @param {Object} params - Query parameters
   * @param {string} params.period - 'daily', 'weekly', or 'monthly'
   * @param {number} params.lookback - Number of periods to analyze
   * @param {number} params.predict - Number of future periods to predict
   */
  async getSpendingForecast(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.period) queryParams.append('period', params.period);
    if (params.lookback) queryParams.append('lookback', params.lookback);
    if (params.predict) queryParams.append('predict', params.predict);
    
    const queryString = queryParams.toString();
    const url = `/analytics/spending-forecast${queryString ? `?${queryString}` : ''}`;
    
    return apiFetch(url);
  },

  /**
   * Get general transaction statistics
   */
  async getStats() {
    return apiFetch('/analytics/stats');
  }
};

