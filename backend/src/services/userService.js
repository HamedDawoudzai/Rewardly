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
    // Format birthday as YYYY-MM-DD
    result.birthday = user.birthday ? user.birthday.toISOString().split('T')[0] : null;
    result.role = user.roles && user.roles.length > 0 ? getUserRole({ roles: user.roles }) : 'regular';
    result.points = user.account ? user.account.pointsCached : 0;
    result.createdAt = user.createdAt.toISOString();
    result.lastLogin = user.lastLogin ? user.lastLogin.toISOString() : null;
    result.verified = user.isStudentVerified;
    result.avatarUrl = user.avatarUrl || null;
  }

  return result;
}

/**
 * Get user's primary role name
 */
function getUserRole(user) {
  if (!user.roles || user.roles.length === 0) return 'regular';
  
  // Priority order: superuser > manager > cashier > regular
  const roleNames = user.roles.map(r => r.role.name);
  if (roleNames.includes('superuser')) return 'superuser';
  if (roleNames.includes('manager')) return 'manager';
  if (roleNames.includes('cashier')) return 'cashier';
  return 'regular';
}

/**
 * Create a new user account
 * @param {Object} userData - User data
 * @param {string} userData.utorid - Username
 * @param {string} userData.name - Full name
 * @param {string} userData.email - Email address
 * @returns {Promise<Object>} Created user with activation token
 * @throws {Error} If user already exists or validation fails
 */
async function createUser(userData) {
  const { utorid, name, email } = userData;

  // Check if user with utorid or email already exists
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

  // Generate a temporary password (user will set password via activation)
  const tempPassword = uuidv4();
  const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

  // Generate activation token
  const activationToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

  // Prepare user data
  const newUserData = {
    username: utorid,
    email: email,
    passwordHash: passwordHash,
    name: name
  };

  // Create user with all relations via repository
  const result = await userRepository.createUserWithRelations(
    newUserData,
    activationToken,
    expiresAt
  );

  // Return user data with activation token (resetToken per spec)
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
 * Get user by ID for different clearance levels
 */
async function getUserById(userId, requesterRole, requesterId) {
  const user = await userRepository.findUserById(userId, {
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
    return null;
  }

  const isSelf = userId === requesterId;
  const role = requesterRole;

  // Get available promotions
  const promotions = await userRepository.getUserAvailablePromotions(userId);
  const promosList = promotions.map(p => ({
    id: p.id,
    name: p.name,
    minSpending: p.minSpendCents ? p.minSpendCents / 100 : null,
    rate: p.pointsPerCentMultiplier || null,
    points: p.pointsBonus || null
  }));

  // Cashier view (limited fields + promotions)
  if (role === 'cashier') {
    return {
      id: user.id,
      utorid: user.username,
      name: user.name,
      password: '',
      points: user.account ? user.account.pointsCached : 0,
      verified: user.isStudentVerified,
      promotions: promosList
    };
  }

  // Manager+ view (full details + promotions)
  if (role === 'manager' || role === 'superuser') {
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
      promotions: promosList
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
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user) {
    const error = new Error('User not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const data = {};
  const changedFields = {};

  // Email update (ignore null and undefined)
  if (updates.email != null) {
    data.email = updates.email;
    changedFields.email = updates.email;
  }

  // Verified status (manager+) (ignore null and undefined)
  if (updates.verified != null) {
    data.isStudentVerified = updates.verified;
    changedFields.verified = updates.verified;
  }

  // Suspicious status (manager+) (ignore null and undefined)
  if (updates.suspicious != null) {
    data.isSuspicious = updates.suspicious;
    changedFields.suspicious = updates.suspicious;
  }

  // Role update (ignore null and undefined)
  if (updates.role != null) {
    const currentRole = getUserRole(user);
    
    // Validate role permissions
    if (requesterRole === 'manager') {
      // Manager can only set to regular or cashier
      if (!['regular', 'cashier'].includes(updates.role)) {
        const error = new Error('Managers can only set role to regular or cashier');
        error.code = 'FORBIDDEN';
        throw error;
      }
    }
    // Superuser can set to any role (already validated by schema)

    // Check if promoting to cashier with suspicious flag
    if (updates.role === 'cashier' && user.isSuspicious) {
      const error = new Error('Cannot promote suspicious user to cashier');
      error.code = 'BAD_REQUEST';
      throw error;
    }

    // Update role
    const newRole = await roleRepository.findRoleByName(updates.role);
    if (newRole) {
      console.log('[UPDATE USER] Updating role:', {
        userId,
        currentRoles: user.roles.map(r => r.role.name),
        newRole: updates.role,
        requesterRole
      });
      
      // Remove existing roles
      const existingRoles = await roleRepository.getUserRoles(userId);
      for (const ur of existingRoles) {
        await roleRepository.removeRoleFromUser(userId, ur.roleId);
      }
      
      // Assign new role
      await roleRepository.assignRoleToUser(userId, newRole.id);
      
      changedFields.role = updates.role;
      
      
      console.log('[UPDATE USER] Role updated successfully:', {
        userId,
        newRole: updates.role,
        note: 'Token remains valid - permissions checked against database'
      });
    }
  }

  // Update user
  if (Object.keys(data).length > 0) {
    await userRepository.updateUser(userId, data);
  }

  // Return changed fields plus id, utorid, name
  return {
    id: user.id,
    utorid: user.username,
    name: user.name,
    ...changedFields
  };
}

/**
 * Get own profile
 */
async function getOwnProfile(userId) {
  const user = await userRepository.findUserById(userId, {
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
    return null;
  }

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
    promotions: promosList
  };
}

/**
 * Update own profile
 */
async function updateOwnProfile(userId, updates) {
  const data = {};

  // Skip null and undefined values
  if (updates.name != null) {
    data.name = updates.name;
  }

  if (updates.email != null) {
    data.email = updates.email;
  }

  if (updates.birthday != null) {
    // Convert YYYY-MM-DD string to Date object
    data.birthday = new Date(updates.birthday + 'T00:00:00.000Z');
  }

  // Note: avatar upload handling would be done in controller with multer
  if (updates.avatarUrl != null) {
    data.avatarUrl = updates.avatarUrl;
  }

  await userRepository.updateUser(userId, data);

  // Return full profile
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

  // Verify old password
  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isValid) {
    const error = new Error('Incorrect old password');
    error.code = 'FORBIDDEN';
    throw error;
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await userRepository.updatePassword(userId, newPasswordHash);

  return { success: true };
}

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserByIdSimple(userId) {
  return await userRepository.findUserById(userId, {
    include: {
      roles: {
        include: {
          role: true
        }
      },
      account: true
    }
  });
}

/**
 * Get user by email
 * @param {string} email - Email address
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserByEmail(email) {
  return await userRepository.findUserByEmail(email, {
    include: {
      roles: {
        include: {
          role: true
        }
      },
      account: true
    }
  });
}

/**
 * Get user by username
 * @param {string} username - Username (utorid)
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserByUsername(username) {
  return await userRepository.findUserByUsername(username, {
    include: {
      roles: {
        include: {
          role: true
        }
      },
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
