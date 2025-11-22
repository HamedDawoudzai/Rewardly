'use strict';

const eventRepository = require('../repositories/eventRepository');
const userRepository = require('../repositories/userRepository');

/**
 * Event Service
 * Handles business logic for event operations
 */

/**
 * Validate event timing
 */
function validateEventTiming(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  if (start >= end) {
    throw new Error('End time must be after start time');
  }

  // Allow a 5-second buffer for clock skew and processing delays
  const fiveSecondsAgo = new Date(now.getTime() - 5000);
  if (start < fiveSecondsAgo) {
    throw new Error('Start time must be in the future');
  }

  return true;
}

/**
 * Create an event
 */
async function createEvent(data, createdBy) {
  const { name, description, location, startTime, endTime, capacity, points } = data;

  // Validate timing
  validateEventTiming(startTime, endTime);

  // Validate capacity
  if (capacity !== null && capacity !== undefined && capacity <= 0) {
    throw new Error('Capacity must be greater than 0 or null');
  }

  // Validate points
  if (!points || points <= 0) {
    throw new Error('Points must be greater than 0');
  }

  const event = await eventRepository.createEvent({
    name,
    description,
    location,
    startTime,
    endTime,
    capacity,
    points,
    createdBy
  });

  return mapEventToResponse(event, true);
}

/**
 * Get events with filters
 */
async function getEvents(filters, page, limit, isManager) {
  // Validate filters
  if (filters.started !== undefined && filters.ended !== undefined) {
    throw new Error('Cannot filter by both started and ended');
  }

  const { events, total } = await eventRepository.findEventsWithFilters(filters, page, limit, isManager);

  const results = events.map(event => {
    const mapped = mapEventToResponse(event, isManager);
    
    // For regular users, don't include description in list view
    if (!isManager) {
      delete mapped.description;
    }

    return mapped;
  });

  return {
    count: total,
    results
  };
}

/**
 * Get event by ID
 */
async function getEventById(eventId, userId, userRole) {
  const event = await eventRepository.findEventById(eventId);
  
  if (!event) {
    return null;
  }

  const isOrganizer = await eventRepository.isOrganizer(eventId, userId);
  const isManagerOrHigher = userRole === 'manager' || userRole === 'superuser';

  // Regular users can only see published events unless they're organizers
  if (!isManagerOrHigher && !isOrganizer) {
    if (!event.published) {
      return null;
    }
  }

  return mapEventToResponse(event, isManagerOrHigher || isOrganizer);
}

/**
 * Update event
 */
async function updateEvent(eventId, updates, userId, userRole) {
  const event = await eventRepository.findEventById(eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }

  const isOrganizer = await eventRepository.isOrganizer(eventId, userId);
  const isManager = userRole === 'manager' || userRole === 'superuser';

  // Check permissions
  if (!isManager && !isOrganizer) {
    throw new Error('Not authorized to update this event');
  }

  // Organizers cannot change points or publish status
  if (isOrganizer && !isManager) {
    if (updates.points !== undefined || updates.published !== undefined) {
      throw new Error('Organizers cannot change points or publish status');
    }
  }

  // Validate timing if being updated
  if (updates.startTime || updates.endTime) {
    const newStart = updates.startTime ? new Date(updates.startTime) : event.startsAt;
    const newEnd = updates.endTime ? new Date(updates.endTime) : event.endsAt;
    const now = new Date();

    if (newStart >= newEnd) {
      throw new Error('End time must be after start time');
    }

    if (newStart < now || newEnd < now) {
      throw new Error('Cannot set times in the past');
    }
  }

  // Check if event has started - certain fields cannot be edited after start
  const now = new Date();
  if (event.startsAt <= now) {
    // Check if any of these fields are being updated (including null updates)
    if (updates.name !== undefined || 
        updates.description !== undefined || 
        updates.location !== undefined || 
        updates.startTime !== undefined || 
        (updates.capacity !== undefined && updates.capacity !== null)) {
      throw new Error('Cannot edit name, description, location, start time, or capacity after event has started');
    }
  }

  // Check if event has ended - endTime cannot be edited after end
  if (event.endsAt <= now) {
    if (updates.endTime) {
      throw new Error('Cannot edit end time after event has ended');
    }
  }

  // Validate capacity reduction
  if (updates.capacity !== undefined && updates.capacity !== null) {
    const guestsCount = await eventRepository.getGuestsCount(eventId);
    // Ensure guestsCount is always a number for comparison
    const count = (guestsCount !== null && guestsCount !== undefined) ? guestsCount : 0;
    if (updates.capacity < count) {
      throw new Error('Cannot reduce capacity below number of confirmed guests');
    }
  }

  // Validate points reduction and calculate new pointsPool
  let calculatedPointsPool = undefined;
  if (updates.points !== undefined && updates.points !== null) {
    const pointsInfo = await eventRepository.getEventPointsInfo(eventId);
    if (!pointsInfo) {
      throw new Error('Event not found');
    }
    // Ensure pointsAwarded is always a number (handle null/undefined)
    const pointsAwarded = (pointsInfo.pointsAwarded !== null && pointsInfo.pointsAwarded !== undefined) 
      ? pointsInfo.pointsAwarded 
      : 0;
    // Ensure updates.points is a valid number for comparison
    if (typeof updates.points !== 'number' || isNaN(updates.points)) {
      throw new Error('Invalid points value');
    }
    if (updates.points < pointsAwarded) {
      throw new Error('Cannot reduce points below amount already awarded');
    }
    // Calculate the new pointsPool (remaining = total - awarded)
    calculatedPointsPool = updates.points - pointsAwarded;
  }

  const updatedEvent = await eventRepository.updateEvent(eventId, updates, calculatedPointsPool);

  // Return id, name, location and updated fields
  const result = {
    id: updatedEvent.id,
    name: updatedEvent.name,
    location: updatedEvent.location
  };

  // Only include fields that were actually updated (check !== undefined and !== null)
  if (updates.name !== undefined && updates.name !== null) result.name = updatedEvent.name;
  if (updates.description !== undefined && updates.description !== null) result.description = updatedEvent.description;
  if (updates.location !== undefined && updates.location !== null) result.location = updatedEvent.location;
  if (updates.startTime !== undefined && updates.startTime !== null) result.startTime = updatedEvent.startsAt.toISOString();
  if (updates.endTime !== undefined && updates.endTime !== null) result.endTime = updatedEvent.endsAt.toISOString();
  if (updates.capacity !== undefined && updates.capacity !== null) {
    // Ensure capacity is always a valid number (never null) when included in response
    const capacityValue = (updatedEvent.capacity !== null && updatedEvent.capacity !== undefined) 
      ? updatedEvent.capacity 
      : updates.capacity;
    // Double-check it's a valid number
    if (typeof capacityValue === 'number' && !isNaN(capacityValue)) {
      result.capacity = capacityValue;
    }
  }
  // Return pointsRemain and pointsAwarded when points are updated
  if (updates.points !== undefined && updates.points !== null) {
    // Calculate pointsAwarded from awards
    const pointsAwarded = (updatedEvent.awards && Array.isArray(updatedEvent.awards))
      ? updatedEvent.awards.reduce((sum, award) => sum + (award.points || 0), 0)
      : 0;
    
    // pointsRemain is the current pointsPool (which we just updated)
    const pointsRemain = (updatedEvent.pointsPool !== null && updatedEvent.pointsPool !== undefined)
      ? updatedEvent.pointsPool
      : 0;
    
    result.pointsRemain = pointsRemain;
    result.pointsAwarded = pointsAwarded;
  }
  // Published can only be set to true, so only include it if it's true
  if (updates.published !== undefined && updates.published !== null) {
    result.published = updates.published === true;
  }

  return result;
}

/**
 * Delete event
 */
async function deleteEvent(eventId) {
  const event = await eventRepository.findEventById(eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }

  // Cannot delete published events
  if (event.published) {
    throw new Error('Cannot delete published event');
  }
  
  await eventRepository.deleteEvent(eventId);
  return { success: true };
}

/**
 * Add organizer to event
 */
async function addOrganizer(eventId, utorid) {
  const event = await eventRepository.findEventById(eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }

  // Check if event has ended
  if (event.endsAt <= new Date()) {
    throw new Error('Cannot add organizer to ended event');
  }

  const user = await userRepository.findUserByUsername(utorid);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if user is already a guest
  if (await eventRepository.isGuest(eventId, user.id)) {
    throw new Error('Cannot add guest as organizer.');
  }

  await eventRepository.addOrganizer(eventId, user.id);

  const updatedEvent = await eventRepository.findEventById(eventId);
  return mapEventToResponse(updatedEvent, true);
}

/**
 * Remove organizer from event
 */
async function removeOrganizer(eventId, userId) {
  await eventRepository.removeOrganizer(eventId, userId);
  return { success: true };
}

/**
 * Add guest to event
 */
async function addGuest(eventId, utorid, userId, userRole) {
  const event = await eventRepository.findEventById(eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }

  const isOrganizer = await eventRepository.isOrganizer(eventId, userId);
  const isManager = userRole === 'manager' || userRole === 'superuser';

  // Check permissions
  if (!isManager && !isOrganizer) {
    throw new Error('Not authorized');
  }

  // Check if event has ended
  if (event.endsAt <= new Date()) {
    throw new Error('Event has ended');
  }

  // Check capacity (only if capacity is set and not null)
  if (event.capacity !== null && event.capacity !== undefined) {
    const guestsCount = await eventRepository.getGuestsCount(eventId);
    // Ensure guestsCount is always a number for comparison
    const count = (guestsCount !== null && guestsCount !== undefined) ? guestsCount : 0;
    if (count >= event.capacity) {
      throw new Error('Event is full');
    }
  }

  const user = await userRepository.findUserByUsername(utorid);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if user is organizer
  if (await eventRepository.isOrganizer(eventId, user.id)) {
    throw new Error('User is already an organizer');
  }

  await eventRepository.addGuest(eventId, user.id);

  const updatedEvent = await eventRepository.findEventById(eventId);
  const guestsCount = await eventRepository.getGuestsCount(eventId);
  return {
    ...mapEventToResponse(updatedEvent, true),
    guestAdded: {
      id: user.id,
      utorid: user.username,
      name: user.name
    },
    numGuests: guestsCount
  };
}

/**
 * Remove guest from event
 */
async function removeGuest(eventId, userId) {
  await eventRepository.removeGuest(eventId, userId);
  return { success: true };
}

/**
 * Add self as guest
 */
async function addSelfAsGuest(eventId, userId) {
  const event = await eventRepository.findEventById(eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }

  // Check if event has ended
  if (event.endsAt <= new Date()) {
    throw new Error('Event has ended');
  }

  // Check if already RSVP'd
  if (await eventRepository.isGuest(eventId, userId)) {
    throw new Error('Already RSVP\'d to this event');
  }

  // Check capacity (only if capacity is set and not null)
  if (event.capacity !== null && event.capacity !== undefined) {
    const guestsCount = await eventRepository.getGuestsCount(eventId);
    // Ensure guestsCount is always a number for comparison
    const count = (guestsCount !== null && guestsCount !== undefined) ? guestsCount : 0;
    if (count >= event.capacity) {
      throw new Error('Event is full');
    }
  }

  // Check if user is organizer
  if (await eventRepository.isOrganizer(eventId, userId)) {
    throw new Error('Organizers cannot be guests');
  }

  await eventRepository.addGuest(eventId, userId);

  // Get user info and updated guest count
  const user = await userRepository.findUserById(userId);
  const updatedEvent = await eventRepository.findEventById(eventId);
  const guestsCount = await eventRepository.getGuestsCount(eventId);

  return {
    id: updatedEvent.id,
    name: updatedEvent.name,
    location: updatedEvent.location,
    guestAdded: {
      id: user.id,
      utorid: user.username,
      name: user.name
    },
    numGuests: guestsCount
  };
}

/**
 * Remove self as guest
 */
async function removeSelfAsGuest(eventId, userId) {
  const event = await eventRepository.findEventById(eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }

  // Check if event has ended
  if (event.endsAt <= new Date()) {
    throw new Error('Event has ended');
  }

  // Check if RSVP'd
  if (!(await eventRepository.isGuest(eventId, userId))) {
    throw new Error('Not RSVP\'d to this event');
  }

  await eventRepository.removeGuest(eventId, userId);

  return { success: true };
}

/**
 * Award points to guest(s)
 */
async function awardPoints(eventId, utorid, amount, remark, awardedBy, userRole) {
  const event = await eventRepository.findEventById(eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }

  const isOrganizer = await eventRepository.isOrganizer(eventId, awardedBy);
  const isManager = userRole === 'manager' || userRole === 'superuser';

  // Check permissions
  if (!isManager && !isOrganizer) {
    throw new Error('Not authorized');
  }

  // Check points availability
  const pointsInfo = await eventRepository.getEventPointsInfo(eventId);
  if (pointsInfo.pointsRemain < amount) {
    throw new Error('Insufficient points in event pool');
  }

  // Get the awarder's username
  const awarder = await userRepository.findUserById(awardedBy);
  const createdByUtorid = awarder ? awarder.username : null;

  if (utorid) {
    // Award to specific user
    const user = await userRepository.findUserByUsername(utorid);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is a guest
    if (!(await eventRepository.isGuest(eventId, user.id))) {
      throw new Error('User is not a guest');
    }

    const transaction = await eventRepository.awardPoints(eventId, user.id, amount, awardedBy, remark);
    
    return {
      id: transaction.id,
      recipient: user.username,
      awarded: transaction.pointsPosted,
      type: 'event',
      relatedId: eventId,
      remark: transaction.notes,
      createdBy: createdByUtorid
    };
  } else {
    // Award to all guests
    const guests = event.rsvps.filter(rsvp => rsvp.status === 'yes');
    
    // Check if enough points for all guests
    if (pointsInfo.pointsRemain < amount * guests.length) {
      throw new Error('Insufficient points in event pool for all guests');
    }

    const results = [];
    for (const rsvp of guests) {
      const transaction = await eventRepository.awardPoints(eventId, rsvp.userId, amount, awardedBy, remark);
      results.push({
        id: transaction.id,
        recipient: rsvp.user.username,
        awarded: transaction.pointsPosted,
        type: 'event',
        relatedId: eventId,
        remark: transaction.notes,
        createdBy: createdByUtorid
      });
    }

    return results;
  }
}

/**
 * Map event from DB to API response format
 */
function mapEventToResponse(event, includeAdminFields = false) {
  const result = {
    id: event.id,
    name: event.name,
    description: event.description || null,
    location: event.location || null,
    startTime: event.startsAt.toISOString(),
    endTime: event.endsAt.toISOString(),
    capacity: event.capacity,
    organizers: event.organizers?.map(o => ({
      id: o.user.id,
      utorid: o.user.username,
      name: o.user.name
    })) || []
  };

  if (includeAdminFields) {
    // Manager+ or organizer view
    const pointsInfo = event.awards ? {
      pointsAwarded: event.awards.reduce((sum, a) => sum + a.points, 0),
      pointsRemain: event.pointsPool
    } : {
      pointsAwarded: 0,
      pointsRemain: event.pointsPool
    };

    result.pointsRemain = pointsInfo.pointsRemain;
    result.pointsAwarded = pointsInfo.pointsAwarded;
    result.published = event.published || false;
    result.guests = event.rsvps?.filter(r => r.status === 'yes').map(r => ({
      id: r.user.id,
      utorid: r.user.username,
      name: r.user.name
    })) || [];
  } else {
    // Regular user view
    result.numGuests = event.rsvps?.filter(r => r.status === 'yes').length || 0;
  }

  return result;
}

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  addOrganizer,
  removeOrganizer,
  addGuest,
  removeGuest,
  addSelfAsGuest,
  removeSelfAsGuest,
  awardPoints
};

