'use strict';

const request = require('supertest');
const express = require('express');

// Mock the services and middleware BEFORE requiring routes
jest.mock('../../services/eventService');
jest.mock('../../services/userService');
jest.mock('../../middleware/auth');
jest.mock('../../middleware/permissions');

const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/permissions');

// Setup default mocks BEFORE requiring routes
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

// NOW require routes (after mocks are set up)
const eventRoutes = require('../../routes/eventRoutes');
const eventService = require('../../services/eventService');
const userService = require('../../services/userService');

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/events', eventRoutes);

describe('Event Controller', () => {
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

  describe('POST /events', () => {
    it('should create an event successfully (happy path)', async () => {
      const mockEvent = {
        id: 1,
        name: 'Test Event',
        description: 'Event description',
        location: 'Test Hall',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        capacity: 100,
        pointsRemain: 1000,
        pointsAwarded: 0,
        organizers: [],
        guests: []
      };

      eventService.createEvent = jest.fn().mockResolvedValue(mockEvent);

      const response = await request(app)
        .post('/events')
        .send({
          name: 'Test Event',
          description: 'Event description',
          location: 'Test Hall',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          capacity: 100,
          points: 1000
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Event');
      expect(response.body).toHaveProperty('pointsRemain');
    });

    it('should return 400 for invalid timing (bad path)', async () => {
      eventService.createEvent = jest.fn().mockRejectedValue(
        new Error('End time must be after start time')
      );

      const response = await request(app)
        .post('/events')
        .send({
          name: 'Test Event',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          points: 1000
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing required fields (bad path)', async () => {
      const response = await request(app)
        .post('/events')
        .send({
          name: 'Test Event'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for null inputs (bad path)', async () => {
      const response = await request(app)
        .post('/events')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /events', () => {
    it('should list events successfully (happy path)', async () => {
      const mockResult = {
        count: 2,
        results: [
          {
            id: 1,
            name: 'Event 1',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            capacity: 100,
            numGuests: 25
          },
          {
            id: 2,
            name: 'Event 2',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            capacity: 50,
            numGuests: 10
          }
        ]
      };

      eventService.getEvents = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/events')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      expect(response.body.results).toHaveLength(2);
    });

    it('should filter events by name (happy path)', async () => {
      const mockResult = {
        count: 1,
        results: [
          {
            id: 1,
            name: 'Workshop',
            capacity: 50
          }
        ]
      };

      eventService.getEvents = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/events')
        .query({ name: 'Workshop' });

      expect(response.status).toBe(200);
      expect(response.body.results[0].name).toContain('Workshop');
    });

    it('should return 400 for conflicting filters (bad path)', async () => {
      eventService.getEvents = jest.fn().mockRejectedValue(
        new Error('Cannot filter by both started and ended')
      );

      const response = await request(app)
        .get('/events')
        .query({ started: 'true', ended: 'true' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /events/:eventId', () => {
    it('should get event by ID successfully (happy path)', async () => {
      const mockEvent = {
        id: 1,
        name: 'Test Event',
        description: 'Event description',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        capacity: 100,
        organizers: [],
        numGuests: 25
      };

      eventService.getEventById = jest.fn().mockResolvedValue(mockEvent);

      const response = await request(app)
        .get('/events/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.name).toBe('Test Event');
    });

    it('should return 404 for non-existent event (bad path)', async () => {
      eventService.getEventById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/events/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid ID (bad path)', async () => {
      const response = await request(app)
        .get('/events/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /events/:eventId', () => {
    it('should update event successfully (happy path)', async () => {
      const mockResult = {
        id: 1,
        name: 'Updated Event',
        location: 'New Location'
      };

      eventService.updateEvent = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .patch('/events/1')
        .send({
          name: 'Updated Event',
          location: 'New Location'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Event');
    });

    it('should return 400 for editing after start (bad path)', async () => {
      eventService.updateEvent = jest.fn().mockRejectedValue(
        new Error('Cannot edit name after event has started')
      );

      const response = await request(app)
        .patch('/events/1')
        .send({ name: 'New Name' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid fields (bad path)', async () => {
      const response = await request(app)
        .patch('/events/1')
        .send({ invalidField: 'value' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /events/:eventId', () => {
    it('should delete event successfully (happy path)', async () => {
      eventService.deleteEvent = jest.fn().mockResolvedValue({ success: true });

      const response = await request(app)
        .delete('/events/1');

      expect(response.status).toBe(204);
    });

    it('should return 400 for deleting published event (bad path)', async () => {
      eventService.deleteEvent = jest.fn().mockRejectedValue(
        new Error('Cannot delete published event')
      );

      const response = await request(app)
        .delete('/events/1');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid ID (bad path)', async () => {
      const response = await request(app)
        .delete('/events/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /events/:eventId/organizers', () => {
    it('should add organizer successfully (happy path)', async () => {
      const mockEvent = {
        id: 1,
        name: 'Test Event',
        organizers: [
          { id: 2, utorid: 'neworg', name: 'New Organizer' }
        ]
      };

      eventService.addOrganizer = jest.fn().mockResolvedValue(mockEvent);

      const response = await request(app)
        .post('/events/1/organizers')
        .send({ utorid: 'neworg' });

      expect(response.status).toBe(201);
      expect(response.body.organizers).toHaveLength(1);
    });

    it('should return 400 if user is already a guest (bad path)', async () => {
      eventService.addOrganizer = jest.fn().mockRejectedValue(
        new Error('User is already a guest')
      );

      const response = await request(app)
        .post('/events/1/organizers')
        .send({ utorid: 'guest1' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 410 if event has ended (bad path)', async () => {
      eventService.addOrganizer = jest.fn().mockRejectedValue(
        new Error('Cannot add organizer to ended event')
      );

      const response = await request(app)
        .post('/events/1/organizers')
        .send({ utorid: 'neworg' });

      expect(response.status).toBe(410);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for null input (bad path)', async () => {
      const response = await request(app)
        .post('/events/1/organizers')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /events/:eventId/organizers/:userId', () => {
    it('should remove organizer successfully (happy path)', async () => {
      eventService.removeOrganizer = jest.fn().mockResolvedValue({ success: true });

      const response = await request(app)
        .delete('/events/1/organizers/2');

      expect(response.status).toBe(204);
    });

    it('should return 400 for invalid IDs (bad path)', async () => {
      const response = await request(app)
        .delete('/events/invalid/organizers/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /events/:eventId/guests', () => {
    it('should add guest successfully (happy path)', async () => {
      const mockEvent = {
        id: 1,
        name: 'Test Event',
        guestAdded: { id: 3, utorid: 'guest1', name: 'Guest One' }
      };

      eventService.addGuest = jest.fn().mockResolvedValue(mockEvent);

      const response = await request(app)
        .post('/events/1/guests')
        .send({ utorid: 'guest1' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('guestAdded');
    });

    it('should return 410 if event is full (bad path)', async () => {
      eventService.addGuest = jest.fn().mockRejectedValue(
        new Error('Event is full')
      );

      const response = await request(app)
        .post('/events/1/guests')
        .send({ utorid: 'guest1' });

      expect(response.status).toBe(410);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if user is organizer (bad path)', async () => {
      eventService.addGuest = jest.fn().mockRejectedValue(
        new Error('User is already an organizer')
      );

      const response = await request(app)
        .post('/events/1/guests')
        .send({ utorid: 'organizer1' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for null input (bad path)', async () => {
      const response = await request(app)
        .post('/events/1/guests')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /events/:eventId/guests/me', () => {
    it('should RSVP to event successfully (happy path)', async () => {
      eventService.addSelfAsGuest = jest.fn().mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/events/1/guests/me')
        .send();

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 410 if event is full (bad path)', async () => {
      eventService.addSelfAsGuest = jest.fn().mockRejectedValue(
        new Error('Event is full')
      );

      const response = await request(app)
        .post('/events/1/guests/me')
        .send();

      expect(response.status).toBe(410);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if already RSVP\'d (bad path)', async () => {
      eventService.addSelfAsGuest = jest.fn().mockRejectedValue(
        new Error('Already RSVP\'d to this event')
      );

      const response = await request(app)
        .post('/events/1/guests/me')
        .send();

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /events/:eventId/guests/me', () => {
    it('should un-RSVP from event successfully (happy path)', async () => {
      eventService.removeSelfAsGuest = jest.fn().mockResolvedValue({ success: true });

      const response = await request(app)
        .delete('/events/1/guests/me');

      expect(response.status).toBe(204);
    });

    it('should return 404 if not RSVP\'d (bad path)', async () => {
      eventService.removeSelfAsGuest = jest.fn().mockRejectedValue(
        new Error('Not RSVP\'d to this event')
      );

      const response = await request(app)
        .delete('/events/1/guests/me');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 410 if event has ended (bad path)', async () => {
      eventService.removeSelfAsGuest = jest.fn().mockRejectedValue(
        new Error('Event has ended')
      );

      const response = await request(app)
        .delete('/events/1/guests/me');

      expect(response.status).toBe(410);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /events/:eventId/transactions', () => {
    it('should award points to single guest (happy path)', async () => {
      const mockResult = {
        id: 1,
        type: 'event',
        amount: 50,
        user: { id: 3, utorid: 'guest1', name: 'Guest One' }
      };

      eventService.awardPoints = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/events/1/transactions')
        .send({
          type: 'event',
          utorid: 'guest1',
          amount: 50,
          remark: 'Participation'
        });

      expect(response.status).toBe(201);
      expect(response.body.amount).toBe(50);
    });

    it('should award points to all guests (happy path)', async () => {
      const mockResults = [
        { id: 1, type: 'event', amount: 50 },
        { id: 2, type: 'event', amount: 50 }
      ];

      eventService.awardPoints = jest.fn().mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/events/1/transactions')
        .send({
          type: 'event',
          amount: 50
          // No utorid = award to all
        });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 400 if user not a guest (bad path)', async () => {
      eventService.awardPoints = jest.fn().mockRejectedValue(
        new Error('User is not a guest')
      );

      const response = await request(app)
        .post('/events/1/transactions')
        .send({
          type: 'event',
          utorid: 'nonguest',
          amount: 50
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if insufficient points (bad path)', async () => {
      eventService.awardPoints = jest.fn().mockRejectedValue(
        new Error('Insufficient points in event pool')
      );

      const response = await request(app)
        .post('/events/1/transactions')
        .send({
          type: 'event',
          utorid: 'guest1',
          amount: 10000
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for null/missing amount (bad path)', async () => {
      const response = await request(app)
        .post('/events/1/transactions')
        .send({
          type: 'event',
          utorid: 'guest1'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});

