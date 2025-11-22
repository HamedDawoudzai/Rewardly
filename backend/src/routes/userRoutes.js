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
const { requirePermission } = require('../middleware/permissions');
const { validateBodyNotEmpty } = require('../middleware/validateBody');

// Configure multer for avatar uploads
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * User Routes
 */

// GET /users/me - Get own profile (must be before /:userId to avoid conflict)
router.get('/me', authenticate, getOwnProfileHandler);

// PATCH /users/me - Update own profile
router.patch('/me', authenticate, upload.single('avatar'), updateOwnProfileHandler);

// PATCH /users/me/password - Change own password
router.patch('/me/password', authenticate, changePasswordHandler);

// POST /users - Create a new user (Cashier+)
// Validate body first (before auth) to return 400 for empty payload
router.post('/', validateBodyNotEmpty, authenticate, requirePermission('CASHIER_CREATE_USER'), createUserHandler);

// GET /users - List users (Manager+)
router.get('/', authenticate, requirePermission('MANAGER_VIEW_USERS'), listUsersHandler);

// GET /users/:userId - Get a user (Cashier+)
router.get('/:userId', authenticate, requirePermission('CASHIER_VIEW_USER'), getUserHandler);

// PATCH /users/:userId - Update user (Manager+)
router.patch('/:userId', authenticate, requirePermission('MANAGER_UPDATE_USER'), updateUserHandler);

// POST /users/me/transactions - Create redemption request (Regular+)
router.post('/me/transactions', authenticate, createRedemptionHandler);

// GET /users/me/transactions - Get own transactions (Regular+)
router.get('/me/transactions', authenticate, getMyTransactionsHandler);

// POST /users/:userId/transactions - Create transfer to user (Regular+)
router.post('/:userId/transactions', authenticate, createTransferHandler);

module.exports = router;
