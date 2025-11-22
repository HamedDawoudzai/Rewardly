'use strict';

const promotionRepository = require('../repositories/promotionRepository');

/**
 * Promotion Service
 * Handles business logic for promotion operations
 */

/**
 * Validate promotion timing
 */
function validatePromotionTiming(startTime, endTime) {
  const start = new Date(startTime);
  const now = new Date();

  if (start < now) {
    throw new Error('Start time must be in the future');
  }

  if (endTime) {
    const end = new Date(endTime);
    if (start >= end) {
      throw new Error('End time must be after start time');
    }
  }

  return true;
}

/**
 * Create a promotion
 */
async function createPromotion(data, createdBy) {
  const { name, description, type, startTime, endTime, minSpending, rate, points } = data;

  // Validate timing
  validatePromotionTiming(startTime, endTime);

  // Validate type
  if (!['automatic', 'one-time'].includes(type)) {
    throw new Error('Invalid promotion type');
  }

  // Validate that at least one of rate or points is provided
  if (!rate && !points) {
    throw new Error('At least one of rate or points must be provided');
  }

  const promotion = await promotionRepository.createPromotion({
    name,
    description,
    type,
    startTime,
    endTime,
    minSpending,
    rate,
    points,
    createdBy
  });

  return mapPromotionToResponse(promotion);
}

/**
 * Get promotions with filters
 */
async function getPromotions(filters, page, limit, includeAll) {
  // Validate filters
  if (filters.started !== undefined && filters.ended !== undefined) {
    throw new Error('Cannot filter by both started and ended');
  }

  const { promotions, total } = await promotionRepository.findPromotionsWithFilters(
    filters,
    page,
    limit,
    includeAll
  );

  const results = promotions.map(promo => {
    const mapped = mapPromotionToResponse(promo);
    
    // For regular users, don't include description in list view
    if (!includeAll) {
      delete mapped.description;
    }

    return mapped;
  });

  return {
    count: total,
    results
  };
}

/**
 * Get promotion by ID
 */
async function getPromotionById(promotionId, isPrivileged = false) {
  const promotion = await promotionRepository.findPromotionById(promotionId);
  
  if (!promotion) {
    return null;
  }

  // Only check if active for regular users (not managers)
  if (!isPrivileged) {
    const isActive = await promotionRepository.isPromotionActive(promotionId);
    if (!isActive) {
      return null; // Return 404 for inactive promotions
    }
  }

  return mapPromotionToResponse(promotion);
}

/**
 * Update promotion
 */
async function updatePromotion(promotionId, updates) {
  const promotion = await promotionRepository.findPromotionById(promotionId);
  
  if (!promotion) {
    throw new Error('Promotion not found');
  }

  const now = new Date();

  // Check if promotion has started
  if (promotion.startsAt <= now) {
    // Cannot edit certain fields after start
    if (updates.name || updates.description || updates.type || 
        updates.startTime || updates.minSpending || updates.rate || updates.points) {
      throw new Error('Cannot edit name, description, type, start time, minSpending, rate, or points after promotion has started');
    }
  }

  // Check if promotion has ended
  if (promotion.endsAt && promotion.endsAt <= now) {
    if (updates.endTime) {
      throw new Error('Cannot edit end time after promotion has ended');
    }
  }

  // Validate timing if being updated
  if (updates.startTime || updates.endTime) {
    const newStart = updates.startTime ? new Date(updates.startTime) : promotion.startsAt;
    const newEnd = updates.endTime ? new Date(updates.endTime) : promotion.endsAt;

    if (newStart < now) {
      throw new Error('Start time cannot be in the past');
    }

    if (newEnd && newStart >= newEnd) {
      throw new Error('End time must be after start time');
    }
  }

  const updatedPromotion = await promotionRepository.updatePromotion(promotionId, updates);

  // Return id, name, type and updated fields
  const result = {
    id: updatedPromotion.id,
    name: updatedPromotion.name,
    type: updatedPromotion.kind
  };

  if (updates.name !== undefined) result.name = updatedPromotion.name;
  if (updates.description !== undefined) result.description = updatedPromotion.description;
  if (updates.type !== undefined) {
    result.type = updatedPromotion.kind;
  }
  if (updates.startTime !== undefined) result.startTime = updatedPromotion.startsAt.toISOString();
  if (updates.endTime !== undefined) {
    result.endTime = updatedPromotion.endsAt ? updatedPromotion.endsAt.toISOString() : null;
  }
  if (updates.minSpending !== undefined) {
    result.minSpending = updatedPromotion.minSpendCents !== null ? updatedPromotion.minSpendCents / 100 : 0;
  }
  if (updates.rate !== undefined) {
    result.rate = updatedPromotion.pointsPerCentMultiplier !== null ? updatedPromotion.pointsPerCentMultiplier : 0;
  }
  if (updates.points !== undefined) {
    result.points = updatedPromotion.pointsBonus !== null ? updatedPromotion.pointsBonus : 0;
  }

  return result;
}

/**
 * Delete promotion
 */
async function deletePromotion(promotionId) {
  const promotion = await promotionRepository.findPromotionById(promotionId);
  
  if (!promotion) {
    throw new Error('Promotion not found');
  }

  // Cannot delete if already started
  const now = new Date();
  if (promotion.startsAt <= now) {
    throw new Error('Cannot delete promotion that has already started');
  }

  await promotionRepository.deletePromotion(promotionId);
  return { success: true };
}

/**
 * Map promotion from DB to API response format
 */
function mapPromotionToResponse(promotion) {
  return {
    id: promotion.id,
    name: promotion.name,
    description: promotion.description || null,
    type: promotion.kind,
    startTime: promotion.startsAt.toISOString(),
    endTime: promotion.endsAt ? promotion.endsAt.toISOString() : null,
    minSpending: promotion.minSpendCents !== null ? promotion.minSpendCents / 100 : 0,
    rate: promotion.pointsPerCentMultiplier !== null ? promotion.pointsPerCentMultiplier : 0,
    points: promotion.pointsBonus !== null ? promotion.pointsBonus : 0
  };
}

module.exports = {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion
};

