'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../utils/jwt');
const userRepository = require('../repositories/userRepository');
const emailService = require('./emailService');


/**
 * Authentication Service
 * Handles login, password resets, and authentication operations
 */

/**
 * Authenticate user and generate JWT token
 * @param {string} utorid - Username
 * @param {string} password - User password
 * @returns {Promise<Object>} Token and expiration
 * @throws {Error} If authentication fails
 */
async function login(utorid, password) {
  // Find user by username (utorid in spec = username in DB)
  const user = await userRepository.findUserByUsername(utorid, {
    include: {
      roles: {
        include: {
          role: true
        }
      },
      account: true
    }
  });

  if (!user) {
    const error = new Error('Invalid utorid or password');
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValidPassword) {
    const error = new Error('Invalid utorid or password');
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  // Check if user is activated
  if (!user.isActivated) {
    const error = new Error('Account not activated');
    error.code = 'NOT_ACTIVATED';
    throw error;
  }

  // Generate JWT token
  const token = generateToken(user, user.roles);
  
  // Calculate expiration (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Record last login timestamp
  try {
    await userRepository.updateUser(user.id, { lastLogin: new Date() });
  } catch (e) {

    console.error('Failed to update lastLogin for user', user.id, e);
  }

  return {
    token,
    expiresAt: expiresAt.toISOString()
  };
}

/**
 * Check rate limit for password reset
 * @param {string} ip - IP address
 * @returns {boolean} True if allowed
 */
function checkResetRateLimit(ip) {
  const now = Date.now();
  const attempts = resetAttempts.get(ip) || [];
  
  // Filter out attempts older than 1 minute
  const recentAttempts = attempts.filter(time => now - time < RESET_LIMIT_WINDOW);
  
  if (recentAttempts.length >= RESET_LIMIT_MAX) {
    return false;
  }
  
  // Record this attempt
  recentAttempts.push(now);
  resetAttempts.set(ip, recentAttempts);
  
  return true;
}

/**
 * Request password reset
 * @param {string} utorid - Username
 * @param {string} ip - Requester IP address (unused, kept for API compatibility)
 * @returns {Promise<Object>} Reset token and expiration
 * @throws {Error} If user not found
 */
async function requestPasswordReset(utorid, ip) {
  // Find user
  const user = await userRepository.findUserByUsername(utorid);
  
  if (!user) {
    // Return 404 if user not found (per test case)
    const error = new Error('User not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Generate reset token
  const resetToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

  // Store reset token
  await userRepository.createPasswordResetToken(user.id, resetToken, expiresAt);

  // Generate reset URL
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

  // Send password reset email
  try {
    await emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetUrl,
      expiresAt
    );
  } catch (emailError) {
    // Log error but don't fail the request
    // The token is already created, so user can still reset if they have the link
    console.error('Failed to send password reset email:', emailError);
  }

  // Don't return resetToken in response for security
  // The token is sent via email only
  return {
    expiresAt: expiresAt.toISOString()
    // resetToken removed - sent via email instead
  };
}

/**
 * Reset password using reset token
 * @param {string} resetToken - Reset token
 * @param {string} utorid - Username
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success message
 * @throws {Error} If token invalid or expired
 */
async function resetPassword(resetToken, utorid, newPassword) {
  // Find token first
  const tokenRecord = await userRepository.findPasswordResetToken(resetToken);
  
  if (!tokenRecord) {
    // Check if user exists to return appropriate error
    const user = await userRepository.findUserByUsername(utorid);
    if (!user) {
      const error = new Error('User not found');
      error.code = 'NOT_FOUND';
      throw error;
    }
    const error = new Error('Invalid or expired reset token');
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Check if token has been used
  if (tokenRecord.usedAt) {
    const error = new Error('Reset token has already been used');
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Check if token is expired
  if (new Date() > tokenRecord.expiresAt) {
    const error = new Error('Reset token has expired');
    error.code = 'EXPIRED';
    throw error;
  }

  // Verify utorid matches (this should return 401, not 404)
  if (tokenRecord.user.username !== utorid) {
    const error = new Error('Invalid reset token');
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  // Hash new password
  const SALT_ROUNDS = 10;
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password and mark token as used
  await userRepository.updatePassword(tokenRecord.userId, passwordHash);
  
  // Also activate the user if not already activated (for initial setup)
  if (!tokenRecord.user.isActivated) {
    await userRepository.updateUser(tokenRecord.userId, {
      isActivated: true
    });
  }

  return { success: true };
}

module.exports = {
  login,
  requestPasswordReset,
  resetPassword
};
