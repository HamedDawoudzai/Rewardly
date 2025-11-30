import { apiFetch } from './api';

/**
 * Admin User API (Cashier / Manager / Superuser)
 * For managing users, lists, roles, activation, verification
 */
export const usersAPI = {
  /**
   * List all users (Manager+)
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/users${query ? `?${query}` : ''}`);
  },

  /**
   * Get a user by ID (Cashier+)
   */
  getById: async (userId) => {
    return apiFetch(`/users/${userId}`);
  },

  /**
   * Create a new user (Manager+)
   */
  create: async (data) => {
    return apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update any user fields (Manager+)
   * Includes role changes, verification, activation, name/email edits
   */
  update: async (userId, data) => {
    return apiFetch(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update user role (Superuser only)
   * Provided separately in case of role-specific UIs
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
