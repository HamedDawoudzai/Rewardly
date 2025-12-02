/**
 * Complete Database Seed Script
 * 
 * This script populates the database with test data for grading/demo purposes.
 * 
 * Creates:
 * - 12 users (1 superuser, 2 managers, 2 cashiers, 7 regular users)
 * - 35+ transactions (purchases, redemptions, adjustments, events, transfers)
 * - 7 events (published, drafts, past, upcoming)
 * - 6 promotions (automatic and one-time)
 * 
 * Usage:
 *   node prisma/seed-all.js
 * 
 * To reset and re-seed:
 *   npx prisma migrate reset --force && node prisma/seed-all.js
 * 
 * Pre-requisites:
 *   - Run `npx prisma migrate dev` first to ensure schema is up to date
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// ============================================================================
// SIMPLE CREDENTIALS FOR EASY TESTING
// ============================================================================
const DEFAULT_PASSWORD = 'pass';  // Simple password for all test accounts

// ============================================================================
// USER DEFINITIONS
// ============================================================================
const USERS = [
  // Superuser
  { username: 'admin', email: 'admin@test.com', name: 'Admin User', role: 'superuser', points: 0 },
  
  // Managers
  { username: 'manager1', email: 'manager1@test.com', name: 'Alice Manager', role: 'manager', points: 500 },
  { username: 'manager2', email: 'manager2@test.com', name: 'Bob Manager', role: 'manager', points: 300 },
  
  // Cashiers
  { username: 'cashier1', email: 'cashier1@test.com', name: 'Carol Cashier', role: 'cashier', points: 200 },
  { username: 'cashier2', email: 'cashier2@test.com', name: 'Dave Cashier', role: 'cashier', points: 150 },
  
  // Regular users with varying point balances
  { username: 'user1', email: 'user1@test.com', name: 'Emma Wilson', role: 'regular', points: 5000 },
  { username: 'user2', email: 'user2@test.com', name: 'Frank Chen', role: 'regular', points: 3500 },
  { username: 'user3', email: 'user3@test.com', name: 'Grace Kim', role: 'regular', points: 2000 },
  { username: 'user4', email: 'user4@test.com', name: 'Henry Davis', role: 'regular', points: 1500 },
  { username: 'user5', email: 'user5@test.com', name: 'Ivy Johnson', role: 'regular', points: 800 },
  { username: 'user6', email: 'user6@test.com', name: 'Jack Smith', role: 'regular', points: 250 },
  { username: 'user7', email: 'user7@test.com', name: 'Kate Brown', role: 'regular', points: 100 },
];

// ============================================================================
// EVENT DEFINITIONS
// ============================================================================
const EVENTS = [
  {
    name: 'Spring Orientation Mixer',
    description: 'Welcome new students and meet fellow members! Free food, networking, and icebreaker games.',
    location: 'Student Union Building, Room 200',
    daysFromNow: 7,
    durationHours: 3,
    capacity: 100,
    pointsPool: 5000,
    published: true
  },
  {
    name: 'Tech Career Workshop',
    description: 'Learn resume building, interview tips, and networking strategies from industry professionals.',
    location: 'Engineering Building, Lecture Hall A',
    daysFromNow: 14,
    durationHours: 4,
    capacity: 50,
    pointsPool: 3000,
    published: true
  },
  {
    name: 'Annual Gala Night',
    description: 'Our biggest event of the year! Formal dinner, awards ceremony, and live entertainment.',
    location: 'Grand Ballroom, Downtown Hotel',
    daysFromNow: 30,
    durationHours: 5,
    capacity: 200,
    pointsPool: 10000,
    published: true
  },
  {
    name: 'Study Session: Finals Prep',
    description: 'Group study session with tutors available. Snacks provided!',
    location: 'Library, Room 305',
    daysFromNow: 3,
    durationHours: 4,
    capacity: 30,
    pointsPool: 1500,
    published: true
  },
  {
    name: 'Movie Night: Blockbuster Marathon',
    description: 'Join us for a fun movie marathon with popcorn and prizes!',
    location: 'Media Center, Theater Room',
    daysFromNow: 10,
    durationHours: 6,
    capacity: 40,
    pointsPool: 2000,
    published: true
  },
  {
    name: 'Hackathon 2025',
    description: '24-hour coding competition with amazing prizes. Teams of 2-4.',
    location: 'Innovation Hub',
    daysFromNow: 21,
    durationHours: 24,
    capacity: 80,
    pointsPool: 8000,
    published: true
  },
  {
    name: 'Draft: Summer BBQ Planning',
    description: 'Planning meeting for summer BBQ event (internal only)',
    location: 'TBD',
    daysFromNow: 45,
    durationHours: 2,
    capacity: 150,
    pointsPool: 6000,
    published: false  // Draft event
  }
];

// ============================================================================
// PROMOTION DEFINITIONS  
// ============================================================================
const PROMOTIONS = [
  {
    name: 'Welcome Bonus',
    description: 'New member bonus! Get extra points on your first purchase.',
    kind: 'onetime',
    status: 'active',
    minSpendCents: 1000,  // $10 minimum
    pointsBonus: 500,
    offerCode: 'WELCOME500',
    daysUntilStart: -30,
    daysUntilEnd: 60
  },
  {
    name: 'Double Points Tuesday',
    description: 'Earn 2x points on all purchases every Tuesday!',
    kind: 'automatic',
    status: 'active',
    pointsPerCentMultiplier: 2.0,
    daysUntilStart: -7,
    daysUntilEnd: 90
  },
  {
    name: 'Big Spender Bonus',
    description: 'Spend $50 or more and get 200 bonus points.',
    kind: 'automatic',
    status: 'active',
    minSpendCents: 5000,
    pointsBonus: 200,
    daysUntilStart: -14,
    daysUntilEnd: 30
  },
  {
    name: 'Flash Sale: Triple Points',
    description: 'Limited time only! 3x points on all purchases.',
    kind: 'automatic',
    status: 'active',
    pointsPerCentMultiplier: 3.0,
    daysUntilStart: 0,
    daysUntilEnd: 3
  },
  {
    name: 'Loyalty Reward Code',
    description: 'Exclusive code for loyal members. 1000 bonus points!',
    kind: 'onetime',
    status: 'active',
    pointsBonus: 1000,
    offerCode: 'LOYAL1000',
    daysUntilStart: -10,
    daysUntilEnd: 45
  },
  {
    name: 'Holiday Special',
    description: 'Holiday season special - 50% more points on purchases!',
    kind: 'automatic',
    status: 'inactive',
    pointsPerCentMultiplier: 1.5,
    daysUntilStart: 20,
    daysUntilEnd: 40
  }
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           REWARDLY DATABASE SEED SCRIPT                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Step 1: Ensure roles exist
  await ensureRolesExist();

  // Step 2: Create users
  const users = await createUsers();

  // Step 3: Create promotions
  const promotions = await createPromotions(users.manager1);

  // Step 4: Create events
  const events = await createEvents(users.manager1);

  // Step 5: Add event organizers and RSVPs
  await setupEventParticipants(events, users);

  // Step 6: Create transactions (including event awards)
  await createTransactions(users, events, promotions);

  // Step 7: Print summary
  printSummary(users, events, promotions);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function addDays(date, days, hours = 0) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(result.getHours() + hours);
  return result;
}

async function ensureRolesExist() {
  console.log('🔧 Setting up roles...');
  
  const roles = [
    { name: 'regular', description: 'Regular user with basic privileges' },
    { name: 'cashier', description: 'Cashier - can create purchase transactions and process redemptions' },
    { name: 'manager', description: 'Manager - can manage transactions, events, promotions, and users' },
    { name: 'superuser', description: 'Superuser - full system access' }
  ];
  
  for (const roleData of roles) {
    const existing = await prisma.role.findUnique({ where: { name: roleData.name } });
    if (!existing) {
      await prisma.role.create({ data: roleData });
      console.log(`   ✓ Created role: ${roleData.name}`);
    } else {
      console.log(`   ⏭ Role exists: ${roleData.name}`);
    }
  }
  console.log('');
}

async function createUsers() {
  console.log('👥 Creating users...');
  
  const createdUsers = {};
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  
  for (const userData of USERS) {
    const existing = await prisma.user.findUnique({ where: { username: userData.username } });
    
    if (existing) {
      console.log(`   ⏭ User exists: ${userData.username}`);
      createdUsers[userData.username] = existing;
      continue;
    }

    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        name: userData.name,
        passwordHash,
        isActivated: true,
        isStudentVerified: true,
        birthday: addDays(new Date('1998-01-01'), Math.floor(Math.random() * 2000)),
        account: {
          create: {
            pointsCached: userData.points
          }
        }
      }
    });

    // Assign role
    const role = await prisma.role.findUnique({ where: { name: userData.role } });
    if (role) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: role.id }
      });
    }

    console.log(`   ✓ Created: ${userData.username.padEnd(10)} (${userData.role.padEnd(9)}) - ${userData.points} pts`);
    createdUsers[userData.username] = user;
  }
  
  console.log('');
  return createdUsers;
}

async function createPromotions(manager) {
  console.log('🎁 Creating promotions...');
  
  const createdPromotions = [];
  
  for (const promoData of PROMOTIONS) {
    const existing = await prisma.promotion.findFirst({ where: { name: promoData.name } });
    
    if (existing) {
      console.log(`   ⏭ Promotion exists: ${promoData.name}`);
      createdPromotions.push(existing);
      continue;
    }

    const promo = await prisma.promotion.create({
      data: {
        name: promoData.name,
        description: promoData.description,
        kind: promoData.kind,
        status: promoData.status,
        minSpendCents: promoData.minSpendCents || null,
        pointsPerCentMultiplier: promoData.pointsPerCentMultiplier || null,
        pointsBonus: promoData.pointsBonus || null,
        offerCode: promoData.offerCode || null,
        startsAt: addDays(new Date(), promoData.daysUntilStart),
        endsAt: addDays(new Date(), promoData.daysUntilEnd),
        createdById: manager.id
      }
    });

    console.log(`   ✓ Created: ${promoData.name} (${promoData.kind})`);
    createdPromotions.push(promo);
  }
  
  console.log('');
  return createdPromotions;
}

async function createEvents(manager) {
  console.log('📅 Creating events...');
  
  const createdEvents = [];
  
  for (const eventData of EVENTS) {
    const existing = await prisma.event.findFirst({ where: { name: eventData.name } });
    
    if (existing) {
      console.log(`   ⏭ Event exists: ${eventData.name}`);
      createdEvents.push(existing);
      continue;
    }

    const event = await prisma.event.create({
      data: {
        name: eventData.name,
        description: eventData.description,
        location: eventData.location,
        startsAt: addDays(new Date(), eventData.daysFromNow),
        endsAt: addDays(new Date(), eventData.daysFromNow, eventData.durationHours),
        capacity: eventData.capacity,
        pointsPool: eventData.pointsPool,
        published: eventData.published,
        createdById: manager.id
      }
    });

    const statusIcon = eventData.published ? '📢' : '📝';
    console.log(`   ✓ Created: ${statusIcon} ${eventData.name.substring(0, 35).padEnd(35)}`);
    createdEvents.push(event);
  }
  
  console.log('');
  return createdEvents;
}

async function setupEventParticipants(events, users) {
  console.log('🎫 Setting up event organizers and RSVPs...');
  
  // Add organizers
  const organizerAssignments = [
    { event: events[0], organizer: users.manager1 },
    { event: events[0], organizer: users.manager2 },
    { event: events[1], organizer: users.manager1 },
    { event: events[2], organizer: users.manager1 },
    { event: events[2], organizer: users.manager2 },
    { event: events[3], organizer: users.cashier1 },
    { event: events[4], organizer: users.user1 },
    { event: events[5], organizer: users.manager1 },
  ];

  for (const { event, organizer } of organizerAssignments) {
    if (!event || !organizer) continue;
    const exists = await prisma.eventOrganizer.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: organizer.id } }
    });
    if (!exists) {
      await prisma.eventOrganizer.create({
        data: { eventId: event.id, userId: organizer.id }
      });
    }
  }
  console.log('   ✓ Organizers assigned');

  // Add RSVPs - spread across events for pagination testing
  const rsvpAssignments = [
    // Event 0: Spring Orientation - many RSVPs
    { event: events[0], user: users.user1, status: 'yes' },
    { event: events[0], user: users.user2, status: 'yes' },
    { event: events[0], user: users.user3, status: 'yes' },
    { event: events[0], user: users.user4, status: 'yes' },
    { event: events[0], user: users.user5, status: 'no' },
    { event: events[0], user: users.user6, status: 'yes' },
    
    // Event 1: Tech Workshop
    { event: events[1], user: users.user1, status: 'yes' },
    { event: events[1], user: users.user2, status: 'yes' },
    { event: events[1], user: users.user3, status: 'yes' },
    
    // Event 2: Gala Night
    { event: events[2], user: users.user1, status: 'yes' },
    { event: events[2], user: users.user2, status: 'yes' },
    { event: events[2], user: users.user3, status: 'yes' },
    { event: events[2], user: users.user4, status: 'yes' },
    { event: events[2], user: users.user5, status: 'yes' },
    { event: events[2], user: users.user6, status: 'yes' },
    { event: events[2], user: users.user7, status: 'yes' },
    
    // Event 3: Study Session
    { event: events[3], user: users.user2, status: 'yes' },
    { event: events[3], user: users.user4, status: 'yes' },
    { event: events[3], user: users.user7, status: 'yes' },
    
    // Event 4: Movie Night
    { event: events[4], user: users.user1, status: 'yes' },
    { event: events[4], user: users.user3, status: 'yes' },
    { event: events[4], user: users.user5, status: 'yes' },
    { event: events[4], user: users.user6, status: 'yes' },
    
    // Event 5: Hackathon
    { event: events[5], user: users.user1, status: 'yes' },
    { event: events[5], user: users.user2, status: 'yes' },
  ];

  let rsvpCount = 0;
  for (const { event, user, status } of rsvpAssignments) {
    if (!event || !user) continue;
    const exists = await prisma.eventRSVP.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: user.id } }
    });
    if (!exists) {
      await prisma.eventRSVP.create({
        data: { eventId: event.id, userId: user.id, status }
      });
      rsvpCount++;
    }
  }
  console.log(`   ✓ ${rsvpCount} RSVPs created`);
  console.log('');
}

async function createTransactions(users, events, promotions) {
  console.log('💰 Creating transactions...');
  
  const cashier1 = users.cashier1;
  const cashier2 = users.cashier2;
  const manager1 = users.manager1;
  
  let purchaseCount = 0;
  let redemptionCount = 0;
  let adjustmentCount = 0;
  let transferCount = 0;
  let eventCount = 0;

  // Helper to get account
  const getAccount = async (user) => {
    return prisma.loyaltyAccount.findUnique({ where: { userId: user.id } });
  };

  // =========================================================================
  // PURCHASE TRANSACTIONS (15+)
  // =========================================================================
  const purchases = [
    { user: users.user1, cashier: cashier1, amount: 25.99, points: 104 },
    { user: users.user1, cashier: cashier1, amount: 42.50, points: 170 },
    { user: users.user1, cashier: cashier2, amount: 15.00, points: 60 },
    { user: users.user2, cashier: cashier1, amount: 89.99, points: 360 },
    { user: users.user2, cashier: cashier2, amount: 33.25, points: 133 },
    { user: users.user3, cashier: cashier1, amount: 67.80, points: 271 },
    { user: users.user3, cashier: cashier2, amount: 12.99, points: 52 },
    { user: users.user4, cashier: cashier1, amount: 55.00, points: 220 },
    { user: users.user4, cashier: cashier2, amount: 28.75, points: 115 },
    { user: users.user5, cashier: cashier1, amount: 99.99, points: 400 },
    { user: users.user5, cashier: cashier2, amount: 19.50, points: 78 },
    { user: users.user6, cashier: cashier1, amount: 45.00, points: 180 },
    { user: users.user6, cashier: cashier2, amount: 8.99, points: 36 },
    { user: users.user7, cashier: cashier1, amount: 150.00, points: 600 },
    { user: users.user7, cashier: cashier2, amount: 22.25, points: 89 },
    { user: users.manager1, cashier: cashier1, amount: 35.50, points: 142 },
  ];

  for (const p of purchases) {
    const account = await getAccount(p.user);
    await prisma.transaction.create({
      data: {
        type: 'purchase',
        status: 'posted',
        createdByUserId: p.cashier.id,
        accountId: account.id,
        cashierId: p.cashier.id,
        totalCents: Math.round(p.amount * 100),
        pointsCalculated: p.points,
        pointsPosted: p.points,
        notes: `Purchase of $${p.amount.toFixed(2)}`
      }
    });
    purchaseCount++;
  }
  console.log(`   ✓ ${purchaseCount} purchase transactions`);

  // =========================================================================
  // REDEMPTION TRANSACTIONS (5 - mix of posted and pending)
  // =========================================================================
  const redemptions = [
    { user: users.user1, points: 500, status: 'posted' },
    { user: users.user1, points: 200, status: 'pending_verification' },
    { user: users.user2, points: 300, status: 'posted' },
    { user: users.user2, points: 150, status: 'pending_verification' },
    { user: users.user3, points: 400, status: 'pending_verification' },
  ];

  for (const r of redemptions) {
    const account = await getAccount(r.user);
    await prisma.transaction.create({
      data: {
        type: 'redemption',
        status: r.status,
        createdByUserId: r.user.id,
        accountId: account.id,
        pointsCalculated: -r.points,
        pointsPosted: r.status === 'posted' ? -r.points : null,
        notes: `Redemption request for ${r.points} points`
      }
    });
    redemptionCount++;
  }
  console.log(`   ✓ ${redemptionCount} redemption transactions (3 pending)`);

  // =========================================================================
  // ADJUSTMENT TRANSACTIONS (4)
  // =========================================================================
  const adjustments = [
    { user: users.user1, manager: manager1, points: 100, reason: 'Customer feedback bonus' },
    { user: users.user2, manager: manager1, points: -50, reason: 'Points correction - duplicate credit' },
    { user: users.user3, manager: manager1, points: 250, reason: 'Referral bonus - brought 5 friends' },
    { user: users.user5, manager: manager1, points: 75, reason: 'Compensation for service issue' },
  ];

  for (const a of adjustments) {
    const account = await getAccount(a.user);
    await prisma.transaction.create({
      data: {
        type: 'adjustment',
        status: 'posted',
        createdByUserId: a.manager.id,
        accountId: account.id,
        managerId: a.manager.id,
        pointsCalculated: a.points,
        pointsPosted: a.points,
        notes: a.reason
      }
    });
    adjustmentCount++;
  }
  console.log(`   ✓ ${adjustmentCount} adjustment transactions`);

  // =========================================================================
  // TRANSFER TRANSACTIONS (4)
  // =========================================================================
  const transfers = [
    { from: users.user1, to: users.user2, points: 100 },
    { from: users.user2, to: users.user3, points: 50 },
    { from: users.user3, to: users.user4, points: 75 },
    { from: users.user1, to: users.user6, points: 25 },
  ];

  for (const t of transfers) {
    const fromAccount = await getAccount(t.from);
    const toAccount = await getAccount(t.to);
    
    await prisma.transaction.create({
      data: {
        type: 'transfer',
        status: 'posted',
        createdByUserId: t.from.id,
        accountId: fromAccount.id,
        transferToAccountId: toAccount.id,
        pointsCalculated: -t.points,
        pointsPosted: -t.points,
        notes: `Transfer ${t.points} points to ${t.to.username}`
      }
    });
    transferCount++;
  }
  console.log(`   ✓ ${transferCount} transfer transactions`);

  // =========================================================================
  // EVENT AWARD TRANSACTIONS (6) - Using past-dated event awards
  // =========================================================================
  // Note: We'll create event awards for users who RSVP'd 
  const eventAwards = [
    { event: events[0], user: users.user1, points: 500 },
    { event: events[0], user: users.user2, points: 500 },
    { event: events[0], user: users.user3, points: 500 },
    { event: events[1], user: users.user1, points: 300 },
    { event: events[1], user: users.user2, points: 300 },
    { event: events[3], user: users.user2, points: 150 },
  ];

  for (const ea of eventAwards) {
    if (!ea.event || !ea.user) continue;
    
    const account = await getAccount(ea.user);
    const rsvp = await prisma.eventRSVP.findUnique({
      where: { eventId_userId: { eventId: ea.event.id, userId: ea.user.id } }
    });
    
    if (!rsvp) continue;

    // Create event award
    const award = await prisma.eventAward.create({
      data: {
        eventId: ea.event.id,
        rsvpId: rsvp.id,
        accountId: account.id,
        points: ea.points,
        awardedById: manager1.id
      }
    });

    // Create corresponding transaction
    await prisma.transaction.create({
      data: {
        type: 'event',
        status: 'posted',
        createdByUserId: manager1.id,
        accountId: account.id,
        eventAwardId: award.id,
        pointsCalculated: ea.points,
        pointsPosted: ea.points,
        notes: `Event award: ${ea.event.name}`
      }
    });
    eventCount++;
  }
  console.log(`   ✓ ${eventCount} event award transactions`);

  const total = purchaseCount + redemptionCount + adjustmentCount + transferCount + eventCount;
  console.log(`   ═══════════════════════════════`);
  console.log(`   📊 Total: ${total} transactions`);
  console.log('');

  // Mark one user as suspicious for testing
  await prisma.user.update({
    where: { id: users.user7.id },
    data: { isSuspicious: true }
  });
  console.log('⚠️  Marked user7 (Kate Brown) as suspicious for testing\n');
}

function printSummary(users, events, promotions) {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    ✅ SEED COMPLETED!                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ 🔑 LOGIN CREDENTIALS (Password for ALL accounts: pass)        │');
  console.log('├────────────────────────────────────────────────────────────────┤');
  console.log('│ Role        │ Username   │ Email                │ Points      │');
  console.log('├─────────────┼────────────┼──────────────────────┼─────────────┤');
  console.log('│ SUPERUSER   │ admin      │ admin@test.com       │ 0           │');
  console.log('│ MANAGER     │ manager1   │ manager1@test.com    │ 500         │');
  console.log('│ MANAGER     │ manager2   │ manager2@test.com    │ 300         │');
  console.log('│ CASHIER     │ cashier1   │ cashier1@test.com    │ 200         │');
  console.log('│ CASHIER     │ cashier2   │ cashier2@test.com    │ 150         │');
  console.log('│ REGULAR     │ user1      │ user1@test.com       │ 5000        │');
  console.log('│ REGULAR     │ user2      │ user2@test.com       │ 3500        │');
  console.log('│ REGULAR     │ user3      │ user3@test.com       │ 2000        │');
  console.log('│ REGULAR     │ user4      │ user4@test.com       │ 1500        │');
  console.log('│ REGULAR     │ user5      │ user5@test.com       │ 800         │');
  console.log('│ REGULAR     │ user6      │ user6@test.com       │ 250         │');
  console.log('│ REGULAR     │ user7*     │ user7@test.com       │ 100         │');
  console.log('└─────────────┴────────────┴──────────────────────┴─────────────┘');
  console.log('  * user7 is marked as suspicious for testing');
  console.log('');
  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ 📊 DATA SUMMARY                                               │');
  console.log('├────────────────────────────────────────────────────────────────┤');
  console.log('│ • 12 Users (1 superuser, 2 managers, 2 cashiers, 7 regular)   │');
  console.log('│ • 35 Transactions (16 purchases, 5 redemptions, 4 adjustments,│');
  console.log('│                    4 transfers, 6 event awards)               │');
  console.log('│ • 7 Events (6 published, 1 draft)                             │');
  console.log('│ • 6 Promotions (3 automatic, 2 one-time codes, 1 inactive)    │');
  console.log('│ • 26 Event RSVPs across all events                            │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ 🧪 TESTING SCENARIOS                                          │');
  console.log('├────────────────────────────────────────────────────────────────┤');
  console.log('│ 1. Login as user1 → Browse events, RSVP, view points          │');
  console.log('│ 2. Login as cashier1 → Create purchase, process redemptions   │');
  console.log('│ 3. Login as manager1 → View all transactions, manage events   │');
  console.log('│ 4. Login as admin → Full access, role management              │');
  console.log('│ 5. Test pagination on Users, Events, Transactions pages       │');
  console.log('│ 6. 3 pending redemptions available for cashier to process     │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ 🎁 PROMO CODES TO TEST                                        │');
  console.log('├────────────────────────────────────────────────────────────────┤');
  console.log('│ • WELCOME500 - 500 bonus points (one-time, $10 min spend)     │');
  console.log('│ • LOYAL1000  - 1000 bonus points (one-time, no minimum)       │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log('');
}

// ============================================================================
// RUN SCRIPT
// ============================================================================
main()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

