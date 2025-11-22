'use strict';

const request = require('supertest');
const express = require('express');
const transactionRoutes = require('../../routes/transactionRoutes');
const transactionService = require('../../services/transactionService');

// Mock the services and middleware
jest.mock('../../services/transactionService');
jest.mock('../../middleware/auth');
jest.mock('../../middleware/permissions');

const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/permissions');

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/transactions', transactionRoutes);

describe('Transaction Controller', () => {
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
  });

  describe('POST /transactions (Purchase)', () => {
    it('should create a purchase transaction successfully (happy path)', async () => {
      const mockTransaction = {
        id: 1,
        type: 'purchase',
        amount: 100,
        spent: 25.00,
        earned: 100,
        createdAt: new Date().toISOString(),
        user: { id: 2, utorid: 'customer', name: 'Customer' }
      };

      transactionService.createPurchase = jest.fn().mockResolvedValue(mockTransaction);

      const response = await request(app)
        .post('/transactions')
        .send({
          utorid: 'customer',
          type: 'purchase',
          spent: 25.00,
          promotionIds: [],
          remark: 'Test purchase'
        });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('purchase');
      expect(response.body).toHaveProperty('earned');
    });

    it('should apply promotions to purchase (happy path)', async () => {
      const mockTransaction = {
        id: 1,
        type: 'purchase',
        amount: 150,
        spent: 25.00,
        earned: 150,
        createdAt: new Date().toISOString()
      };

      transactionService.createPurchase = jest.fn().mockResolvedValue(mockTransaction);

      const response = await request(app)
        .post('/transactions')
        .send({
          utorid: 'customer',
          type: 'purchase',
          spent: 25.00,
          promotionIds: [1, 2]
        });

      expect(response.status).toBe(201);
      expect(response.body.earned).toBeGreaterThan(0);
    });

    it('should return 400 for invalid promotion (bad path)', async () => {
      transactionService.createPurchase = jest.fn().mockRejectedValue(
        new Error('Promotion 999 not found')
      );

      const response = await request(app)
        .post('/transactions')
        .send({
          utorid: 'customer',
          type: 'purchase',
          spent: 25.00,
          promotionIds: [999]
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing spent amount (bad path)', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          utorid: 'customer',
          type: 'purchase',
          promotionIds: []
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /transactions (Adjustment)', () => {
    it('should create an adjustment transaction successfully (happy path)', async () => {
      const mockTransaction = {
        id: 2,
        type: 'adjustment',
        amount: -50,
        relatedId: 1,
        createdAt: new Date().toISOString()
      };

      transactionService.createAdjustment = jest.fn().mockResolvedValue(mockTransaction);

      const response = await request(app)
        .post('/transactions')
        .send({
          utorid: 'customer',
          type: 'adjustment',
          amount: -50,
          relatedId: 1,
          remark: 'Correction'
        });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('adjustment');
      expect(response.body.amount).toBe(-50);
    });

    it('should return 400 for missing amount (bad path)', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          utorid: 'customer',
          type: 'adjustment',
          relatedId: 1
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /transactions', () => {
    it('should list transactions successfully (happy path)', async () => {
      const mockResult = {
        count: 3,
        results: [
          {
            id: 1,
            type: 'purchase',
            amount: 100,
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            type: 'redemption',
            amount: -50,
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            type: 'transfer',
            amount: 25,
            createdAt: new Date().toISOString()
          }
        ]
      };

      transactionService.getTransactions = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/transactions')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3);
      expect(response.body.results).toHaveLength(3);
    });

    it('should filter transactions by type (happy path)', async () => {
      const mockResult = {
        count: 1,
        results: [
          {
            id: 1,
            type: 'purchase',
            amount: 100
          }
        ]
      };

      transactionService.getTransactions = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/transactions')
        .query({ type: 'purchase' });

      expect(response.status).toBe(200);
      expect(response.body.results[0].type).toBe('purchase');
    });

    it('should filter by suspicious status (happy path)', async () => {
      const mockResult = {
        count: 1,
        results: [
          {
            id: 1,
            type: 'purchase',
            suspicious: true
          }
        ]
      };

      transactionService.getTransactions = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/transactions')
        .query({ suspicious: 'true' });

      expect(response.status).toBe(200);
      expect(response.body.results[0].suspicious).toBe(true);
    });
  });

  describe('GET /transactions/:transactionId', () => {
    it('should get transaction by ID successfully (happy path)', async () => {
      const mockTransaction = {
        id: 1,
        type: 'purchase',
        amount: 100,
        createdAt: new Date().toISOString()
      };

      transactionService.getTransactionById = jest.fn().mockResolvedValue(mockTransaction);

      const response = await request(app)
        .get('/transactions/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
    });

    it('should return 404 for non-existent transaction (bad path)', async () => {
      transactionService.getTransactionById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/transactions/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid ID (bad path)', async () => {
      const response = await request(app)
        .get('/transactions/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /transactions/:transactionId/suspicious', () => {
    it('should mark transaction as suspicious (happy path)', async () => {
      const mockTransaction = {
        id: 1,
        type: 'purchase',
        suspicious: true
      };

      transactionService.toggleSuspicious = jest.fn().mockResolvedValue(mockTransaction);

      const response = await request(app)
        .patch('/transactions/1/suspicious')
        .send({ suspicious: true });

      expect(response.status).toBe(200);
      expect(response.body.suspicious).toBe(true);
    });

    it('should mark transaction as not suspicious (happy path)', async () => {
      const mockTransaction = {
        id: 1,
        type: 'purchase',
        suspicious: false
      };

      transactionService.toggleSuspicious = jest.fn().mockResolvedValue(mockTransaction);

      const response = await request(app)
        .patch('/transactions/1/suspicious')
        .send({ suspicious: false });

      expect(response.status).toBe(200);
      expect(response.body.suspicious).toBe(false);
    });

    it('should return 400 for invalid input (bad path)', async () => {
      const response = await request(app)
        .patch('/transactions/1/suspicious')
        .send({ suspicious: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing suspicious field (bad path)', async () => {
      const response = await request(app)
        .patch('/transactions/1/suspicious')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /transactions/:transactionId/processed', () => {
    it('should process redemption successfully (happy path)', async () => {
      const mockTransaction = {
        id: 1,
        type: 'redemption',
        amount: -100,
        processed: true
      };

      transactionService.processRedemption = jest.fn().mockResolvedValue(mockTransaction);

      const response = await request(app)
        .patch('/transactions/1/processed')
        .send({ processed: true });

      expect(response.status).toBe(200);
      expect(response.body.processed).toBe(true);
    });

    it('should return 400 if not a redemption (bad path)', async () => {
      transactionService.processRedemption = jest.fn().mockRejectedValue(
        new Error('Transaction is not a redemption')
      );

      const response = await request(app)
        .patch('/transactions/1/processed')
        .send({ processed: true });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if already processed (bad path)', async () => {
      transactionService.processRedemption = jest.fn().mockRejectedValue(
        new Error('Redemption already processed')
      );

      const response = await request(app)
        .patch('/transactions/1/processed')
        .send({ processed: true });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid value (bad path)', async () => {
      const response = await request(app)
        .patch('/transactions/1/processed')
        .send({ processed: false });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for null input (bad path)', async () => {
      const response = await request(app)
        .patch('/transactions/1/processed')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});

