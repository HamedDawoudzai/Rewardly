'use strict';

const express = require('express');
const router = express.Router();

const {
  createEventHandler,
  listEventsHandler,
  getEventHandler,
  updateEventHandler,
  deleteEventHandler,
  addOrganizerHandler,
  removeOrganizerHandler,
  addGuestHandler,
  removeGuestHandler,
  addSelfAsGuestHandler,
  removeSelfAsGuestHandler,
  awardPointsHandler
} = require('../controllers/eventController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

/**
 * Event Routes
 */

// POST /events - Create event (Manager+)
router.post('/', authenticate, requirePermission('MANAGER_CREATE_EVENT'), createEventHandler);

// GET /events - List events (Regular+)
router.get('/', authenticate, listEventsHandler);

// GET /events/:eventId - Get event (Regular+)
router.get('/:eventId', authenticate, getEventHandler);

// PATCH /events/:eventId - Update event (Manager+ or organizer)
router.patch('/:eventId', authenticate, updateEventHandler);

// DELETE /events/:eventId - Delete event (Manager+)
router.delete('/:eventId', authenticate, requirePermission('MANAGER_CREATE_EVENT'), deleteEventHandler);

// POST /events/:eventId/organizers - Add organizer (Manager+)
router.post('/:eventId/organizers', authenticate, requirePermission('MANAGER_ASSIGN_EVENT_ORGANIZER'), addOrganizerHandler);

// DELETE /events/:eventId/organizers/:userId - Remove organizer (Manager+)
router.delete('/:eventId/organizers/:userId', authenticate, requirePermission('MANAGER_ASSIGN_EVENT_ORGANIZER'), removeOrganizerHandler);

// POST /events/:eventId/guests/me - RSVP to event (Regular+)
router.post('/:eventId/guests/me', authenticate, addSelfAsGuestHandler);

// DELETE /events/:eventId/guests/me - Un-RSVP from event (Regular+)
router.delete('/:eventId/guests/me', authenticate, removeSelfAsGuestHandler);

// POST /events/:eventId/guests - Add guest (Manager+ or organizer)
router.post('/:eventId/guests', authenticate, addGuestHandler);

// DELETE /events/:eventId/guests/:userId - Remove guest (Manager+)
router.delete('/:eventId/guests/:userId', authenticate, requirePermission('MANAGER_ASSIGN_EVENT_ORGANIZER'), removeGuestHandler);

// POST /events/:eventId/transactions - Award points (Manager+ or organizer)
router.post('/:eventId/transactions', authenticate, awardPointsHandler);

module.exports = router;

