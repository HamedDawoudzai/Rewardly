'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');

const SALT_ROUNDS = 10;

/**
 * ROLE HIERARCHY
 */
function getRoleRank(role) {
  switch (role) {
    case 'superuser': return 4;
    case 'manager': return 3;
    case 'cashier': return 2;
    default: return 1; // regular
  }
}

/**
 * Determine if requester can view target user
 */
async function canViewUser(requester, targetUserId) {
  const target = await userRepository.findUserById(targetUserId, {
    include: { roles: { include: { role: true } } }
  });
  if (!target) return false;

  const requesterRole = getUserRole(requester);
  const targetRole = getUserRole(target);

  // superuser can view everyone
  if (requesterRole === 'superuser') return true;

  // cannot view higher-ranked user
  return getRoleRank(requesterRole) >= getRoleRank(targetRole);
}

/**
 * Determine if requester can modify target user
 */
async function canModifyUser(requester, targetUserId) {
  const requesterRole = getUserRole(requester);
  const requesterRank = getRoleRank(requesterRole);

  // Regular + Cashier cannot modify any users
  if (requesterRank <= 2) return false;

  const target = await userRepository.findUserById(targetUserId, {
    include: { roles: { include: { role: true } } }
  });
  if (!target) return false;

  const targetRole = getUserRole(target);
  const targetRank = getRoleRank(targetRole);

  // Superuser can modify anyone
  if (requesterRole === 'superuser') return true;

  // Manager cannot modify managers (equal rank) or superusers (higher rank)
  // Only managers can modify cashiers and regular users
  return requesterRank > targetRank;
}

/**
 * Map user from DB schema to API response format
 */
function mapUserToResponse(user, includeDetails = true) {
  const result = {
    id: user.id,
    utorid: user.username,
    name: user.name,
    email: user.email,
    password: '' 
  };

  if (includeDetails) {
    result.birthday = user.birthday ? user.birthday.toISOString().split('T')[0] : null;
    result.role = user.roles && user.roles.length > 0 ? getUserRole({ roles: user.roles }) : 'regular';
    result.points = user.account ? user.account.pointsCached : 0;
    result.createdAt = user.createdAt.toISOString();
    result.lastLogin = user.lastLogin ? user.lastLogin.toISOString() : null;
    result.verified = user.isStudentVerified;
    result.avatarUrl = user.avatarUrl || null;
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
  return { count: total, results };
}

/**
 * Get user by ID
 */
async function getUserById(userId, requesterRole, requesterId) {
  const user = await userRepository.findUserById(userId, {
    include: {
      roles: { include: { role: true } },
      account: true
    }
  });

  if (!user) return null;

  return mapUserToResponse(user, true);
}

/**
 * Update user
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

  if (updates.role != null) {
    const newRole = await roleRepository.findRoleByName(updates.role);
    if (newRole) {
      // Managers cannot promote users to manager or superuser
      // Only superusers can do that
      if (requesterRole === 'manager' && (updates.role === 'manager' || updates.role === 'superuser')) {
        const error = new Error('Managers cannot promote users to manager or superuser');
        error.code = 'FORBIDDEN';
        throw error;
      }

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

  return {
    id: user.id,
    utorid: user.username,
    name: data.name ?? user.name,
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

  return mapUserToResponse(user, true);
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
  getUserRole,

  // 🔥 NEW EXPORTS
  canViewUser,
  canModifyUser,
  getRoleRank
};
