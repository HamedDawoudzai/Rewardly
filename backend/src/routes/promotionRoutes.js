'use strict';

const express = require('express');
const router = express.Router();

const {
  createPromotionHandler,
  listPromotionsHandler,
  getPromotionHandler,
  updatePromotionHandler,
  deletePromotionHandler
} = require('../controllers/promotionController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

/**
 * Promotion Routes
 */

// POST /promotions - Create promotion (Manager+)
router.post('/', authenticate, requirePermission('MANAGER_CREATE_PROMO_PERIOD'), createPromotionHandler);

// GET /promotions - List promotions (Regular+)
router.get('/', authenticate, listPromotionsHandler);

// GET /promotions/:promotionId - Get promotion (Regular+)
router.get('/:promotionId', authenticate, getPromotionHandler);

// PATCH /promotions/:promotionId - Update promotion (Manager+)
router.patch('/:promotionId', authenticate, requirePermission('MANAGER_ADJUST_PROMOTION'), updatePromotionHandler);

// DELETE /promotions/:promotionId - Delete promotion (Manager+)
router.delete('/:promotionId', authenticate, requirePermission('MANAGER_ADJUST_PROMOTION'), deletePromotionHandler);

module.exports = router;

