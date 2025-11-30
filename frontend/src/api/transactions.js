import { apiFetch } from './api';

/**
 * User Transaction API
 * For regular users to view their transactions and make transfers/redemptions
 */
export const transactionAPI = {
  /**
   * Get current user's transactions with pagination & filters
   * @param {Object} params - { page, limit, type, relatedId, promotionId, amount, operator }
   */
  getMyTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/users/me/transactions${query ? `?${query}` : ''}`);
  },

  /**
   * Get transaction by ID (for user's own transactions)
   * @param {number} id - Transaction ID
   */
  getById: async (id) => {
    // Note: This fetches from user's transactions, filter client-side
    const response = await apiFetch('/users/me/transactions');
    const transactions = response.results || response;
    return transactions.find(t => t.id === parseInt(id)) || null;
  },

  /**
   * Create redemption request
   * @param {number} amount - Points to redeem
   * @param {string} remark - Optional remark
   */
  createRedemption: async (amount, remark = '') => {
    return apiFetch('/users/me/transactions', {
      method: 'POST',
      body: JSON.stringify({ type: 'redemption', amount, remark }),
    });
  },

  /**
   * Transfer points to another user
   * @param {number} userId - Recipient user ID
   * @param {number} amount - Points to transfer
   * @param {string} remark - Optional remark
   */
  transferPoints: async (userId, amount, remark = '') => {
    return apiFetch(`/users/${userId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({ type: 'transfer', amount, remark }),
    });
  },
};

/**
 * Admin Transaction API (Cashier/Manager)
 * For cashiers and managers to create/manage transactions
 */
export const adminTransactionAPI = {
  /**
   * Get all transactions with pagination & filters (Manager+)
   * @param {Object} params - { page, limit, type, name, createdBy, suspicious, promotionId, relatedId, amount, operator }
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    return apiFetch(`/transactions${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get transaction by ID (Manager+)
   * @param {number} id - Transaction ID
   */
  getById: async (id) => {
    return apiFetch(`/transactions/${id}`);
  },

  /**
   * Create a purchase transaction (Cashier+)
   * @param {Object} data - { utorid, spent, promotionIds?, remark? }
   */
  createPurchase: async (data) => {
    return apiFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'purchase',
        utorid: data.utorid,
        spent: parseFloat(data.spent),
        promotionIds: data.promotionIds || [],
        remark: data.remark || null,
      }),
    });
  },

  /**
   * Create an adjustment transaction (Manager+)
   * @param {Object} data - { utorid, amount, relatedId?, remark? }
   */
  createAdjustment: async (data) => {
    return apiFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'adjustment',
        utorid: data.utorid,
        amount: parseInt(data.amount),
        relatedId: data.relatedId || null,
        remark: data.remark || null,
      }),
    });
  },

  /**
   * Toggle suspicious flag on a transaction (Manager+)
   * @param {number} id - Transaction ID
   * @param {boolean} suspicious - New suspicious status
   */
  toggleSuspicious: async (id, suspicious) => {
    return apiFetch(`/transactions/${id}/suspicious`, {
      method: 'PATCH',
      body: JSON.stringify({ suspicious }),
    });
  },

  /**
   * Process a redemption transaction (Cashier+)
   * @param {number} id - Transaction ID
   */
  processRedemption: async (id) => {
    return apiFetch(`/transactions/${id}/processed`, {
      method: 'PATCH',
      body: JSON.stringify({ processed: true }),
    });
  },

  /**
   * Get redemption preview for cashier (Cashier+)
   * Returns limited info about a pending redemption
   * @param {number} id - Transaction ID
   */
  getRedemptionPreview: async (id) => {
    return apiFetch(`/transactions/${id}/redemption`);
  },
};

