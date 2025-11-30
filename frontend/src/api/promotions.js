// src/api/promotions.js
import { apiFetch } from './api';

/**
 * Promotion API
 * For viewing and managing promotions
 */
export const promotionAPI = {
  /**
   * List promotions with pagination & filters
   * @param {Object} params - { page, limit, name, type, started, ended }
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/promotions${query ? `?${query}` : ''}`);
  },

  /**
   * Get single promotion by ID
   * @param {number|string} id - Promotion ID
   */
  getById: async (id) => {
    return apiFetch(`/promotions/${id}`);
  },

  /**
   * Create new promotion (Manager+)
   * @param {Object} data - { name, description, type, startDate, endDate, minSpending, rate, points }
   */
  create: async (data) => {
    return apiFetch('/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update promotion (Manager+)
   * @param {number|string} id - Promotion ID
   * @param {Object} data - Fields to update
   */
  update: async (id, data) => {
    return apiFetch(`/promotions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete promotion (Manager+)
   * @param {number|string} id - Promotion ID
   */
  delete: async (id) => {
    return apiFetch(`/promotions/${id}`, {
      method: 'DELETE',
    });
  },
};

export default promotionAPI;
