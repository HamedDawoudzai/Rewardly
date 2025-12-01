'use strict';

const eventService = require('../services/eventService');
const userService = require('../services/userService');
const { z } = require('zod');

/**
 * Event Controller
 * Handles HTTP requests for event operations
 */

// Validation schemas
const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  startTime: z.string().datetime({ offset: true, message: 'startTime must be in ISO 8601 format' }),
  endTime: z.string().datetime({ offset: true, message: 'endTime must be in ISO 8601 format' }),
  capacity: z.number().int().positive({ message: 'Capacity must be a positive integer or null' }).nullable().optional(),
  points: z.number().int().positive({ message: 'Points must be a positive integer' })
}).refine(
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end > start;
  },
  {
    message: 'endTime must be after startTime',
    path: ['endTime']
  }
);

const updateEventSchema = z.object({
  name: z.string().min(1).nullable().optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  capacity: z.number().int().positive({ message: 'Capacity must be a positive integer or null' }).nullable().optional(),
  points: z.number().int().positive({ message: 'Points must be a positive integer' }).nullable().optional(),
  published: z.literal(true).nullable().optional()
}).strict();

const addOrganizerSchema = z.object({
  utorid: z.string()
});

const addGuestSchema = z.object({
  utorid: z.string()
});

const awardPointsSchema = z.object({
  type: z.literal('event'),
  utorid: z.string().nullable().optional(),
  amount: z.number().positive(),
  remark: z.string().nullable().optional()
});

/**
 * POST /events
 * Create an event (Manager+)
 */
async function createEventHandler(req, res) {
  try {
    // Log incoming request
    console.log('[EVENT CREATE] Request received:', {
      userId: req.user?.id,
      utorid: req.user?.username,
      role: req.user?.roles?.map(r => r.role?.name) || [],
      bodyKeys: Object.keys(req.body || {}),
      bodySize: JSON.stringify(req.body || {}).length
    });

    // Validate request body first
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('[EVENT CREATE] Empty payload rejected:', {
        userId: req.user?.id,
        utorid: req.user?.username
      });
      return res.status(400).json({ error: 'Request body is required' });
    }
    
    const validatedData = createEventSchema.parse(req.body);
    console.log('[EVENT CREATE] Validation passed, creating event:', {
      userId: req.user.id,
      eventName: validatedData.name
    });
    
    const event = await eventService.createEvent(validatedData, req.user.id);
    console.log('[EVENT CREATE] Event created successfully:', {
      eventId: event.id,
      userId: req.user.id
    });
    
    return res.status(201).json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[EVENT CREATE] Validation error:', {
        userId: req.user?.id,
        errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    console.error('[EVENT CREATE] Error creating event:', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * GET /events
 * List events
 */
async function listEventsHandler(req, res) {
  try {
    const filters = {};
    
    if (req.query.name) filters.name = req.query.name;
    if (req.query.location) filters.location = req.query.location;
    if (req.query.started !== undefined) {
      filters.started = req.query.started === 'true';
    }
    if (req.query.ended !== undefined) {
      filters.ended = req.query.ended === 'true';
    }
    if (req.query.showFull !== undefined) {
      filters.showFull = req.query.showFull === 'true';
    }
    const userRole = userService.getUserRole(req.user);
    const isManager = userRole === 'manager' || userRole === 'superuser';

    // Only managers can filter by published status
    if (isManager && req.query.published !== undefined) {
      filters.published = req.query.published === 'true';
    } else if (!isManager) {
      // Regular users can only see published events
      filters.published = true;
    }

    const page = parseInt(req.query.page) || 1;
    if (page < 1) {
      return res.status(400).json({ error: 'Page must be a positive integer' });
    }

    const limit = parseInt(req.query.limit);
    if (req.query.limit !== undefined) {
      if (isNaN(limit) || limit < 1) {
        return res.status(400).json({ error: 'Invalid limit number' });
      }
    }
    const finalLimit = limit || 10;

    // Pass current user ID to check RSVP status
    const result = await eventService.getEvents(filters, page, finalLimit, isManager, req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message.includes('Cannot filter')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error listing events:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /events/:eventId
 * Get an event by ID
 */
async function getEventHandler(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const userRole = userService.getUserRole(req.user);
    const event = await eventService.getEventById(eventId, req.user.id, userRole);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.status(200).json(event);
  } catch (error) {
    console.error('Error getting event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /events/:eventId
 * Update an event (Manager+ or organizer)
 */
async function updateEventHandler(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const validatedData = updateEventSchema.parse(req.body);
    
    // Filter out null values - null means "don't update this field"
    const filteredUpdates = {};
    for (const [key, value] of Object.entries(validatedData)) {
      if (value !== null) {
        filteredUpdates[key] = value;
      }
    }
    
    const userRole = userService.getUserRole(req.user);
    
    const result = await eventService.updateEvent(eventId, filteredUpdates, req.user.id, userRole);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Not authorized') || error.message.includes('cannot change')) {
      return res.status(403).json({ error: error.message });
    }
    console.error('Error updating event:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * DELETE /events/:eventId
 * Delete an event (Manager+)
 */
async function deleteEventHandler(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const result = await eventService.deleteEvent(eventId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * POST /events/:eventId/organizers
 * Add an organizer (Manager+)
 */
async function addOrganizerHandler(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const validatedData = addOrganizerSchema.parse(req.body);
    const result = await eventService.addOrganizer(eventId, validatedData.utorid);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('ended')) {
      return res.status(410).json({ error: error.message });
    }
    console.error('Error adding organizer:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * DELETE /events/:eventId/organizers/:userId
 * Remove an organizer (Manager+)
 */
async function removeOrganizerHandler(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    const userId = parseInt(req.params.userId);
    
    if (isNaN(eventId) || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    await eventService.removeOrganizer(eventId, userId);
    return res.status(204).send();
  } catch (error) {
    console.error('Error removing organizer:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * POST /events/:eventId/guests
 * Add a guest (Manager+ or organizer)
 */
async function addGuestHandler(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const validatedData = addGuestSchema.parse(req.body);
    const userRole = userService.getUserRole(req.user);
    
    const result = await eventService.addGuest(eventId, validatedData.utorid, req.user.id, userRole);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.message.includes('ended') || error.message.includes('full')) {
      return res.status(410).json({ error: error.message });
    }
    console.error('Error adding guest:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * DELETE /events/:eventId/guests/:userId
 * Remove a guest (Manager+)
 */
async function removeGuestHandler(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    const userId = parseInt(req.params.userId);
    
    if (isNaN(eventId) || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    await eventService.removeGuest(eventId, userId);
    return res.status(204).send();
  } catch (error) {
    console.error('Error removing guest:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * POST /events/:eventId/guests/me
 * Add self as guest (Regular+)
 */
async function addSelfAsGuestHandler(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const result = await eventService.addSelfAsGuest(eventId, req.user.id);
    return res.status(201).json(result);
  } catch (error) {
    if (error.message.includes('ended') || error.message.includes('full')) {
      return res.status(410).json({ error: error.message });
    }
    if (error.message.includes('Already')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error adding self as guest:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * DELETE /events/:eventId/guests/me
 * Remove self as guest (Regular+)
 */
async function removeSelfAsGuestHandler(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    await eventService.removeSelfAsGuest(eventId, req.user.id);
    return res.status(204).send();
  } catch (error) {
    if (error.message.includes('ended')) {
      return res.status(410).json({ error: error.message });
    }
    if (error.message.includes('Not RSVP')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error removing self as guest:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * POST /events/:eventId/transactions
 * Award points to guest(s) (Manager+ or organizer)
 */
async function awardPointsHandler(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const validatedData = awardPointsSchema.parse(req.body);
    const userRole = userService.getUserRole(req.user);
    
    const result = await eventService.awardPoints(
      eventId,
      validatedData.utorid,
      validatedData.amount,
      validatedData.remark,
      req.user.id,
      userRole
    );

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    if (error.message.includes('Not authorized')) {
      return res.status(403).json({ error: error.message });
    }
    console.error('Error awarding points:', error);
    return res.status(400).json({ error: error.message || 'Bad request' });
  }
}

/**
 * GET /events/organized
 * Get events where current user is an organizer
 * Managers+ see all events (they're effectively organizers for all)
 */
async function getMyOrganizedEventsHandler(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    if (page < 1) {
      return res.status(400).json({ error: 'Page must be a positive integer' });
    }

    const limit = parseInt(req.query.limit) || 10;
    if (limit < 1) {
      return res.status(400).json({ error: 'Limit must be a positive integer' });
    }

    // Check if user is manager+ (they can organize all events)
    const userRole = userService.getUserRole(req.user);
    const isManager = userRole === 'manager' || userRole === 'superuser';

    const result = await eventService.getMyOrganizedEvents(req.user.id, page, limit, isManager);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting organized events:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createEventHandler,
  listEventsHandler,
  getEventHandler,
  getMyOrganizedEventsHandler,
  updateEventHandler,
  deleteEventHandler,
  addOrganizerHandler,
  removeOrganizerHandler,
  addGuestHandler,
  removeGuestHandler,
  addSelfAsGuestHandler,
  removeSelfAsGuestHandler,
  awardPointsHandler
};

