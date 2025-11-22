'use strict';

const request = require('supertest');
const express = require('express');

// Mock the services and middleware BEFORE requiring routes
jest.mock('../../services/promotionService');
jest.mock('../../services/userService');
jest.mock('../../middleware/auth');
jest.mock('../../middleware/permissions');

const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/permissions');

// Setup default mocks before requiring routes
authenticate.mockImplementation((req, res, next) => {
  req.user = {
    id: 1,
    username: 'testuser',
    email: 'test@mail.utoronto.ca',
    name: 'Test User',
    isActivated: true,
    roles: [{ role: { name: 'manager' } }]
  };
  next();
});

requirePermission.mockImplementation((permission) => {
  return (req, res, next) => next();
});

const promotionRoutes = require('../../routes/promotionRoutes');
const promotionService = require('../../services/promotionService');
const userService = require('../../services/userService');

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/promotions', promotionRoutes);

describe('Promotion Controller', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@mail.utoronto.ca',
      name: 'Test User',
      isActivated: true,
      roles: [{ role: { name: 'manager' } }]
    };

    authenticate.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });

    requirePermission.mockImplementation((permission) => {
      return (req, res, next) => next();
    });

    userService.getUserRole = jest.fn().mockReturnValue('manager');
  });

  describe('POST /promotions', () => {
    it('should create a promotion successfully (happy path)', async () => {
      const mockPromotion = {
        id: 1,
        name: 'Summer Sale',
        description: '50% bonus points',
        type: 'automatic',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        minSpending: 20.00,
        rate: 0.5,
        points: null
      };

      promotionService.createPromotion = jest.fn().mockResolvedValue(mockPromotion);

      const response = await request(app)
        .post('/promotions')
        .send({
          name: 'Summer Sale',
          description: '50% bonus points',
          type: 'automatic',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          minSpending: 20.00,
          rate: 0.5
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Summer Sale');
      expect(response.body.type).toBe('automatic');
    });

    it('should create a one-time promotion (happy path)', async () => {
      const mockPromotion = {
        id: 2,
        name: 'Welcome Bonus',
        type: 'one-time',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        points: 100
      };

      promotionService.createPromotion = jest.fn().mockResolvedValue(mockPromotion);

      const response = await request(app)
        .post('/promotions')
        .send({
          name: 'Welcome Bonus',
          type: 'one-time',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          points: 100
        });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('one-time');
      expect(response.body.points).toBe(100);
    });

    it('should return 400 for invalid timing (bad path)', async () => {
      promotionService.createPromotion = jest.fn().mockRejectedValue(
        new Error('Start time must be in the future')
      );

      const response = await request(app)
        .post('/promotions')
        .send({
          name: 'Invalid Promo',
          type: 'automatic',
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          points: 100
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing required fields (bad path)', async () => {
      const response = await request(app)
        .post('/promotions')
        .send({
          name: 'Incomplete Promo'
          // Missing type, startTime, etc.
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid type (bad path)', async () => {
      const response = await request(app)
        .post('/promotions')
        .send({
          name: 'Test Promo',
          type: 'invalid-type',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          points: 100
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for null inputs (bad path)', async () => {
      const response = await request(app)
        .post('/promotions')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /promotions', () => {
    it('should list promotions successfully (happy path)', async () => {
      const mockResult = {
        count: 2,
        results: [
          {
            id: 1,
            name: 'Summer Sale',
            type: 'automatic',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Welcome Bonus',
            type: 'one-time',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        ]
      };

      promotionService.getPromotions = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/promotions')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      expect(response.body.results).toHaveLength(2);
    });

    it('should filter promotions by name (happy path)', async () => {
      const mockResult = {
        count: 1,
        results: [
          {
            id: 1,
            name: 'Summer Sale',
            type: 'automatic'
          }
        ]
      };

      promotionService.getPromotions = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/promotions')
        .query({ name: 'Summer' });

      expect(response.status).toBe(200);
      expect(response.body.results[0].name).toContain('Summer');
    });

    it('should filter promotions by type (happy path)', async () => {
      const mockResult = {
        count: 1,
        results: [
          {
            id: 2,
            name: 'Welcome Bonus',
            type: 'one-time'
          }
        ]
      };

      promotionService.getPromotions = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/promotions')
        .query({ type: 'one-time' });

      expect(response.status).toBe(200);
      expect(response.body.results[0].type).toBe('one-time');
    });

    it('should return 400 for conflicting filters (bad path)', async () => {
      promotionService.getPromotions = jest.fn().mockRejectedValue(
        new Error('Cannot filter by both started and ended')
      );

      const response = await request(app)
        .get('/promotions')
        .query({ started: 'true', ended: 'true' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /promotions/:promotionId', () => {
    it('should get promotion by ID successfully (happy path)', async () => {
      const mockPromotion = {
        id: 1,
        name: 'Summer Sale',
        description: '50% bonus points',
        type: 'automatic',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        minSpending: 20.00,
        rate: 0.5
      };

      promotionService.getPromotionById = jest.fn().mockResolvedValue(mockPromotion);

      const response = await request(app)
        .get('/promotions/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.name).toBe('Summer Sale');
      expect(response.body).toHaveProperty('description');
    });

    it('should return 404 for inactive promotion (bad path)', async () => {
      promotionService.getPromotionById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/promotions/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found or inactive');
    });

    it('should return 400 for invalid ID (bad path)', async () => {
      const response = await request(app)
        .get('/promotions/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /promotions/:promotionId', () => {
    it('should update promotion successfully (happy path)', async () => {
      const mockResult = {
        id: 1,
        name: 'Updated Sale',
        type: 'automatic',
        description: 'New description'
      };

      promotionService.updatePromotion = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .patch('/promotions/1')
        .send({
          description: 'New description'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('description');
    });

    it('should return 400 for editing after start (bad path)', async () => {
      promotionService.updatePromotion = jest.fn().mockRejectedValue(
        new Error('Cannot edit name after promotion has started')
      );

      const response = await request(app)
        .patch('/promotions/1')
        .send({ name: 'New Name' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for editing end time after end (bad path)', async () => {
      promotionService.updatePromotion = jest.fn().mockRejectedValue(
        new Error('Cannot edit end time after promotion has ended')
      );

      const response = await request(app)
        .patch('/promotions/1')
        .send({ endTime: new Date().toISOString() });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid fields (bad path)', async () => {
      const response = await request(app)
        .patch('/promotions/1')
        .send({ invalidField: 'value' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid type value (bad path)', async () => {
      const response = await request(app)
        .patch('/promotions/1')
        .send({ type: 'invalid-type' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /promotions/:promotionId', () => {
    it('should delete promotion successfully (happy path)', async () => {
      promotionService.deletePromotion = jest.fn().mockResolvedValue({ success: true });

      const response = await request(app)
        .delete('/promotions/1');

      expect(response.status).toBe(204);
    });

    it('should return 403 for deleting started promotion (bad path)', async () => {
      promotionService.deletePromotion = jest.fn().mockRejectedValue(
        new Error('Cannot delete promotion that has already started')
      );

      const response = await request(app)
        .delete('/promotions/1');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already started');
    });

    it('should return 400 for non-existent promotion (bad path)', async () => {
      promotionService.deletePromotion = jest.fn().mockRejectedValue(
        new Error('Promotion not found')
      );

      const response = await request(app)
        .delete('/promotions/999');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid ID (bad path)', async () => {
      const response = await request(app)
        .delete('/promotions/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});

