'use strict';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * User Repository
 * Handles all database operations related to users
 */

/**
 * Find user by ID
 * @param {number} userId - User ID
 * @param {Object} options - Query options (include relations, etc.)
 * @returns {Promise<Object|null>} User object or null
 */
async function findUserById(userId, options = {}) {
  return await prisma.user.findUnique({
    where: { id: userId },
    ...options
  });
}

/**
 * Find user by email
 * @param {string} email - Email address
 * @param {Object} options - Query options
 * @returns {Promise<Object|null>} User object or null
 */
async function findUserByEmail(email, options = {}) {
  return await prisma.user.findUnique({
    where: { email },
    ...options
  });
}

/**
 * Find user by username
 * @param {string} username - Username
 * @param {Object} options - Query options
 * @returns {Promise<Object|null>} User object or null
 */
async function findUserByUsername(username, options = {}) {
  return await prisma.user.findUnique({
    where: { username },
    ...options
  });
}

/**
 * Find user by email or username
 * @param {string} email - Email
 * @param {string} username - Username
 * @returns {Promise<Object|null>} User object or null
 */
async function findUserByEmailOrUsername(email, username) {
  return await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { username: username }
      ]
    }
  });
}

/**
 * Create a new user with all related entities in a transaction
 * @param {Object} userData - User creation data
 * @param {string} userData.username - Username
 * @param {string} userData.email - Email
 * @param {string} userData.passwordHash - Hashed password
 * @param {string} userData.name - Full name
 * @param {string} activationToken - Activation token
 * @param {Date} tokenExpiresAt - Token expiration date
 * @returns {Promise<Object>} Created user and token
 */
async function createUserWithRelations(userData, activationToken, tokenExpiresAt) {
  return await prisma.$transaction(async (tx) => {
    // Create user (not activated until they complete password reset flow)
    const user = await tx.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        passwordHash: userData.passwordHash,
        name: userData.name,
        isActivated: false,
        isStudentVerified: false,
        isSuspicious: false,
        tokenVersion: 0
      }
    });

    // Create loyalty account
    await tx.loyaltyAccount.create({
      data: {
        userId: user.id,
        pointsCached: 0
      }
    });

    // Assign regular role
    const regularRole = await tx.role.findUnique({
      where: { name: 'regular' }
    });

    if (regularRole) {
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: regularRole.id
        }
      });
    }

    // Create password reset token (for initial password setup)
    const token = await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        token: activationToken,
        expiresAt: tokenExpiresAt
      }
    });

    return { user, token };
  });
}

/**
 * Update user
 * @param {number} userId - User ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated user
 */
async function updateUser(userId, data) {
  return await prisma.user.update({
    where: { id: userId },
    data
  });
}

/**
 * Delete user (soft delete by deactivating)
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
async function deactivateUser(userId) {
  return await prisma.user.update({
    where: { id: userId },
    data: { isActivated: false }
  });
}

/**
 * Find users with filters and pagination
 * @param {Object} filters - Filter criteria
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Promise<{users: Array, total: number}>} Users and total count
 */
async function findUsersWithFilters(filters = {}, page = 1, limit = 10) {
  const where = {};
  
  if (filters.name) {
    where.OR = [
      { name: { contains: filters.name } },
      { username: { contains: filters.name } }
    ];
  }
  
  if (filters.verified !== undefined) {
    where.isStudentVerified = filters.verified;
  }
  
  if (filters.activated !== undefined) {
    // "activated" means user has logged in at least once (lastLogin is set)
    if (filters.activated) {
      where.lastLogin = { not: null };
    } else {
      where.lastLogin = null;
    }
  }
  
  if (filters.role) {
    where.roles = {
      some: {
        role: {
          name: filters.role
        }
      }
    };
  }
  
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        roles: { include: { role: true } },
        account: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);
  
  return { users, total };
}

/**
 * Get user's available one-time promotions
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of available promotions
 */
async function getUserAvailablePromotions(userId) {
  const now = new Date();
  
  // Find one-time promotions that user hasn't used
  return await prisma.promotion.findMany({
    where: {
      kind: 'onetime',
      status: 'active',
      startsAt: { lte: now },
      OR: [
        { endsAt: null },
        { endsAt: { gte: now } }
      ],
      redemptions: {
        none: {
          userId,
          usedAt: { not: null }
        }
      }
    }
  });
}

/**
 * Increment user's token version (for token invalidation)
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
async function incrementTokenVersion(userId) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      tokenVersion: {
        increment: 1
      }
    }
  });
}

/**
 * Find password reset token
 * @param {string} token - Reset token
 * @returns {Promise<Object|null>} Token object or null
 */
async function findPasswordResetToken(token) {
  return await prisma.passwordResetToken.findUnique({
    where: { token },
    include: {
      user: true
    }
  });
}

/**
 * Create password reset token
 * @param {number} userId - User ID
 * @param {string} token - Reset token
 * @param {Date} expiresAt - Expiration date
 * @returns {Promise<Object>} Created token
 */
async function createPasswordResetToken(userId, token, expiresAt) {
  // Invalidate any existing tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() }
  });
  
  return await prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });
}

/**
 * Mark password reset token as used
 * @param {string} token - Reset token
 * @returns {Promise<Object>} Updated token
 */
async function markResetTokenUsed(token) {
  return await prisma.passwordResetToken.update({
    where: { token },
    data: { usedAt: new Date() }
  });
}

/**
 * Update user's password hash
 * @param {number} userId - User ID
 * @param {string} passwordHash - New password hash
 * @returns {Promise<Object>} Updated user
 */
async function updatePassword(userId, passwordHash) {
  return await prisma.$transaction(async (tx) => {
    // Update password
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash
      }
    });
    
    // Mark all reset tokens as used
    await tx.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() }
    });
    
    return user;
  });
}

module.exports = {
  findUserById,
  findUserByEmail,
  findUserByUsername,
  findUserByEmailOrUsername,
  createUserWithRelations,
  updateUser,
  deactivateUser,
  findUsersWithFilters,
  getUserAvailablePromotions,
  incrementTokenVersion,
  findPasswordResetToken,
  createPasswordResetToken,
  markResetTokenUsed,
  updatePassword
};

