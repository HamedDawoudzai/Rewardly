'use strict';

const { verifyToken } = require('../utils/jwt');
const userRepository = require('../repositories/userRepository');

/**
 * Role hierarchy (higher number = more power)
 */
const ROLE_RANK = {
  regular: 1,
  cashier: 2,
  manager: 3,
  superuser: 4
};

/**
 * Helper — extract highest role for user
 */
function getPrimaryRole(user) {
  if (!user.roles || user.roles.length === 0) return 'regular';

  const names = user.roles.map(r => r.role.name);

  if (names.includes('superuser')) return 'superuser';
  if (names.includes('manager')) return 'manager';
  if (names.includes('cashier')) return 'cashier';

  return 'regular';
}

/**
 * Middleware to authenticate JWT token
 * Attaches full RBAC info:
 *   req.userRole  = "manager"
 *   req.userRank  = 3
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.error('[AUTH] Missing auth header');
      return res.status(401).json({ error: 'No authorization header provided' });
    }

    if (authHeader.includes('undefined')) {
      console.error('[AUTH] Invalid header (undefined)');
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.error('[AUTH] Wrong Bearer format');
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    const token = parts[1];
    if (!token || token === 'undefined' || token.trim() === '') {
      console.error('[AUTH] Empty token');
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    const decoded = verifyToken(token);

    const user = await userRepository.findUserById(decoded.sub, {
      include: {
        roles: { include: { role: true } },
        account: true
      }
    });

    if (!user) {
      console.error('[AUTH] User not found');
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActivated) {
      console.error('[AUTH] User not activated');
      return res.status(403).json({ error: 'Account not activated' });
    }

    // 🔥 Determine exact role & rank
    const primaryRole = getPrimaryRole(user);
    const rank = ROLE_RANK[primaryRole];

    // Attach to request
    req.user = user;
    req.token = decoded;
    req.userRole = primaryRole;   // "manager"
    req.userRank = rank;          // 3

    console.log('[AUTH] User authenticated:', {
      userId: user.id,
      utorid: user.username,
      primaryRole,
      rank
    });

    next();
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      console.error('[AUTH] Invalid token');
      return res.status(401).json({ error: error.message });
    }

    console.error('[AUTH] Server error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  authenticate
};
