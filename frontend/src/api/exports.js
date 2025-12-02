/**
 * Export API
 * Handles CSV export downloads from backend
 */

import { getToken } from '@/utils/auth';

const API_BASE = '/api';

/**
 * Helper to trigger file download from authenticated endpoint
 * @param {string} url - API endpoint URL
 * @param {string} defaultFilename - Fallback filename if server doesn't provide one
 */
async function downloadFile(url, defaultFilename) {
  const token = getToken();
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Export failed');
  }

  // Get filename from Content-Disposition header or use default
  const disposition = response.headers.get('Content-Disposition');
  const filenameMatch = disposition?.match(/filename="?(.+?)"?$/);
  const filename = filenameMatch?.[1] || defaultFilename;

  // Convert response to blob and trigger download
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Build query string from filters object
 * @param {Object} filters - Filter parameters
 * @returns {string} Query string
 */
function buildQueryString(filters) {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export const exportAPI = {
  /**
   * Download transactions CSV
   * @param {Object} filters - Optional filters (type, status, startDate, endDate)
   */
  async downloadTransactions(filters = {}) {
    const query = buildQueryString(filters);
    await downloadFile(
      `${API_BASE}/export/transactions${query}`, 
      'transactions.csv'
    );
  },

  /**
   * Download users CSV
   * @param {Object} filters - Optional filters (role, verified, activated)
   */
  async downloadUsers(filters = {}) {
    const query = buildQueryString(filters);
    await downloadFile(
      `${API_BASE}/export/users${query}`, 
      'users.csv'
    );
  },

  /**
   * Download event attendance CSV
   * @param {number} eventId - Event ID
   */
  async downloadEventAttendance(eventId) {
    await downloadFile(
      `${API_BASE}/export/events/${eventId}/attendance`, 
      `event_${eventId}_attendance.csv`
    );
  },

  /**
   * Download promotions CSV
   * @param {Object} filters - Optional filters (status, kind)
   */
  async downloadPromotions(filters = {}) {
    const query = buildQueryString(filters);
    await downloadFile(
      `${API_BASE}/export/promotions${query}`, 
      'promotions.csv'
    );
  }
};

