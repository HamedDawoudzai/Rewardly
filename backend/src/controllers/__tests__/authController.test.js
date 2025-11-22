'use strict';

const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/authRoutes');
const authService = require('../../services/authService');

// Mock the services
jest.mock('../../services/authService');

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/tokens', () => {
    it('should login successfully and return token (happy path)', async () => {
      const mockResult = {
        token: 'jwt-token-here',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      authService.login = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/auth/tokens')
        .send({
          utorid: 'testuser',
          password: 'TestPass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresAt');
      expect(authService.login).toHaveBeenCalledWith('testuser', 'TestPass123!');
    });

    it('should return 401 for invalid credentials (bad path)', async () => {
      const error = new Error('Invalid utorid or password');
      error.code = 'INVALID_CREDENTIALS';
      authService.login = jest.fn().mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/tokens')
        .send({
          utorid: 'testuser',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid');
    });

    it('should return 403 for unactivated account (bad path)', async () => {
      const error = new Error('Account not activated');
      error.code = 'NOT_ACTIVATED';
      authService.login = jest.fn().mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/tokens')
        .send({
          utorid: 'unactivated',
          password: 'TestPass123!'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not activated');
    });

    it('should return 400 for missing utorid (bad path)', async () => {
      const response = await request(app)
        .post('/auth/tokens')
        .send({
          password: 'TestPass123!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing password (bad path)', async () => {
      const response = await request(app)
        .post('/auth/tokens')
        .send({
          utorid: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for null inputs (bad path)', async () => {
      const response = await request(app)
        .post('/auth/tokens')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/resets', () => {
    it('should request password reset successfully (happy path)', async () => {
      const mockResult = {
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        resetToken: 'reset-uuid-token'
      };

      authService.requestPasswordReset = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/auth/resets')
        .send({
          utorid: 'testuser'
        });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body).toHaveProperty('resetToken');
      expect(authService.requestPasswordReset).toHaveBeenCalled();
    });

    it('should return 429 when rate limited (bad path)', async () => {
      const error = new Error('Too many reset requests. Please try again later.');
      error.code = 'RATE_LIMITED';
      authService.requestPasswordReset = jest.fn().mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/resets')
        .send({
          utorid: 'testuser'
        });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Too many');
    });

    it('should return 400 for missing utorid (bad path)', async () => {
      const response = await request(app)
        .post('/auth/resets')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for null input (bad path)', async () => {
      const response = await request(app)
        .post('/auth/resets')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/resets/:resetToken', () => {
    it('should reset password successfully (happy path)', async () => {
      authService.resetPassword = jest.fn().mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/auth/resets/valid-reset-token')
        .send({
          utorid: 'testuser',
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(authService.resetPassword).toHaveBeenCalledWith(
        'valid-reset-token',
        'testuser',
        'NewPassword123!'
      );
    });

    it('should return 404 for invalid token (bad path)', async () => {
      const error = new Error('Invalid or expired reset token');
      error.code = 'NOT_FOUND';
      authService.resetPassword = jest.fn().mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/resets/invalid-token')
        .send({
          utorid: 'testuser',
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 410 for expired token (bad path)', async () => {
      const error = new Error('Reset token has expired');
      error.code = 'EXPIRED';
      authService.resetPassword = jest.fn().mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/resets/expired-token')
        .send({
          utorid: 'testuser',
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(410);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('expired');
    });

    it('should return 400 for weak password (bad path)', async () => {
      const response = await request(app)
        .post('/auth/resets/valid-token')
        .send({
          utorid: 'testuser',
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing utorid (bad path)', async () => {
      const response = await request(app)
        .post('/auth/resets/valid-token')
        .send({
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing password (bad path)', async () => {
      const response = await request(app)
        .post('/auth/resets/valid-token')
        .send({
          utorid: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for null inputs (bad path)', async () => {
      const response = await request(app)
        .post('/auth/resets/valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});

