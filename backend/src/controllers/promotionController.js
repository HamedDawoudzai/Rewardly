'use strict';

const promotionService = require('../services/promotionService');
const userService = require('../services/userService');
const { validateCreatePromotion, validateUpdatePromotion } = require('../utils/validation');
const { z } = require('zod');

/**
 * POST /promotions
 * Create a promotion (Manager+)
 */
async function createPromotionHandler(req, res) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const validatedData = validateCreatePromotion(req.body);
    const promotion = await promotionService.createPromotion(validatedData, req.user.id);
    return res.status(201).json(promotion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    console.error('Error creating promotion:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * GET /promotions
 */
async function listPromotionsHandler(req, res) {
  try {
    const filters = {};

    if (req.query.name) filters.name = req.query.name;
    if (req.query.type) filters.type = req.query.type;
    if (req.query.started !== undefined) {
      filters.started = req.query.started === 'true';
    }
    if (req.query.ended !== undefined) {
      filters.ended = req.query.ended === 'true';
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page <= 0) {
      return res.status(400).json({ message: 'Page must be greater than 0.' });
    }
    if (limit <= 0) {
      return res.status(400).json({ message: 'Limit must be greater than 0.' });
    }

    const userRole = userService.getUserRole(req.user);
    const isManager = userRole === 'manager' || userRole === 'superuser';

    const result = await promotionService.getPromotions(filters, page, limit, isManager);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message.includes('Cannot filter')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error listing promotions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /promotions/:promotionId
 */
async function getPromotionHandler(req, res) {
  try {
    const promotionId = parseInt(req.params.promotionId);
    if (isNaN(promotionId)) {
      return res.status(400).json({ error: 'Invalid promotion ID' });
    }

    const userRole = userService.getUserRole(req.user);
    const isPrivileged = userRole === 'manager' || userRole === 'superuser';

    const promotion = await promotionService.getPromotionById(promotionId, isPrivileged);

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found or inactive' });
    }

    return res.status(200).json(promotion);
  } catch (error) {
    console.error('Error getting promotion:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /promotions/:promotionId
 */
async function updatePromotionHandler(req, res) {
  try {
    const promotionId = parseInt(req.params.promotionId);
    if (isNaN(promotionId)) {
      return res.status(400).json({ error: 'Invalid promotion ID' });
    }

    const validatedData = validateUpdatePromotion(req.body);

    const result = await promotionService.updatePromotion(promotionId, validatedData);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: 'Promotion not found.' });
    }
    console.error('Error updating promotion:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * DELETE /promotions/:promotionId
 */
async function deletePromotionHandler(req, res) {
  try {
    const promotionId = parseInt(req.params.promotionId);
    if (isNaN(promotionId)) {
      return res.status(400).json({ error: 'Invalid promotion ID' });
    }

    await promotionService.deletePromotion(promotionId);

    // FIX: Return JSON so frontend does NOT throw a network error
    return res.status(200).json({ success: true });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: 'Promotion not found.' });
    }
    if (error.message.includes('already started')) {
      return res.status(403).json({ error: error.message });
    }
    console.error('Error deleting promotion:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

module.exports = {
  createPromotionHandler,
  listPromotionsHandler,
  getPromotionHandler,
  updatePromotionHandler,
  deletePromotionHandler
};
