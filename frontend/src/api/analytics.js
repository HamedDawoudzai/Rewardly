/**
 * Analytics API
 * Handles requests for spending trends and statistics
 */

import { apiFetch } from './api';

export const analyticsAPI = {
  /**
   * Get spending trend analysis using linear regression
   * @param {Object} params - Query parameters
   * @param {string} params.period - 'daily', 'weekly', or 'monthly'
   * @param {number} params.lookback - Number of periods to analyze
   */
  async getSpendingTrends(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.period) queryParams.append('period', params.period);
    if (params.lookback) queryParams.append('lookback', params.lookback);
    
    const queryString = queryParams.toString();
    const url = `/analytics/spending-trends${queryString ? `?${queryString}` : ''}`;
    
    return apiFetch(url);
  },

  /**
   * Get general transaction statistics
   */
  async getStats() {
    return apiFetch('/analytics/stats');
  }
};
