'use strict';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Promotion Repository
 * Handles all database operations related to promotions
 */

/**
 * Create a promotion
 */
async function createPromotion(data) {
  const {
    name,
    description,
    type,
    startTime,
    endTime,
    minSpending,
    rate,
    points,
    createdBy
  } = data;

  return await prisma.promotion.create({
    data: {
      name,
      description: description || null,
      kind: type === 'one-time' ? 'onetime' : type,
      status: 'active',
      startsAt: new Date(startTime),
      endsAt: endTime ? new Date(endTime) : null,
      minSpendCents: minSpending ? Math.round(minSpending * 100) : null,
      pointsPerCentMultiplier: rate || null,
      pointsBonus: points || null,
      createdById: createdBy
    }
  });
}

/**
 * Find promotions with filters and pagination
 */
async function findPromotionsWithFilters(filters = {}, page = 1, limit = 10, includeAll = false) {
  const where = {};
  const now = new Date();

  if (filters.name) {
    where.name = {
      contains: filters.name,
      mode: 'insensitive'
    };
  }

  if (filters.type) {
    where.kind = filters.type === 'one-time' ? 'onetime' : filters.type;
  }

  if (!includeAll) {
    // Regular users only see active promotions
    where.status = 'active';
    where.startsAt = { lte: now };
    where.OR = [
      { endsAt: null },
      { endsAt: { gte: now } }
    ];
  } else {
    // Manager+ can filter by started/ended
    if (filters.started !== undefined) {
      where.startsAt = filters.started ? { lte: now } : { gt: now };
    }

    if (filters.ended !== undefined) {
      where.endsAt = filters.ended ? { lte: now } : { gt: now };
    }
  }

  const skip = (page - 1) * limit;

  const [promotions, total] = await Promise.all([
    prisma.promotion.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        startsAt: 'desc'
      }
    }),
    prisma.promotion.count({ where })
  ]);

  return { promotions, total };
}

/**
 * Find promotion by ID
 */
async function findPromotionById(promotionId) {
  return await prisma.promotion.findUnique({
    where: { id: promotionId }
  });
}

/**
 * Update promotion
 */
async function updatePromotion(promotionId, data) {
  const updateData = {};

  // Required fields - only update if not null
  if (data.name !== undefined && data.name !== null) updateData.name = data.name;
  if (data.description !== undefined && data.description !== null) updateData.description = data.description;
  if (data.type !== undefined && data.type !== null) {
    updateData.kind = data.type === 'one-time' ? 'onetime' : data.type;
  }
  
  // Date fields - only update if not null
  if (data.startTime !== undefined && data.startTime !== null) updateData.startsAt = new Date(data.startTime);
  if (data.endTime !== undefined) {
    updateData.endsAt = data.endTime ? new Date(data.endTime) : null;
  }
  
  // Optional numeric fields - null is allowed
  if (data.minSpending !== undefined) {
    updateData.minSpendCents = data.minSpending !== null && data.minSpending !== undefined ? Math.round(data.minSpending * 100) : null;
  }
  if (data.rate !== undefined) updateData.pointsPerCentMultiplier = data.rate;
  if (data.points !== undefined) updateData.pointsBonus = data.points;

  return await prisma.promotion.update({
    where: { id: promotionId },
    data: updateData
  });
}

/**
 * Delete promotion
 */
async function deletePromotion(promotionId) {
  return await prisma.promotion.delete({
    where: { id: promotionId }
  });
}

/**
 * Check if promotion is active
 */
async function isPromotionActive(promotionId) {
  const promo = await prisma.promotion.findUnique({
    where: { id: promotionId }
  });

  if (!promo) return false;

  const now = new Date();
  
  if (promo.status !== 'active') return false;
  if (promo.startsAt && promo.startsAt > now) return false;
  if (promo.endsAt && promo.endsAt < now) return false;

  return true;
}

module.exports = {
  createPromotion,
  findPromotionsWithFilters,
  findPromotionById,
  updatePromotion,
  deletePromotion,
  isPromotionActive
};

