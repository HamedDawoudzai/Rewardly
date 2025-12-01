import { apiFetch } from './api';

/**
 * Events API
 * For managing events, RSVPs, organizers, and point awards
 */
export const eventAPI = {
  // ============================================================
  // EVENT CRUD OPERATIONS
  // ============================================================

  /**
   * List events with pagination & filters
   * @param {Object} params - { page, limit, name, location, started, ended, showFull, published }
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    return apiFetch(`/events${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get event by ID
   * @param {number} id - Event ID
   */
  getById: async (id) => {
    return apiFetch(`/events/${id}`);
  },

  /**
   * Create a new event (Manager+)
   * @param {Object} data - { name, description, location, startTime, endTime, capacity, points }
   */
  create: async (data) => {
    return apiFetch('/events', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        description: data.description || 'No description provided',
        location: data.location,
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        points: data.points ? parseInt(data.points) : 100, // Default to 100 points
      }),
    });
  },

  /**
   * Update an event (Manager+ or Organizer)
   * @param {number} id - Event ID
   * @param {Object} data - Fields to update
   */
  update: async (id, data) => {
    const updateData = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.capacity !== undefined) updateData.capacity = data.capacity ? parseInt(data.capacity) : null;
    if (data.points !== undefined) updateData.points = parseInt(data.points);
    // Only send published if it's true (publishing is one-way, can't unpublish)
    if (data.published === true) updateData.published = true;

    return apiFetch(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  },

  /**
   * Delete an event (Manager+)
   * @param {number} id - Event ID
   */
  delete: async (id) => {
    return apiFetch(`/events/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get events where current user is an organizer
   * @param {Object} params - { page, limit }
   */
  getMyOrganizedEvents: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    return apiFetch(`/events/organized${queryString ? `?${queryString}` : ''}`);
  },

  // ============================================================
  // RSVP OPERATIONS (Current User)
  // ============================================================

  /**
   * RSVP to an event (current user)
   * @param {number} eventId - Event ID
   */
  rsvp: async (eventId) => {
    return apiFetch(`/events/${eventId}/guests/me`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  /**
   * Cancel RSVP from an event (current user)
   * @param {number} eventId - Event ID
   */
  cancelRsvp: async (eventId) => {
    return apiFetch(`/events/${eventId}/guests/me`, {
      method: 'DELETE',
    });
  },

  // ============================================================
  // GUEST MANAGEMENT (Manager/Organizer)
  // ============================================================

  /**
   * Add a guest to an event (Manager/Organizer)
   * @param {number} eventId - Event ID
   * @param {string} utorid - Guest's UTORid
   */
  addGuest: async (eventId, utorid) => {
    return apiFetch(`/events/${eventId}/guests`, {
      method: 'POST',
      body: JSON.stringify({ utorid }),
    });
  },

  /**
   * Remove a guest from an event (Manager+)
   * @param {number} eventId - Event ID
   * @param {number} userId - User ID to remove
   */
  removeGuest: async (eventId, userId) => {
    return apiFetch(`/events/${eventId}/guests/${userId}`, {
      method: 'DELETE',
    });
  },

  // ============================================================
  // ORGANIZER MANAGEMENT (Manager+)
  // ============================================================

  /**
   * Add an organizer to an event (Manager+)
   * @param {number} eventId - Event ID
   * @param {string} utorid - Organizer's UTORid
   */
  addOrganizer: async (eventId, utorid) => {
    return apiFetch(`/events/${eventId}/organizers`, {
      method: 'POST',
      body: JSON.stringify({ utorid }),
    });
  },

  /**
   * Remove an organizer from an event (Manager+)
   * @param {number} eventId - Event ID
   * @param {number} userId - User ID to remove
   */
  removeOrganizer: async (eventId, userId) => {
    return apiFetch(`/events/${eventId}/organizers/${userId}`, {
      method: 'DELETE',
    });
  },

  // ============================================================
  // POINT AWARDS (Manager/Organizer)
  // ============================================================

  /**
   * Award points to event attendees
   * @param {number} eventId - Event ID
   * @param {Object} data - { utorid?, amount, type: 'single' | 'all' }
   */
  awardPoints: async (eventId, data) => {
    const body = {
      amount: parseInt(data.amount),
    };
    
    // If utorid provided, award to specific user
    if (data.utorid) {
      body.utorid = data.utorid;
    }
    // If type is 'all', the backend should handle awarding to all attendees
    if (data.type === 'all') {
      body.type = 'all';
    }

    return apiFetch(`/events/${eventId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};

export default eventAPI;

