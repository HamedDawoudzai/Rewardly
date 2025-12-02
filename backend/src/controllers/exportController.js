'use strict';

/**
 * Export Controller
 * Handles HTTP requests for data exports
 */

const exportService = require('../services/exportService');

/**
 * GET /export/transactions
 * Export transactions to CSV
 * Query params: type, status, startDate, endDate
 */
async function exportTransactions(req, res) {
  try {
    const filters = {
      type: req.query.type || undefined,
      status: req.query.status || undefined,
      startDate: req.query.startDate || undefined,
      endDate: req.query.endDate || undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const csv = await exportService.generateTransactionsCSV(filters);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `transactions_${timestamp}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
    
  } catch (error) {
    console.error('Export transactions error:', error);
    res.status(500).json({ error: 'Failed to generate transactions export' });
  }
}

/**
 * GET /export/users
 * Export users to CSV
 * Query params: role, verified, activated
 */
async function exportUsers(req, res) {
  try {
    const filters = {
      role: req.query.role || undefined,
      verified: req.query.verified,
      activated: req.query.activated
    };

    // Remove undefined values (but keep empty strings for boolean filters)
    if (filters.role === undefined) delete filters.role;

    const csv = await exportService.generateUsersCSV(filters);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `users_${timestamp}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
    
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ error: 'Failed to generate users export' });
  }
}

/**
 * GET /export/events/:eventId/attendance
 * Export event attendance to CSV
 */
async function exportEventAttendance(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const csv = await exportService.generateEventAttendanceCSV(eventId);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `event_${eventId}_attendance_${timestamp}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
    
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ error: 'Event not found' });
    }
    console.error('Export event attendance error:', error);
    res.status(500).json({ error: 'Failed to generate attendance export' });
  }
}

/**
 * GET /export/promotions
 * Export promotions to CSV
 * Query params: status, kind
 */
async function exportPromotions(req, res) {
  try {
    const filters = {
      status: req.query.status || undefined,
      kind: req.query.kind || undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const csv = await exportService.generatePromotionsCSV(filters);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `promotions_${timestamp}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
    
  } catch (error) {
    console.error('Export promotions error:', error);
    res.status(500).json({ error: 'Failed to generate promotions export' });
  }
}

module.exports = {
  exportTransactions,
  exportUsers,
  exportEventAttendance,
  exportPromotions
};

