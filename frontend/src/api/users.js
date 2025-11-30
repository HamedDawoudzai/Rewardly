import { apiFetch } from './api';

/**
 * Admin User API (Cashier / Manager / Superuser)
 * For managing users, user lists, verification, activation, and role management
 */
export const usersAPI = {
  /**
   * List all users (Manager+)
   * @param {Object} params  – optional filters:
   * { page, limit, name, role, verified, activated }
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/users${query ? `?${query}` : ''}`);
  },

  /**
   * Get user by ID (Cashier+)
   */
  getById: async (userId) => {
    return apiFetch(`/users/${userId}`);
  },

  /**
   * Create new user (Cashier+)
   */
  create: async (data) => {
    return apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update any user fields (Manager+)
   */
  update: async (userId, data) => {
    return apiFetch(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update user role (Superuser only)
   */
  updateRole: async (userId, role) => {
    return apiFetch(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  /**
   * Verify or unverify user (Manager+)
   */
  setVerified: async (userId, verified) => {
    return apiFetch(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ verified }),
    });
  },
};

export default usersAPI;
