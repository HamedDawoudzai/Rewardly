// API Configuration
// Use /api prefix which will be proxied to backend by Vite
const API_BASE_URL = import.meta.env.PROD ? 'http://localhost:3000' : '/api';

/**
 * Base fetch wrapper with error handling
 * Exported for use by other API modules
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.error || 'An error occurred',
        data
      };
    }

    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 0,
      message: 'Network error. Please check your connection.',
      data: null
    };
  }
}

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Login with utorid and password
   * @param {string} utorid - User's UTORid
   * @param {string} password - User's password
   * @returns {Promise<{token: string, user: object}>}
   */
  login: async (utorid, password) => {
    return apiFetch('/auth/tokens', {
      method: 'POST',
      body: JSON.stringify({ utorid, password }),
    });
  },

  /**
   * Request password reset
   * @param {string} utorid - User's UTORid
   */
  requestPasswordReset: async (utorid) => {
    return apiFetch('/auth/resets', {
      method: 'POST',
      body: JSON.stringify({ utorid }),
    });
  },

  /**
   * Reset password with token
   * @param {string} resetToken - Reset token
   * @param {string} utorid - User's UTORid
   * @param {string} password - New password
   */
  resetPassword: async (resetToken, utorid, password) => {
    return apiFetch(`/auth/resets/${resetToken}`, {
      method: 'POST',
      body: JSON.stringify({ utorid, password }),
    });
  },
};

/**
 * User API
 */
export const userAPI = {
  /**
   * Get current user profile
   */
  getProfile: async () => {
    return apiFetch('/users/me');
  },

  /**
   * Update current user profile
   */
  updateProfile: async (data) => {
    return apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    return apiFetch('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  /**
   * Get user transactions
   */
  getTransactions: async () => {
    return apiFetch('/users/me/transactions');
  },
};

export default {
  authAPI,
  userAPI,
};

