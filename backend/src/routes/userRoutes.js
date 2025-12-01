'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  createUserHandler,
  listUsersHandler,
  getUserHandler,
  updateUserHandler,
  getOwnProfileHandler,
  updateOwnProfileHandler,
  changePasswordHandler
} = require('../controllers/userController');

const {
  createTransferHandler,
  createRedemptionHandler,
  getMyTransactionsHandler
} = require('../controllers/transactionController');

const { authenticate } = require('../middleware/auth');

const {
  requirePermission,
  requireRankAtLeast,
  requireModifyPower
} = require('../middleware/permissions');

const { validateBodyNotEmpty } = require('../middleware/validateBody');
const userRepository = require('../repositories/userRepository');


// -----------------------------
// Multer Config
// -----------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});


// -------------------------------------------------------------
// Helper: Load target user (used for hierarchy checks)
// -------------------------------------------------------------
async function loadTargetUser(req, res, next) {
  try {
    const rawId = req.params.userId;
    const userId = parseInt(rawId, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const targetUser = await userRepository.findUserById(userId, {
      include: {
        roles: { include: { role: true } }
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.targetUser = targetUser;

    const roleNames = targetUser.roles.map(r => r.role.name);

    if (roleNames.includes('superuser')) {
      req.targetUserRole = 'superuser';
      req.targetUserRank = 4;
    } else if (roleNames.includes('manager')) {
      req.targetUserRole = 'manager';
      req.targetUserRank = 3;
    } else if (roleNames.includes('cashier')) {
      req.targetUserRole = 'cashier';
      req.targetUserRank = 2;
    } else {
      req.targetUserRole = 'regular';
      req.targetUserRank = 1;
    }

    next();
  } catch (err) {
    console.error("loadTargetUser error:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

// GET /users/me
router.get('/me', authenticate, getOwnProfileHandler);

// PATCH /users/me
router.patch('/me', authenticate, upload.single('avatar'), updateOwnProfileHandler);

// PATCH /users/me/password
router.patch('/me/password', authenticate, changePasswordHandler);


// -------------------------------------------------------------
// MANAGEMENT ROUTES
// -------------------------------------------------------------

// POST /users  (Cashier+)
router.post(
  '/',
  validateBodyNotEmpty,
  authenticate,
  requireRankAtLeast('cashier'),
  requirePermission('CASHIER_CREATE_USER'),
  createUserHandler
);

// GET /users  (Manager+)
router.get(
  '/',
  authenticate,
  requireRankAtLeast('manager'),
  requirePermission('MANAGER_VIEW_USERS'),
  listUsersHandler
);

// GET /users/:userId (Cashier+)
router.get(
  '/:userId',
  authenticate,
  requirePermission('CASHIER_VIEW_USER'),
  getUserHandler
);

// PATCH /users/:userId (Manager ONLY, cannot modify equal/higher users)
router.patch(
  '/:userId',
  authenticate,
  requirePermission('MANAGER_UPDATE_USER'),
  requireRankAtLeast('manager'),
  loadTargetUser,
  requireModifyPower(),
  updateUserHandler
);


// -------------------------------------------------------------
// TRANSACTIONS
// -------------------------------------------------------------

router.post('/me/transactions', authenticate, createRedemptionHandler);

router.get('/me/transactions', authenticate, getMyTransactionsHandler);

router.post('/:userId/transactions', authenticate, createTransferHandler);


module.exports = router;
