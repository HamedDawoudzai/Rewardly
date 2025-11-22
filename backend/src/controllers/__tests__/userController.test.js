'use strict';

const request = require('supertest');
const express = require('express');
const { generateToken } = require('../../utils/jwt');

// Mock the services and middleware BEFORE requiring routes
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

const userRoutes = require('../../routes/userRoutes');
const userService = require('../../services/userService');

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/users', userRoutes);

describe('User Controller', () => {
  let mockUser;
  let mockToken;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user for authentication
    mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@mail.utoronto.ca',
      name: 'Test User',
      isActivated: true,
      isStudentVerified: true,
      roles: [{ role: { name: 'manager' } }],
      account: { pointsCached: 100 }
    };

    // Mock authentication middleware
    authenticate.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });

    // Mock permission middleware
    requirePermission.mockImplementation((permission) => {
      return (req, res, next) => next();
    });

    userService.getUserRole = jest.fn().mockReturnValue('manager');
  });

  describe('POST /users', () => {
    it('should create a new user successfully (happy path)', async () => {
      const newUser = {
        id: 2,
        utorid: 'newuser1',
        name: 'New User',
        email: 'new@mail.utoronto.ca',
        verified: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        resetToken: 'test-uuid'
      };

      userService.createUser = jest.fn().mockResolvedValue(newUser);

      const response = await request(app)
        .post('/users')
        .send({
          utorid: 'newuser1',
          name: 'New User',
          email: 'new@mail.utoronto.ca'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.utorid).toBe('newuser1');
      expect(response.body).toHaveProperty('resetToken');
    });

    it('should return 400 for invalid input (bad path)', async () => {
      const response = await request(app)
        .post('/users')
        .send({
          utorid: '123', // Too short
          name: 'Test',
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 if user already exists (bad path)', async () => {
      const error = new Error('User with this utorid already exists');
      error.code = 'USER_EXISTS';
      userService.createUser = jest.fn().mockRejectedValue(error);

      const response = await request(app)
        .post('/users')
        .send({
          utorid: 'existing',
          name: 'Existing User',
          email: 'exists@mail.utoronto.ca'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for null inputs (bad path)', async () => {
      const response = await request(app)
        .post('/users')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /users', () => {
    it('should list users successfully (happy path)', async () => {
      const mockResult = {
        count: 2,
        results: [
          {
            id: 1,
            utorid: 'user1',
            name: 'User One',
            email: 'user1@mail.utoronto.ca',
            role: 'regular',
            points: 100,
            verified: true
          },
          {
            id: 2,
            utorid: 'user2',
            name: 'User Two',
            email: 'user2@mail.utoronto.ca',
            role: 'cashier',
            points: 50,
            verified: false
          }
        ]
      };

      userService.getUsers = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/users')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      expect(response.body.results).toHaveLength(2);
    });

    it('should filter users by name (happy path)', async () => {
      const mockResult = {
        count: 1,
        results: [
          {
            id: 1,
            utorid: 'john',
            name: 'John Doe',
            email: 'john@mail.utoronto.ca',
            role: 'regular',
            points: 100,
            verified: true
          }
        ]
      };

      userService.getUsers = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/users')
        .query({ name: 'John' });

      expect(response.status).toBe(200);
      expect(response.body.results[0].name).toContain('John');
    });
  });

  describe('GET /users/:userId', () => {
    it('should get user by ID successfully (happy path)', async () => {
      const mockUserData = {
        id: 1,
        utorid: 'testuser',
        name: 'Test User',
        email: 'test@mail.utoronto.ca',
        role: 'regular',
        points: 100,
        verified: true,
        promotions: []
      };

      userService.getUserById = jest.fn().mockResolvedValue(mockUserData);

      const response = await request(app)
        .get('/users/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.utorid).toBe('testuser');
    });

    it('should return 404 for non-existent user (bad path)', async () => {
      userService.getUserById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/users/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid user ID (bad path)', async () => {
      const response = await request(app)
        .get('/users/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /users/:userId', () => {
    it('should update user successfully (happy path)', async () => {
      const mockResult = {
        id: 1,
        utorid: 'testuser',
        name: 'Test User',
        verified: true
      };

      userService.updateUser = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .patch('/users/1')
        .send({ verified: true });

      expect(response.status).toBe(200);
      expect(response.body.verified).toBe(true);
    });

    it('should return 400 for invalid update data (bad path)', async () => {
      const response = await request(app)
        .patch('/users/1')
        .send({ invalidField: 'value' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent user (bad path)', async () => {
      const error = new Error('User not found');
      error.code = 'NOT_FOUND';
      userService.updateUser = jest.fn().mockRejectedValue(error);

      const response = await request(app)
        .patch('/users/999')
        .send({ verified: true });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /users/me', () => {
    it('should get own profile successfully (happy path)', async () => {
      const mockProfile = {
        id: 1,
        utorid: 'testuser',
        name: 'Test User',
        email: 'test@mail.utoronto.ca',
        role: 'regular',
        points: 100,
        verified: true,
        promotions: []
      };

      userService.getOwnProfile = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .get('/users/me');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.utorid).toBe('testuser');
    });

    it('should return 404 if user not found (bad path)', async () => {
      userService.getOwnProfile = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/users/me');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /users/me', () => {
    it('should update own profile successfully (happy path)', async () => {
      const mockProfile = {
        id: 1,
        utorid: 'testuser',
        name: 'Updated Name',
        email: 'test@mail.utoronto.ca',
        birthday: '1990-01-01',
        role: 'regular',
        points: 100,
        verified: true
      };

      userService.updateOwnProfile = jest.fn().mockResolvedValue(mockProfile);

      const response = await request(app)
        .patch('/users/me')
        .send({ name: 'Updated Name', birthday: '1990-01-01' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('should return 400 for invalid data (bad path)', async () => {
      const response = await request(app)
        .patch('/users/me')
        .send({ birthday: 'invalid-date' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /users/me/password', () => {
    it('should change password successfully (happy path)', async () => {
      userService.changePassword = jest.fn().mockResolvedValue({ success: true });

      const response = await request(app)
        .patch('/users/me/password')
        .send({
          old: 'OldPassword123!',
          new: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 for incorrect old password (bad path)', async () => {
      const error = new Error('Incorrect old password');
      error.code = 'FORBIDDEN';
      userService.changePassword = jest.fn().mockRejectedValue(error);

      const response = await request(app)
        .patch('/users/me/password')
        .send({
          old: 'WrongPassword',
          new: 'NewPassword123!'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for weak password (bad path)', async () => {
      const response = await request(app)
        .patch('/users/me/password')
        .send({
          old: 'OldPassword123!',
          new: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing fields (bad path)', async () => {
      const response = await request(app)
        .patch('/users/me/password')
        .send({ new: 'NewPassword123!' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
