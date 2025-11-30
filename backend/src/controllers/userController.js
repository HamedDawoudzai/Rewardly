'use strict';

const userService = require('../services/userService');
const {
  validateCreateUser,
  validateUpdateUser,
  validateUpdateProfile,
  validateChangePassword
} = require('../utils/validation');
const { z } = require('zod');

/**
 * User Controller
 * Handles HTTP requests for user-related operations
 */

/**
 * POST /users
 * Create a new user account (Cashier+)
 */
async function createUserHandler(req, res) {
  try {
    const validatedData = validateCreateUser(req.body);
    const user = await userService.createUser(validatedData);
    return res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.code === 'USER_EXISTS' || error.code === 'EMAIL_EXISTS') {
      return res.status(409).json({ error: error.message });
    }
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /users
 * List users with filters and pagination (Manager+)
 */
async function listUsersHandler(req, res) {
  try {
    const filters = {};
    
    if (req.query.name) filters.name = req.query.name;
    if (req.query.role) filters.role = req.query.role;

    if (req.query.verified !== undefined) {
      const verifiedStr = String(req.query.verified).toLowerCase();
      filters.verified = verifiedStr === 'true' || verifiedStr === '1';
    }

    if (req.query.activated !== undefined) {
      const activatedStr = String(req.query.activated).toLowerCase();
      filters.activated = activatedStr === 'true' || activatedStr === '1';
    }

    let page = req.query.page ? parseInt(req.query.page) : 1;
    if (isNaN(page) || page < 1)
      return res.status(400).json({ error: 'Invalid page parameter' });

    let limit = req.query.limit ? parseInt(req.query.limit) : 10;
    if (isNaN(limit) || limit < 1)
      return res.status(400).json({ error: 'Invalid limit parameter' });

    const result = await userService.getUsers(filters, page, limit);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /users/:userId
 * Get a user by ID (Cashier+)
 * Now hierarchy-protected
 */
async function getUserHandler(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const requesterRole = userService.getUserRole(req.user);

    // ❗ NEW SECURITY CHECK:
    // Users cannot view a higher-ranked user
    const canView = await userService.canViewUser(req.user, userId);
    if (!canView) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You cannot view a user with higher privileges'
      });
    }

    const user = await userService.getUserById(userId, requesterRole, req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /users/:userId
 * Update user status/info (Manager+)
 * Now hierarchy-protected
 */
async function updateUserHandler(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    // ❗ NEW SECURITY CHECK:
    // Ensure requester is allowed to modify target
    const canModify = await userService.canModifyUser(req.user, userId);
    if (!canModify) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You cannot modify a user with equal or higher privileges'
      });
    }

    const validatedData = validateUpdateUser(req.body);
    const requesterRole = userService.getUserRole(req.user);

    const result = await userService.updateUser(userId, validatedData, requesterRole);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
    if (error.code === 'BAD_REQUEST') return res.status(400).json({ error: error.message });
    if (error.code === 'FORBIDDEN') return res.status(403).json({ error: error.message });

    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /users/me
 */
async function getOwnProfileHandler(req, res) {
  try {
    const profile = await userService.getOwnProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(profile);
  } catch (error) {
    console.error('Error getting own profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /users/me
 */
async function updateOwnProfileHandler(req, res) {
  try {
    const updates = {};

    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.birthday !== undefined) updates.birthday = req.body.birthday;

    if (req.file) {
      updates.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'At least one field must be provided for update' });
    }

    const validatedData = validateUpdateProfile(updates);

    const hasValidUpdates = Object.values(validatedData).some(v => v != null);
    if (!hasValidUpdates) {
      return res.status(400).json({ error: 'At least one field must have a valid value for update' });
    }

    const profile = await userService.updateOwnProfile(req.user.id, validatedData);
    return res.status(200).json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    console.error('Error updating own profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /users/me/password
 */
async function changePasswordHandler(req, res) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const validatedData = validateChangePassword(req.body);
    await userService.changePassword(req.user.id, validatedData.old, validatedData.new);

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createUserHandler,
  listUsersHandler,
  getUserHandler,
  updateUserHandler,
  getOwnProfileHandler,
  updateOwnProfileHandler,
  changePasswordHandler
};
