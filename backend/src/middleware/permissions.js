'use strict';

const roleRepository = require('../repositories/roleRepository');

/**
 * Role hierarchy (spec)
 */
const ROLE_RANK = {
  regular: 1,
  cashier: 2,
  manager: 3,
  superuser: 4
};

/**
 * Determine highest role from user.roles
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
 * Check if user has DB-provided permission
 */
async function userHasPermission(userId, permissionName) {
  const roles = await roleRepository.getUserRoles(userId);
  if (!roles.length) return false;

  const roleIds = roles.map(r => r.roleId);
  return await roleRepository.hasPermission(roleIds, permissionName);
}

/**
 * Standard permission middleware
 */
function requirePermission(permissionName) {
  return async (req, res, next) => {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const allowed = await userHasPermission(req.user.id, permissionName);
      if (!allowed) {
        return res.status(403).json({ error: "Forbidden: Missing permission" });
      }

      next();
    } catch (err) {
      console.error("requirePermission error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Rank-level middleware
 */
function requireRankAtLeast(roleName) {
  const requiredRank = ROLE_RANK[roleName];

  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ error: "Authentication required" });

    const rank = req.userRank;
    if (rank < requiredRank) {
      return res.status(403).json({ error: "Insufficient role level" });
    }

    next();
  };
}

/**
 * Cannot modify equal or higher-ranked user
 * Superusers can modify anyone
 */
function requireModifyPower() {
  return (req, res, next) => {
    if (!req.user || !req.targetUser)
      return res.status(500).json({ error: "Server misconfiguration" });

    // Superusers can modify anyone
    if (req.userRole === 'superuser') {
      return next();
    }

    const actorRank = req.userRank;
    const targetRank = req.targetUserRank;

    if (actorRank <= targetRank) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You cannot modify a user with equal or higher rank"
      });
    }

    next();
  };
}

module.exports = {
  userHasPermission,
  requirePermission,
  requireRankAtLeast,
  requireModifyPower,
  ROLE_RANK,
  getPrimaryRole
};
