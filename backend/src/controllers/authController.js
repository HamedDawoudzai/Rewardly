'use strict';

const authService = require('../services/authService');
const {
  validateLogin,
  validateResetRequest,
  validateResetPassword
} = require('../utils/validation');
const { z } = require('zod');

/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */

/**
 * POST /auth/tokens
 * Login and get JWT token
 */
async function loginHandler(req, res) {
  try {
    const validatedData = validateLogin(req.body);
    const result = await authService.login(validatedData.utorid, validatedData.password);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: error.message });
    }
    if (error.code === 'NOT_ACTIVATED') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /auth/resets
 * Request password reset
 */
async function requestResetHandler(req, res) {
  try {
    const validatedData = validateResetRequest(req.body);
    const ip = req.ip || req.connection.remoteAddress;
    
    const result = await authService.requestPasswordReset(validatedData.utorid, ip);
    return res.status(202).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error requesting password reset:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /auth/resets/:resetToken
 * Reset password with token
 */
async function resetPasswordHandler(req, res) {
  try {
    const resetToken = req.params.resetToken;
    const validatedData = validateResetPassword(req.body);
    
    await authService.resetPassword(resetToken, validatedData.utorid, validatedData.password);
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: error.message });
    }
    if (error.code === 'UNAUTHORIZED') {
      return res.status(401).json({ error: error.message });
    }
    if (error.code === 'EXPIRED') {
      return res.status(410).json({ error: error.message });
    }
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  loginHandler,
  requestResetHandler,
  resetPasswordHandler
};
