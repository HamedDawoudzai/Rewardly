'use strict';

const jwt = require('jsonwebtoken');

// Use environment variable or default secret (for development only)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id, email, tokenVersion
 * @param {Array} roles - User's roles (can be UserRole objects or role names)
 * @returns {string} JWT token
 */
function generateToken(user, roles) {
  // Handle roles - can be array of UserRole objects or array of role names
  let roleNames = [];
  if (roles && roles.length > 0) {
    if (typeof roles[0] === 'string') {
      roleNames = roles;
    } else if (roles[0].role) {
      roleNames = roles.map(r => r.role.name);
    } else {
      roleNames = roles.map(r => r.name || r);
    }
  }
  
  const payload = {
    sub: user.id,
    email: user.email,
    roles: roleNames,
    tokenVersion: user.tokenVersion || 0
  };

  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate token');
  }
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET
};
