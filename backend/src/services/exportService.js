'use strict';

/**
 * Export Service
 * Handles data retrieval and CSV generation for exports
 */

const { PrismaClient } = require('@prisma/client');
const { generateCSV, formatDateForCSV, formatCurrency } = require('../utils/csvGenerator');

const prisma = new PrismaClient();

/**
 * Get user's primary role name
 */
function getUserRole(user) {
  if (!user.roles || user.roles.length === 0) return 'regular';
  const roleNames = user.roles.map(r => r.role.name);
  if (roleNames.includes('superuser')) return 'superuser';
  if (roleNames.includes('manager')) return 'manager';
  if (roleNames.includes('cashier')) return 'cashier';
  return 'regular';
}

/**
 * Generate CSV for transactions
 * @param {Object} filters - Optional filters (type, startDate, endDate, status)
 * @returns {Promise<string>} CSV string
 */
async function generateTransactionsCSV(filters = {}) {
  const where = {};
  
  if (filters.type) {
    where.type = filters.type;
  }
  
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      // Set to end of day
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDate;
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      account: { 
        include: { 
          user: true 
        } 
      },
      createdBy: true,
      cashier: true,
      manager: true,
      transferTo: {
        include: {
          user: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Map to CSV-friendly format
  const data = transactions.map(tx => ({
    'ID': tx.id,
    'Type': tx.type,
    'Status': tx.status,
    'User': tx.account?.user?.username || 'N/A',
    'User Name': tx.account?.user?.name || 'N/A',
    'User Email': tx.account?.user?.email || 'N/A',
    'Amount': tx.totalCents ? formatCurrency(tx.totalCents) : '',
    'Points Calculated': tx.pointsCalculated || '',
    'Points Posted': tx.pointsPosted || '',
    'Transfer To': tx.transferTo?.user?.username || '',
    'Created By': tx.createdBy?.username || 'N/A',
    'Cashier': tx.cashier?.username || '',
    'Manager': tx.manager?.username || '',
    'Notes': tx.notes || '',
    'Created At': formatDateForCSV(tx.createdAt),
    'Decided At': formatDateForCSV(tx.decidedAt)
  }));

  return generateCSV(data);
}

/**
 * Generate CSV for users
 * @param {Object} filters - Optional filters (role, verified, activated)
 * @returns {Promise<string>} CSV string
 */
async function generateUsersCSV(filters = {}) {
  const where = {};
  
  if (filters.verified !== undefined && filters.verified !== '') {
    where.isStudentVerified = filters.verified === 'true';
  }
  
  if (filters.activated !== undefined && filters.activated !== '') {
    where.isActivated = filters.activated === 'true';
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      roles: { include: { role: true } },
      account: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Filter by role if specified (after query since it's a relation)
  let filteredUsers = users;
  if (filters.role) {
    filteredUsers = users.filter(u => {
      const userRole = getUserRole(u);
      return userRole === filters.role;
    });
  }

  const data = filteredUsers.map(user => ({
    'ID': user.id,
    'Username': user.username,
    'Name': user.name || '',
    'Email': user.email,
    'Role': getUserRole(user),
    'Points': user.account?.pointsCached || 0,
    'Verified': user.isStudentVerified ? 'Yes' : 'No',
    'Activated': user.isActivated ? 'Yes' : 'No',
    'Suspicious': user.isSuspicious ? 'Yes' : 'No',
    'Birthday': user.birthday ? formatDateForCSV(user.birthday).split(' ')[0] : '',
    'Last Login': formatDateForCSV(user.lastLogin),
    'Created At': formatDateForCSV(user.createdAt)
  }));

  return generateCSV(data);
}

/**
 * Generate CSV for event attendance
 * @param {number} eventId - Event ID
 * @returns {Promise<string>} CSV string
 */
async function generateEventAttendanceCSV(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      rsvps: {
        include: {
          user: { 
            include: { 
              account: true 
            } 
          },
          awards: true,
          confirmedBy: true
        }
      },
      createdBy: true,
      organizers: {
        include: {
          user: true
        }
      }
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  const data = event.rsvps.map(rsvp => ({
    'Event ID': event.id,
    'Event Name': event.name,
    'Event Date': formatDateForCSV(event.startsAt),
    'Event Location': event.location || '',
    'User ID': rsvp.user.id,
    'Username': rsvp.user.username,
    'Name': rsvp.user.name || '',
    'Email': rsvp.user.email,
    'RSVP Status': rsvp.status,
    'Attendance Status': rsvp.attendance,
    'Points Awarded': rsvp.awards.reduce((sum, a) => sum + a.points, 0),
    'Confirmed By': rsvp.confirmedBy?.username || '',
    'Confirmed At': formatDateForCSV(rsvp.confirmedAt)
  }));

  return generateCSV(data);
}

/**
 * Generate CSV for promotions
 * @param {Object} filters - Optional filters (status, kind)
 * @returns {Promise<string>} CSV string
 */
async function generatePromotionsCSV(filters = {}) {
  const where = {};
  
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.kind) {
    where.kind = filters.kind;
  }

  const promotions = await prisma.promotion.findMany({
    where,
    include: {
      createdBy: true,
      _count: {
        select: {
          transactionsApplied: true,
          redemptions: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const data = promotions.map(promo => ({
    'ID': promo.id,
    'Name': promo.name,
    'Description': promo.description || '',
    'Type': promo.kind,
    'Status': promo.status,
    'Offer Code': promo.offerCode || '',
    'Min Spend': promo.minSpendCents ? formatCurrency(promo.minSpendCents) : '',
    'Points Multiplier': promo.pointsPerCentMultiplier || '',
    'Points Bonus': promo.pointsBonus || '',
    'Starts At': formatDateForCSV(promo.startsAt),
    'Ends At': formatDateForCSV(promo.endsAt),
    'Times Used': promo._count.transactionsApplied + promo._count.redemptions,
    'Created By': promo.createdBy?.username || '',
    'Created At': formatDateForCSV(promo.createdAt)
  }));

  return generateCSV(data);
}

module.exports = {
  generateTransactionsCSV,
  generateUsersCSV,
  generateEventAttendanceCSV,
  generatePromotionsCSV
};

