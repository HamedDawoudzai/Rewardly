'use strict';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Event Repository
 * Handles all database operations related to events
 */

/**
 * Create an event
 */
async function createEvent(data) {
  const {
    name,
    description,
    location,
    startTime,
    endTime,
    capacity,
    points,
    createdBy
  } = data;

  return await prisma.event.create({
    data: {
      name,
      description: description || null,
      location: location || null,
      startsAt: new Date(startTime),
      endsAt: new Date(endTime),
      capacity: capacity || null,
      pointsPool: points,
      createdById: createdBy
    },
    include: {
      organizers: {
        include: {
          user: true
        }
      },
      rsvps: {
        include: {
          user: true
        }
      }
    }
  });
}

/**
 * Find events with filters and pagination
 */
async function findEventsWithFilters(filters = {}, page = 1, limit = 10, includeUnpublished = false) {
  const where = {};
  const now = new Date();

  if (filters.name) {
    where.name = {
      contains: filters.name,
      mode: 'insensitive'
    };
  }

  if (filters.location) {
    where.location = {
      contains: filters.location,
      mode: 'insensitive'
    };
  }

  if (filters.started !== undefined) {
    where.startsAt = filters.started ? { lte: now } : { gt: now };
  }

  if (filters.ended !== undefined) {
    where.endsAt = filters.ended ? { lte: now } : { gt: now };
  }

  if (filters.showFull === false) {
    // Only show events that are not full
    where.OR = [
      { capacity: null },
      {
        capacity: {
          gt: prisma.raw('(SELECT COUNT(*) FROM "EventRSVP" WHERE "eventId" = "Event"."id" AND status = \'yes\')')
        }
      }
    ];
  }

  if (filters.published !== undefined) {
    where.published = filters.published;
  }

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      include: {
        organizers: {
          include: {
            user: true
          }
        },
        rsvps: {
          where: { status: 'yes' },
          include: {
            user: true
          }
        },
        awards: true
      },
      orderBy: {
        startsAt: 'asc'
      }
    }),
    prisma.event.count({ where })
  ]);

  return { events, total };
}

/**
 * Find event by ID
 */
async function findEventById(eventId) {
  return await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizers: {
        include: {
          user: true
        }
      },
      rsvps: {
        where: { status: 'yes' },
        include: {
          user: true
        }
      },
      awards: true,
      createdBy: true
    }
  });
}

/**
 * Update event
 * @param {number} eventId - The event ID
 * @param {object} data - The update data
 * @param {number} [calculatedPointsPool] - Pre-calculated pointsPool (if updating points)
 */
async function updateEvent(eventId, data, calculatedPointsPool) {
  const updateData = {};

  if (data.name !== undefined && data.name !== null) updateData.name = data.name;
  if (data.description !== undefined && data.description !== null) updateData.description = data.description;
  if (data.location !== undefined && data.location !== null) updateData.location = data.location;
  if (data.startTime !== undefined && data.startTime !== null) updateData.startsAt = new Date(data.startTime);
  if (data.endTime !== undefined && data.endTime !== null) updateData.endsAt = new Date(data.endTime);
  if (data.capacity !== undefined && data.capacity !== null) updateData.capacity = data.capacity;
  
  // Use pre-calculated pointsPool if provided (calculated in service layer after validation)
  if (calculatedPointsPool !== undefined) {
    updateData.pointsPool = calculatedPointsPool;
  }
  
  if (data.published !== undefined && data.published !== null) updateData.published = data.published;

  return await prisma.event.update({
    where: { id: eventId },
    data: updateData,
    include: {
      organizers: {
        include: {
          user: true
        }
      },
      rsvps: {
        where: { status: 'yes' }
      },
      awards: true
    }
  });
}

/**
 * Delete event
 */
async function deleteEvent(eventId) {
  // Delete in a transaction to handle foreign key constraints
  return await prisma.$transaction(async (tx) => {
    // Delete related awards first (they reference transactions too)
    const awards = await tx.eventAward.findMany({
      where: { eventId },
      include: { transactions: true }
    });
    
    // Delete transactions and reverse points
    for (const award of awards) {
      if (award.transactions && award.transactions.length > 0) {
        for (const transaction of award.transactions) {
          // Delete ledger entries for this transaction
          await tx.ledgerEntry.deleteMany({
            where: { transactionId: transaction.id }
          });
          
          // Reverse the points in the loyalty account
          if (transaction.pointsPosted && transaction.pointsPosted > 0) {
            await tx.loyaltyAccount.update({
              where: { id: transaction.accountId },
              data: {
                pointsCached: {
                  decrement: transaction.pointsPosted
                }
              }
            });
          }
        }
        // Delete transactions
        await tx.transaction.deleteMany({
          where: { eventAwardId: award.id }
        });
      }
    }
    
    // Delete awards
    await tx.eventAward.deleteMany({
      where: { eventId }
    });
    
    // Delete RSVPs
    await tx.eventRSVP.deleteMany({
      where: { eventId }
    });
    
    // Delete organizers
    await tx.eventOrganizer.deleteMany({
      where: { eventId }
    });
    
    // Finally delete the event
    return await tx.event.delete({
      where: { id: eventId }
    });
  });
}

/**
 * Add organizer to event
 */
async function addOrganizer(eventId, userId) {
  return await prisma.eventOrganizer.create({
    data: {
      eventId,
      userId
    }
  });
}

/**
 * Remove organizer from event
 */
async function removeOrganizer(eventId, userId) {
  return await prisma.eventOrganizer.delete({
    where: {
      eventId_userId: {
        eventId,
        userId
      }
    }
  });
}

/**
 * Check if user is organizer
 */
async function isOrganizer(eventId, userId) {
  const organizer = await prisma.eventOrganizer.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId
      }
    }
  });
  return !!organizer;
}

/**
 * Add guest to event
 */
async function addGuest(eventId, userId) {
  return await prisma.eventRSVP.create({
    data: {
      eventId,
      userId,
      status: 'yes',
      attendance: 'confirmed'
    }
  });
}

/**
 * Remove guest from event
 */
async function removeGuest(eventId, userId) {
  return await prisma.$transaction(async (tx) => {
    // Find the RSVP
    const rsvp = await tx.eventRSVP.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      },
      include: {
        awards: {
          include: {
            transactions: true
          }
        }
      }
    });

    if (!rsvp) {
      throw new Error('RSVP not found');
    }

    // If there are awards, we need to delete them and reverse the points
    if (rsvp.awards && rsvp.awards.length > 0) {
      for (const award of rsvp.awards) {
        // Delete transactions and reverse points
        if (award.transactions && award.transactions.length > 0) {
          for (const transaction of award.transactions) {
            // Delete ledger entries
            await tx.ledgerEntry.deleteMany({
              where: { transactionId: transaction.id }
            });

            // Reverse points in loyalty account
            if (transaction.pointsPosted && transaction.pointsPosted > 0) {
              await tx.loyaltyAccount.update({
                where: { id: transaction.accountId },
                data: {
                  pointsCached: {
                    decrement: transaction.pointsPosted
                  }
                }
              });

              // Return points to event pool
              await tx.event.update({
                where: { id: eventId },
                data: {
                  pointsPool: {
                    increment: transaction.pointsPosted
                  }
                }
              });
            }
          }

          // Delete transactions
          await tx.transaction.deleteMany({
            where: { eventAwardId: award.id }
          });
        }

        // Delete the award
        await tx.eventAward.delete({
          where: { id: award.id }
        });
      }
    }

    // Finally delete the RSVP
    return await tx.eventRSVP.delete({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      }
    });
  });
}

/**
 * Check if user is guest
 */
async function isGuest(eventId, userId) {
  const rsvp = await prisma.eventRSVP.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId
      }
    }
  });
  return rsvp && rsvp.status === 'yes';
}

/**
 * Get confirmed guests count
 */
async function getGuestsCount(eventId) {
  return await prisma.eventRSVP.count({
    where: {
      eventId,
      status: 'yes'
    }
  });
}

/**
 * Award points to guest(s)
 */
async function awardPoints(eventId, userId, points, awardedBy, remark) {
  return await prisma.$transaction(async (tx) => {
    // Get RSVP
    const rsvp = await tx.eventRSVP.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      },
      include: {
        user: {
          include: {
            account: true
          }
        }
      }
    });

    if (!rsvp || !rsvp.user.account) {
      throw new Error('User is not a guest or has no account');
    }

    // Create event award
    const award = await tx.eventAward.create({
      data: {
        eventId,
        rsvpId: rsvp.id,
        accountId: rsvp.user.account.id,
        points,
        awardedById: awardedBy
      }
    });

    // Create transaction
    const transaction = await tx.transaction.create({
      data: {
        type: 'event',
        status: 'posted',
        accountId: rsvp.user.account.id,
        createdByUserId: awardedBy,
        eventAwardId: award.id,
        pointsCalculated: points,
        pointsPosted: points,
        notes: remark || null
      }
    });

    // Update points
    await tx.loyaltyAccount.update({
      where: { id: rsvp.user.account.id },
      data: {
        pointsCached: {
          increment: points
        }
      }
    });

    // Create ledger entry
    await tx.ledgerEntry.create({
      data: {
        accountId: rsvp.user.account.id,
        transactionId: transaction.id,
        kind: 'earn_event',
        pointsDelta: points,
        postedByUserId: awardedBy,
        note: remark || null
      }
    });

    // Update event points pool
    await tx.event.update({
      where: { id: eventId },
      data: {
        pointsPool: {
          decrement: points
        }
      }
    });

    return transaction;
  });
}

/**
 * Get points awarded and remaining for event
 */
async function getEventPointsInfo(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      awards: true
    }
  });

  if (!event) return null;

  // Safely calculate pointsAwarded, handling null/undefined awards
  const pointsAwarded = (event.awards && Array.isArray(event.awards))
    ? event.awards.reduce((sum, award) => sum + (award.points || 0), 0)
    : 0;
  
  // Ensure pointsRemain is always a number (pointsPool should never be null per schema, but be defensive)
  const pointsRemain = (event.pointsPool !== null && event.pointsPool !== undefined)
    ? event.pointsPool
    : 0;

  return {
    pointsAwarded,
    pointsRemain
  };
}

/**
 * Find events where user is an organizer
 */
async function findEventsByOrganizer(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where: {
        organizers: {
          some: {
            userId: userId
          }
        }
      },
      skip,
      take: limit,
      include: {
        organizers: {
          include: {
            user: true
          }
        },
        rsvps: {
          where: { status: 'yes' },
          include: {
            user: true
          }
        },
        awards: true
      },
      orderBy: {
        startsAt: 'asc'
      }
    }),
    prisma.event.count({
      where: {
        organizers: {
          some: {
            userId: userId
          }
        }
      }
    })
  ]);

  return { events, total };
}

module.exports = {
  createEvent,
  findEventsWithFilters,
  findEventById,
  findEventsByOrganizer,
  updateEvent,
  deleteEvent,
  addOrganizer,
  removeOrganizer,
  isOrganizer,
  addGuest,
  removeGuest,
  isGuest,
  getGuestsCount,
  awardPoints,
  getEventPointsInfo
};

