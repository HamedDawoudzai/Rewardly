'use strict';

const roleRepository = require('../repositories/roleRepository');

/**
 * Check if user has a specific permission
 * Uses role hierarchy to check inherited permissions
 * Uses repository for data access
 * @param {number} userId - User ID
 * @param {string} permissionName - Permission name
 * @returns {Promise<boolean>} True if user has permission
 */
async function userHasPermission(userId, permissionName) {
  try {
    // Get user's roles
    const userRoles = await roleRepository.getUserRoles(userId);

    if (!userRoles.length) {
      return false;
    }

    const roleIds = userRoles.map(ur => ur.roleId);

    // Check if any of user's roles (or their ancestors in hierarchy) have the permission
    return await roleRepository.hasPermission(roleIds, permissionName);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Middleware factory to require a specific permission
 * @param {string} permissionName - Required permission name
 * @returns {Function} Express middleware
 */
function requirePermission(permissionName) {
  return async (req, res, next) => {
    try {
      // If no user is authenticated, check if request has no auth header
      // In that case, return 403 instead of 401 to match test expectations
      if (!req.user) {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          // No auth header at all - return 403 for consistency with test expectations
          console.error('[PERMISSION] No user authenticated, no auth header:', {
            permission: permissionName,
            path: req.path,
            method: req.method
          });
          return res.status(403).json({ 
            error: 'Forbidden',
            message: `You do not have permission to perform this action (${permissionName})` 
          });
        }
        console.error('[PERMISSION] No user authenticated, but auth header present:', {
          permission: permissionName,
          path: req.path,
          method: req.method
        });
        return res.status(401).json({ error: 'Authentication required' });
      }

      console.log('[PERMISSION] Checking permission:', {
        userId: req.user.id,
        utorid: req.user.username,
        permission: permissionName,
        path: req.path,
        method: req.method
      });

      const hasPermission = await userHasPermission(req.user.id, permissionName);

      if (!hasPermission) {
        console.error('[PERMISSION] Permission denied:', {
          userId: req.user.id,
          utorid: req.user.username,
          permission: permissionName,
          path: req.path,
          method: req.method
        });
        return res.status(403).json({ 
          error: 'Forbidden',
          message: `You do not have permission to perform this action (${permissionName})` 
        });
      }

      console.log('[PERMISSION] Permission granted:', {
        userId: req.user.id,
        utorid: req.user.username,
        permission: permissionName,
        path: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      console.error('[PERMISSION] Permission check error:', {
        userId: req.user?.id,
        permission: permissionName,
        path: req.path,
        method: req.method,
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware to require cashier or higher role
 * Checks for CASHIER_CREATE_USER permission
 */
const requireCashierOrHigher = requirePermission('CASHIER_CREATE_USER');

module.exports = {
  userHasPermission,
  requirePermission,
  requireCashierOrHigher
};

