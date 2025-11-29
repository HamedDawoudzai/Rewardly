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
 * NOTE: This section should be implemented by Package 4 team member
 * Leaving placeholder exports to prevent import errors
 */
export const adminTransactionAPI = {
  // TODO: Implement in Package 4
  getAll: async () => { throw new Error('Not implemented - Package 4'); },
  getById: async () => { throw new Error('Not implemented - Package 4'); },
  createPurchase: async () => { throw new Error('Not implemented - Package 4'); },
  createAdjustment: async () => { throw new Error('Not implemented - Package 4'); },
  toggleSuspicious: async () => { throw new Error('Not implemented - Package 4'); },
  processRedemption: async () => { throw new Error('Not implemented - Package 4'); },
};

