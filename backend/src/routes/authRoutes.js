'use strict';

const express = require('express');
const router = express.Router();

const {
  loginHandler,
  requestResetHandler,
  resetPasswordHandler
} = require('../controllers/authController');

/**
 * Authentication Routes
 */

// POST /auth/tokens - Login
router.post('/tokens', loginHandler);

// POST /auth/resets - Request password reset
router.post('/resets', requestResetHandler);

// POST /auth/resets/:resetToken - Reset password
router.post('/resets/:resetToken', resetPasswordHandler);

module.exports = router;
