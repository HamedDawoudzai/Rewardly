'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');

const SALT_ROUNDS = 10;

/**
 * User Service
 * Handles business logic for user operations
 * Maps between API spec fields and database schema fields
 */

/**
 * Map user from DB schema to API response format
 */
function mapUserToResponse(user, includeDetails = true) {
  const result = {
    id: user.id,
    utorid: user.username,
    name: user.name,
    email: user.email,
    password: '' // Always include password field as empty string per spec
  };

  if (includeDetails) {
    result.birthday = user.birthday ? user.birthday.toISOString().split('T')[0] : null;
    result.role = user.roles && user.roles.length > 0 ? getUserRole({ roles: user.roles }) : 'regular';
    result.points = user.account ? user.account.pointsCached : 0;
    result.createdAt = user.createdAt.toISOString();
    result.lastLogin = user.lastLogin ? user.lastLogin.toISOString() : null;
    result.verified = user.isStudentVerified;
    result.avatarUrl = user.avatarUrl || null;

    // include activation state
    result.isActivated = user.isActivated;
  }

  return result;
}

/**
 * Get user's primary role name
 */
function getUserRole(user) {
  if (!user.roles || user.roles.length === 0) return 'regular';
  const roleNames = user.roles.map(r => r.role.name);
  if (roleNames.includes('superuser')) return 'superuser';
  if (roleNames.includes('manager')) return 'manager';
  if (roleNames.includes('cashier')) return 'cashier';
  return 'regular';
}

/**
 * Create a new user account
 */
async function createUser(userData) {
  const { utorid, name, email } = userData;

  const existingUser = await userRepository.findUserByEmailOrUsername(email, utorid);

  if (existingUser) {
    if (existingUser.username === utorid) {
      const error = new Error('User with this utorid already exists');
      error.code = 'USER_EXISTS';
      throw error;
    }
    if (existingUser.email === email) {
      const error = new Error('User with this email already exists');
      error.code = 'EMAIL_EXISTS';
      throw error;
    }
  }

  const tempPassword = uuidv4();
  const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

  const activationToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const newUserData = {
    username: utorid,
    email: email,
    passwordHash: passwordHash,
    name: name,
    isActivated: false
  };

  const result = await userRepository.createUserWithRelations(
    newUserData,
    activationToken,
    expiresAt
  );

  return {
    id: result.user.id,
    utorid: result.user.username,
    name: result.user.name,
    email: result.user.email,
    verified: result.user.isStudentVerified,
    expiresAt: result.token.expiresAt.toISOString(),
    resetToken: result.token.token
  };
}

/**
 * Get users with filters and pagination
 */
async function getUsers(filters = {}, page = 1, limit = 10) {
  const { users, total } = await userRepository.findUsersWithFilters(filters, page, limit);
  const results = users.map(user => mapUserToResponse(user, true));

  return {
    count: total,
    results
  };
}

/**
 * Get user by ID (manager+, cashier)
 */
async function getUserById(userId, requesterRole, requesterId) {
  const user = await userRepository.findUserById(userId, {
    include: {
      roles: { include: { role: true } },
      account: true
    }
  });

  if (!user) return null;

  const promotions = await userRepository.getUserAvailablePromotions(userId);
  const promosList = promotions.map(p => ({
    id: p.id,
    name: p.name,
    minSpending: p.minSpendCents ? p.minSpendCents / 100 : null,
    rate: p.pointsPerCentMultiplier || null,
    points: p.pointsBonus || null
  }));

  if (requesterRole === 'cashier') {
    return {
      id: user.id,
      utorid: user.username,
      name: user.name,
      password: '',
      points: user.account ? user.account.pointsCached : 0,
      verified: user.isStudentVerified,
      promotions: promosList,
      isActivated: user.isActivated
    };
  }

  if (requesterRole === 'manager' || requesterRole === 'superuser') {
    return {
      id: user.id,
      utorid: user.username,
      name: user.name,
      email: user.email,
      password: '',
      birthday: user.birthday ? user.birthday.toISOString().split('T')[0] : null,
      role: getUserRole(user),
      points: user.account ? user.account.pointsCached : 0,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
      verified: user.isStudentVerified,
      avatarUrl: user.avatarUrl || null,
      promotions: promosList,
      isActivated: user.isActivated
    };
  }

  return null;
}

/**
 * Update user (manager+)
 */
async function updateUser(userId, updates, requesterRole) {
  const user = await userRepository.findUserById(userId, {
    include: {
      roles: { include: { role: true } }
    }
  });

  if (!user) {
    const error = new Error('User not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const data = {};
  const changedFields = {};

  // ⭐ ADD NAME SUPPORT
  if (updates.name != null) {
    data.name = updates.name;
    changedFields.name = updates.name;
  }

  if (updates.email != null) {
    data.email = updates.email;
    changedFields.email = updates.email;
  }

  if (updates.verified != null) {
    data.isStudentVerified = updates.verified;
    changedFields.verified = updates.verified;
  }

  if (updates.suspicious != null) {
    data.isSuspicious = updates.suspicious;
    changedFields.suspicious = updates.suspicious;
  }

  if (updates.isActivated != null) {
    data.isActivated = updates.isActivated;
    changedFields.isActivated = updates.isActivated;
  }

  // role update
  if (updates.role != null) {
    const currentRole = getUserRole(user);

    if (requesterRole === 'manager') {
      if (!['regular', 'cashier'].includes(updates.role)) {
        const error = new Error('Managers can only set role to regular or cashier');
        error.code = 'FORBIDDEN';
        throw error;
      }
    }

    if (updates.role === 'cashier' && user.isSuspicious) {
      const error = new Error('Cannot promote suspicious user to cashier');
      error.code = 'BAD_REQUEST';
      throw error;
    }

    const newRole = await roleRepository.findRoleByName(updates.role);
    if (newRole) {
      const existingRoles = await roleRepository.getUserRoles(userId);
      for (const ur of existingRoles) {
        await roleRepository.removeRoleFromUser(userId, ur.roleId);
      }
      await roleRepository.assignRoleToUser(userId, newRole.id);
      changedFields.role = updates.role;
    }
  }

  if (Object.keys(data).length > 0) {
    await userRepository.updateUser(userId, data);
  }

  // ⭐ Return updated user, not old name
  return {
    id: user.id,
    utorid: user.username,
    name: data.name ?? user.name,  // updated name
    ...changedFields
  };
}

/**
 * Get own profile
 */
async function getOwnProfile(userId) {
  const user = await userRepository.findUserById(userId, {
    include: {
      roles: { include: { role: true } },
      account: true
    }
  });

  if (!user) return null;

  const promotions = await userRepository.getUserAvailablePromotions(userId);
  const promosList = promotions.map(p => ({
    id: p.id,
    name: p.name,
    minSpending: p.minSpendCents ? p.minSpendCents / 100 : null,
    rate: p.pointsPerCentMultiplier || null,
    points: p.pointsBonus || null
  }));

  return {
    id: user.id,
    utorid: user.username,
    name: user.name,
    email: user.email,
    password: '',
    birthday: user.birthday ? user.birthday.toISOString().split('T')[0] : null,
    role: getUserRole(user),
    points: user.account ? user.account.pointsCached : 0,
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
    verified: user.isStudentVerified,
    avatarUrl: user.avatarUrl || null,
    promotions: promosList,
    isActivated: user.isActivated
  };
}

/**
 * Update own profile
 */
async function updateOwnProfile(userId, updates) {
  const data = {};

  if (updates.name != null) data.name = updates.name;
  if (updates.email != null) data.email = updates.email;
  if (updates.birthday != null) data.birthday = new Date(updates.birthday + 'T00:00:00.000Z');
  if (updates.avatarUrl != null) data.avatarUrl = updates.avatarUrl;

  await userRepository.updateUser(userId, data);

  return await getOwnProfile(userId);
}

/**
 * Change password
 */
async function changePassword(userId, oldPassword, newPassword) {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isValid) {
    const error = new Error('Incorrect old password');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userRepository.updatePassword(userId, newPasswordHash);

  return { success: true };
}

async function getUserByIdSimple(userId) {
  return await userRepository.findUserById(userId, {
    include: {
      roles: { include: { role: true } },
      account: true
    }
  });
}

async function getUserByEmail(email) {
  return await userRepository.findUserByEmail(email, {
    include: {
      roles: { include: { role: true } },
      account: true
    }
  });
}

async function getUserByUsername(username) {
  return await userRepository.findUserByUsername(username, {
    include: {
      roles: { include: { role: true } },
      account: true
    }
  });
}

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  getOwnProfile,
  updateOwnProfile,
  changePassword,
  getUserByIdSimple,
  getUserByEmail,
  getUserByUsername,
  getUserRole
};
