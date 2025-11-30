// API Configuration
const API_BASE_URL = import.meta.env.PROD ? 'http://localhost:3000' : '/api';

/**
 * Base fetch wrapper with improved structured errors
 * Does NOT break existing functionality
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

    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    // ✅ Standardize success return (nonbreaking)
    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        ...data,
      };
    }

    // ❌ Backend returned an error
    const errorObj = {
      ok: false,
      status: response.status,
      message: data.error || 'An error occurred',
      data,
    };

    throw errorObj;

  } catch (error) {
    // Network failure (server unreachable)
    if (!error.status) {
      throw {
        ok: false,
        status: 0,
        message: 'Network error. Please check your connection.',
        data: null,
      };
    }

    // Re-throw backend error unchanged
    throw error;
  }
}

/**
 * Authentication API
 */
export const authAPI = {
  login: async (utorid, password) => {
    return apiFetch('/auth/tokens', {
      method: 'POST',
      body: JSON.stringify({ utorid, password }),
    });
  },

  requestPasswordReset: async (utorid) => {
    return apiFetch('/auth/resets', {
      method: 'POST',
      body: JSON.stringify({ utorid }),
    });
  },

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
  getProfile: async () => {
    return apiFetch('/users/me');
  },

  updateProfile: async (data) => {
    return apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  changePassword: async (currentPassword, newPassword) => {
    return apiFetch('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ old: currentPassword, new: newPassword }),
    });
  },

  getTransactions: async () => {
    return apiFetch('/users/me/transactions');
  },
};

export default {
  authAPI,
  userAPI,
};
