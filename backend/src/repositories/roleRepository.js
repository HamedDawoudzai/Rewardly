'use strict';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Role Repository
 * Handles all database operations related to roles and permissions
 */

/**
 * Get user's roles
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of user roles
 */
async function getUserRoles(userId) {
  return await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  });
}

/**
 * Check if user has a specific permission
 * @param {Array<number>} roleIds - User's role IDs
 * @param {string} permissionName - Permission name to check
 * @returns {Promise<boolean>} True if user has permission
 */
async function hasPermission(roleIds, permissionName) {
  const result = await prisma.rolePermission.findFirst({
    where: {
      permission: { name: permissionName },
      role: {
        OR: [
          // Direct permission (role has the permission)
          { id: { in: roleIds } },
          // Inherited permission (ancestor role has the permission)
          {
            descendantOf: {
              some: {
                ancestorId: { in: roleIds }
              }
            }
          }
        ]
      }
    }
  });

  return !!result;
}

/**
 * Get all permissions for given role IDs (including inherited)
 * @param {Array<number>} roleIds - Role IDs
 * @returns {Promise<Array>} Array of permissions
 */
async function getPermissionsForRoles(roleIds) {
  return await prisma.rolePermission.findMany({
    where: {
      role: {
        OR: [
          { id: { in: roleIds } },
          {
            descendantOf: {
              some: {
                ancestorId: { in: roleIds }
              }
            }
          }
        ]
      }
    },
    include: {
      permission: true
    }
  });
}

/**
 * Find role by name
 * @param {string} name - Role name
 * @returns {Promise<Object|null>} Role object or null
 */
async function findRoleByName(name) {
  return await prisma.role.findUnique({
    where: { name }
  });
}

/**
 * Assign role to user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} Created UserRole
 */
async function assignRoleToUser(userId, roleId) {
  return await prisma.userRole.create({
    data: {
      userId,
      roleId
    }
  });
}

/**
 * Remove role from user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} Deleted UserRole
 */
async function removeRoleFromUser(userId, roleId) {
  return await prisma.userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId
      }
    }
  });
}

module.exports = {
  getUserRoles,
  hasPermission,
  getPermissionsForRoles,
  findRoleByName,
  assignRoleToUser,
  removeRoleFromUser
};

