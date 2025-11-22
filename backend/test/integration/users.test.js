'use strict';

/**
 * Integration Tests for Users
 * Cases 17-35: User Management
 */

const request = require('supertest');
const app = require('./setup');

describe('Case 17-35: Users Integration Tests', () => {
  let authToken;
  let managerToken;
  let regularToken;
  let globalState = {};

  beforeAll(async () => {
    // Setup tokens
    const managerResponse = await request(app)
      .post('/auth/tokens')
      .send({ utorid: 'manager', password: 'password' });
    managerToken = managerResponse.body.token;

    const regularResponse = await request(app)
      .post('/auth/tokens')
      .send({ utorid: 'regular', password: 'password' });
    regularToken = regularResponse.body.token;

    authToken = managerToken;
  });

  describe('Case 19-21: Get all users', () => {
    it('Case 19: GET_ALL_USERS_FORBIDDEN - should return 403 for regular user', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(response.status).toBe(403);
    });

    it('Case 20: GET_ALL_USERS_PAGE_INVALID - should return 400 for invalid page', async () => {
      const response = await request(app)
        .get('/users?page=-1')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(400);
    });

    it('Case 21: GET_ALL_USERS_EMPTY_OK - should return 200 for empty list', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('results');
    });
  });

  describe('Case 22-27: Update user info', () => {
    it('Case 22: UPDATE_JOHN_EMPTY_PAYLOAD - should return 400 for empty payload', async () => {
      const response = await request(app)
        .patch(`/users/${globalState.johnId || 1}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      expect(response.status).toBe(400);
    });

    it('Case 23: UPDATE_JOHN_OK - should return 200 for valid update', async () => {
      const response = await request(app)
        .patch(`/users/${globalState.johnId || 1}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'john.updated@mail.utoronto.ca'
        });
      
      expect(response.status).toBe(200);
    });

    it('Case 24: UPDATE_ROLE_FORBIDDEN - should return 403 for manager trying to set manager role', async () => {
      const response = await request(app)
        .patch(`/users/${globalState.johnId || 1}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'manager'
        });
      
      expect(response.status).toBe(403);
    });

    it('Case 25: VERIFY_MOCK0000_OK - should return 200 for verification update', async () => {
      const response = await request(app)
        .patch(`/users/${globalState.mockId || 2}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          verified: true
        });
      
      expect(response.status).toBe(200);
    });

    it('Case 26: UPDATE_ROLE_OK - should return 200 for valid role update', async () => {
      const response = await request(app)
        .patch(`/users/${globalState.johnId || 1}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'cashier'
        });
      
      expect(response.status).toBe(200);
    });

    it('Case 27: SET_SUSPICIOUS_OK - should return 200 for setting suspicious flag', async () => {
      const response = await request(app)
        .patch(`/users/${globalState.johnId || 1}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          suspicious: true
        });
      
      expect(response.status).toBe(200);
    });
  });

  describe('Case 28-29: Get user info', () => {
    it('Case 28: Get user info - password field should be string', async () => {
      const response = await request(app)
        .get(`/users/${globalState.johnId || 1}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('password');
      expect(typeof response.body.password).toBe('string');
    });

    it('Case 29: GET_INFO_MANAGER_OK - should return 200 for manager view', async () => {
      const response = await request(app)
        .get(`/users/${globalState.johnId || 1}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('role');
    });
  });

  describe('Case 30-32: Update my password', () => {
    it('Case 30: UPDATE_MY_PASSWORD_WRONG_PASSWORD - should return 403 for wrong password', async () => {
      const response = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          old: 'wrongpassword',
          new: 'newpassword123'
        });
      
      expect(response.status).toBe(403);
    });

    it('Case 31: UPDATE_MY_PASSWORD_EMPTY_PAYLOAD - should return 400 for empty payload', async () => {
      const response = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({});
      
      expect(response.status).toBe(400);
    });

    it('Case 32: UPDATE_MY_PASSWORD_OK - should return 200 for valid password change', async () => {
      const response = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          old: 'password',
          new: 'newpassword123'
        });
      
      expect(response.status).toBe(200);
    });
  });

  describe('Case 33-35: Update my info', () => {
    it('Case 33: Update my info - password field should be string', async () => {
      const response = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          name: 'Updated Name'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('password');
      expect(typeof response.body.password).toBe('string');
    });

    it('Case 34: UPDATE_MY_INFO_OK - should return 200 for valid update', async () => {
      const response = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          email: 'updated@mail.utoronto.ca'
        });
      
      expect(response.status).toBe(200);
    });

    it('Case 35: Get my info - password field should be string', async () => {
      const response = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('password');
      expect(typeof response.body.password).toBe('string');
    });
  });
});

