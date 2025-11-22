'use strict';

const { verifyToken } = require('../utils/jwt');
const userRepository = require('../repositories/userRepository');

/**
 * Middleware to authenticate JWT token
 * Extracts token from Authorization header and verifies it
 * Attaches user to req.user
 * Uses repository for data access
 */
async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.error('[AUTH] No authorization header:', {
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'No authorization header provided' });
    }

    // Check for invalid Bearer token format (e.g., "Bearer undefined")
    if (authHeader.includes('undefined')) {
      console.error('[AUTH] Authorization header contains undefined:', {
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.error('[AUTH] Invalid authorization format:', {
        path: req.path,
        method: req.method,
        headerLength: parts.length
      });
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    const token = parts[1];
    
    // Check if token is empty or undefined
    if (!token || token === 'undefined' || token.trim() === '') {
      console.error('[AUTH] Empty token:', {
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    // Verify token
    const decoded = verifyToken(token);
    console.log('[AUTH] Token verified:', {
      userId: decoded.sub,
      path: req.path,
      method: req.method
    });

    // Fetch user from database
    const user = await userRepository.findUserById(decoded.sub, {
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
      console.error('[AUTH] User not found:', {
        userId: decoded.sub,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user is activated
    if (!user.isActivated) {
      console.error('[AUTH] User not activated:', {
        userId: user.id,
        utorid: user.username,
        path: req.path,
        method: req.method
      });
      return res.status(403).json({ error: 'Account not activated' });
    }

    // Attach user to request
    req.user = user;
    req.token = decoded;
    
    console.log('[AUTH] Authentication successful:', {
      userId: user.id,
      utorid: user.username,
      roles: user.roles.map(r => r.role.name),
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      console.error('[AUTH] Invalid or expired token:', {
        path: req.path,
        method: req.method,
        error: error.message,
        authHeader: req.headers.authorization ? 'present' : 'missing',
        tokenPreview: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'none'
      });
      return res.status(401).json({ error: error.message });
    }
    console.error('[AUTH] Authentication error:', {
      path: req.path,
      method: req.method,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  authenticate
};

