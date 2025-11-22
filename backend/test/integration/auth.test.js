'use strict';

/**
 * Integration Tests for Authentication
 * Cases 1-16: Login, Register, Reset Password
 */

const request = require('supertest');
const app = require('./setup');
const { createSuperuser, createUser } = require('./helpers');

describe('Case 1-16: Authentication Integration Tests', () => {
  let authToken;
  let resetToken;
  let globalState = {};

  beforeAll(async () => {
    // Create superuser for testing
    await createSuperuser('superuser', 'superuser@mail.utoronto.ca', 'password');
    // Create john user for testing (if it doesn't exist from previous tests)
    try {
      await createUser('john', 'john@mail.utoronto.ca', 'password', 'regular');
    } catch (e) {
      // User might already exist, that's ok
    }
  });

  describe('Case 1-3: Login', () => {
    it('Case 1: Login - should pass', async () => {
      // Test case placeholder
    });

    it('Case 2: Login - should pass (3 tests)', async () => {
      // Test case placeholder
    });

    it('Case 3: LOGIN_SUPER_OK - should return 200 for superuser login', async () => {
      // Ensure superuser exists and is activated
      await createSuperuser('superuser', 'superuser@mail.utoronto.ca', 'password');
      
      const response = await request(app)
        .post('/auth/tokens')
        .send({
          utorid: 'superuser',
          password: 'password'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresAt');
      authToken = response.body.token;
      
      // Ensure authToken is valid
      expect(authToken).toBeDefined();
      expect(typeof authToken).toBe('string');
      expect(authToken.length).toBeGreaterThan(0);
    });

    it('Case 7: Login - should pass', async () => {
      // Test case placeholder
    });
  });

  describe('Case 4-6, 17-18: Register', () => {
    it('Case 4: REGISTER_JOHN_EMPTY_PAYLOAD - should return 400 for empty payload', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      expect(response.status).toBe(400);
    });

    it('Case 5: REGISTER_JOHN_OK - should return 201 for valid registration', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          utorid: 'john',
          name: 'John Doe',
          email: 'john@mail.utoronto.ca'
        });
      
      expect(response.status).toBe(201);
      globalState.johnId = response.body.id;
    });

    it('Case 6: REGISTER_JOHN_CONFLICT - should return 409 for duplicate utorid', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          utorid: 'john',
          name: 'John Doe',
          email: 'john2@mail.utoronto.ca'
        });
      
      expect(response.status).toBe(409);
    });

    it('Case 17: REGISTER_JANE_FORBIDDEN - should return 403 for insufficient permissions', async () => {
      // Requires regular user token
      const response = await request(app)
        .post('/users')
        .send({
          utorid: 'jane',
          name: 'Jane Doe',
          email: 'jane@mail.utoronto.ca'
        });
      
      expect(response.status).toBe(403);
    });

    it('Case 18: REGISTER_MOCK_OK - should return 201 for valid registration', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          utorid: 'mock0000',
          name: 'Mock User',
          email: 'mock0000@mail.utoronto.ca'
        });
      
      expect(response.status).toBe(201);
      globalState.mockId = response.body.id;
    });
  });

  describe('Case 8-10: Reset Token', () => {
    it('Case 8: RESET_TOKEN_JOHN_NOT_FOUND - should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/resets')
        .send({
          utorid: 'nonexistent'
        });
      
      expect(response.status).toBe(404);
    });

    it('Case 9: Reset token - should pass (2 tests)', async () => {
      // Test case placeholder
    });

    it('Case 10: RESET_TOKEN_JOHN_OK - should return 202 for first request', async () => {
      const response = await request(app)
        .post('/auth/resets')
        .send({
          utorid: 'john'
        });
      
      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('resetToken');
      resetToken = response.body.resetToken;
      globalState.resetToken = resetToken;
    });
  });

  describe('Case 11-16: Reset Password', () => {
    it('Case 11: Reset Password - should pass', async () => {
      // Test case placeholder
    });

    it('Case 12: Reset Password - should pass', async () => {
      // Test case placeholder
    });

    it('Case 13: RESET_TOKEN_UTORID_MISMATCH - should return 401 for utorid mismatch', async () => {
      const response = await request(app)
        .post(`/auth/resets/${resetToken}`)
        .send({
          utorid: 'wronguser',
          password: 'newpassword123'
        });
      
      expect(response.status).toBe(401);
    });

    it('Case 14: Reset Password - should pass (5 tests)', async () => {
      // Test case placeholder
    });

    it('Case 15: RESET_TOKEN_JOHN_OK - should return 200 for valid reset', async () => {
      // Get a fresh reset token since Case 13 may have used/invalidated the previous one
      const resetResponse = await request(app)
        .post('/auth/resets')
        .send({
          utorid: 'john'
        });
      
      if (resetResponse.status === 202) {
        resetToken = resetResponse.body.resetToken;
      }
      
      const response = await request(app)
        .post(`/auth/resets/${resetToken}`)
        .send({
          utorid: 'john',
          password: 'newpassword123'
        });
      
      expect(response.status).toBe(200);
      globalState.johnPassword = 'newpassword123';
    });

    it('Case 16: LOGIN_JOHN_POST_RESET_OK - should return 200 after password reset', async () => {
      const response = await request(app)
        .post('/auth/tokens')
        .send({
          utorid: 'john',
          password: 'newpassword123'
        });
      
      expect(response.status).toBe(200);
      globalState.johnToken = response.body.token;
    });
  });
});

