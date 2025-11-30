/**
 * Seed script for testing Events functionality
 * 
 * This script creates:
 * - Test events (published and draft)
 * - Event organizers
 * - Event RSVPs/guests
 * 
 * Usage:
 *   node prisma/seed-events.js
 * 
 * Pre-requisites:
 *   - Run `npx prisma migrate dev` first to ensure schema is up to date
 *   - Run seed-transactions.js first to create test users
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Test123!';

async function main() {
  console.log('🌱 Starting events test data seed...\n');

  // Ensure we have test users
  const regularUser = await ensureUser('testuser1', 'testuser1@mail.utoronto.ca', 'Test User One', 'regular');
  const regularUser2 = await ensureUser('testuser2', 'testuser2@mail.utoronto.ca', 'Test User Two', 'regular');
  const manager = await ensureUser('testmanager', 'testmanager@mail.utoronto.ca', 'Test Manager', 'manager');
  
  // Create an organizer user
  const organizer = await ensureUser('testorganizer', 'testorganizer@mail.utoronto.ca', 'Test Organizer', 'regular');

  // Create events
  console.log('\n📅 Creating sample events...');

  // Event 1: Upcoming published event
  const event1 = await createEvent({
    name: 'Tech Workshop: React Basics',
    description: 'Learn the fundamentals of React.js in this hands-on workshop. We will cover components, state management, hooks, and best practices.',
    location: 'Room BA1234, Bahen Centre',
    startsAt: addDays(new Date(), 7),
    endsAt: addDays(new Date(), 7, 3),
    capacity: 50,
    pointsPool: 5000,
    published: true,
    createdById: manager.id
  });

  // Event 2: Upcoming published event (full capacity soon)
  const event2 = await createEvent({
    name: 'Holiday Party',
    description: 'Celebrate the holiday season with fellow students! Food, games, and prizes.',
    location: 'Great Hall',
    startsAt: addDays(new Date(), 14),
    endsAt: addDays(new Date(), 14, 4),
    capacity: 20,
    pointsPool: 2000,
    published: true,
    createdById: manager.id
  });

  // Event 3: Past event
  const event3 = await createEvent({
    name: 'Career Fair',
    description: 'Meet top employers and explore career opportunities.',
    location: 'Student Center',
    startsAt: addDays(new Date(), -7),
    endsAt: addDays(new Date(), -7, 6),
    capacity: null,
    pointsPool: 8000,
    published: true,
    createdById: manager.id
  });

  // Event 4: Draft event (not published)
  const event4 = await createEvent({
    name: 'Draft Event: Study Session',
    description: 'This is an unpublished draft event for testing.',
    location: 'TBD',
    startsAt: addDays(new Date(), 30),
    endsAt: addDays(new Date(), 30, 2),
    capacity: 30,
    pointsPool: 1500,
    published: false,
    createdById: manager.id
  });

  // Add organizers
  console.log('\n👤 Adding event organizers...');
  await addOrganizer(event1.id, organizer.id);
  await addOrganizer(event1.id, manager.id);
  await addOrganizer(event2.id, organizer.id);

  // Add RSVPs/guests
  // NOTE: testuser1 is NOT RSVP'd to event1 or event2 so they can test RSVP functionality
  // testuser2 is RSVP'd to some events to show the "RSVP'd" badge for comparison
  console.log('\n✉️ Adding event RSVPs...');
  await addRsvp(event1.id, regularUser2.id);  // testuser2 is RSVP'd to event 1
  await addRsvp(event1.id, organizer.id);
  // testuser1 is NOT RSVP'd to event1 - they can RSVP to test
  // testuser1 is NOT RSVP'd to event2 - they can RSVP to test
  await addRsvp(event3.id, regularUser.id);   // testuser1 is RSVP'd to past event 3
  await addRsvp(event3.id, regularUser2.id);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Events seed completed successfully!');
  console.log('='.repeat(60));
  console.log('\n📋 Test Credentials (password for all: ' + DEFAULT_PASSWORD + ')');
  console.log('─'.repeat(60));
  console.log(`Regular User:  testuser1     (can browse events, RSVP)`);
  console.log(`Regular User:  testuser2     (can browse events, RSVP)`);
  console.log(`Organizer:     testorganizer (organizer for events 1 & 2)`);
  console.log(`Manager:       testmanager   (can create/manage all events)`);
  console.log('─'.repeat(60));
  console.log('\n🧪 Test Scenarios:');
  console.log(`1. Regular User: Login as testuser1 → /events → Browse & RSVP`);
  console.log(`2. Organizer: Login as testorganizer → /organizer/events → Award points`);
  console.log(`3. Manager: Login as testmanager → /manager/events → Create/edit/delete`);
  console.log('\n📅 Created Events:');
  console.log(`   ID ${event1.id}: "${event1.name}" (published, upcoming, 2 guests - testuser1 can RSVP)`);
  console.log(`   ID ${event2.id}: "${event2.name}" (published, upcoming, 0 guests - testuser1 can RSVP)`);
  console.log(`   ID ${event3.id}: "${event3.name}" (published, past, 2 guests - testuser1 already RSVP'd)`);
  console.log(`   ID ${event4.id}: "${event4.name}" (draft - only visible to manager)`);
  console.log('\n');
}

// Helper function to add days to a date
function addDays(date, days, hours = 0) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(result.getHours() + hours);
  return result;
}

async function ensureUser(username, email, name, roleName) {
  let user = await prisma.user.findUnique({ where: { username } });
  
  if (!user) {
    console.log(`👤 Creating user: ${username} (${roleName})`);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    
    user = await prisma.user.create({
      data: {
        username,
        email,
        name,
        passwordHash,
        isActivated: true,
        isStudentVerified: true,
        account: {
          create: {
            pointsCached: 1000
          }
        }
      }
    });

    // Assign role
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (role) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id
        }
      });
    }
    
    console.log(`   ✓ Created user: ${username} (ID: ${user.id})`);
  } else {
    console.log(`   ⏭ User ${username} already exists (ID: ${user.id})`);
  }
  
  return user;
}

async function createEvent(data) {
  // Check if event with this name already exists
  const existing = await prisma.event.findFirst({
    where: { name: data.name }
  });
  
  if (existing) {
    console.log(`   ⏭ Event "${data.name}" already exists (ID: ${existing.id})`);
    return existing;
  }

  const event = await prisma.event.create({
    data: {
      name: data.name,
      description: data.description,
      location: data.location,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      capacity: data.capacity,
      pointsPool: data.pointsPool,
      published: data.published,
      createdById: data.createdById
    }
  });

  console.log(`   ✓ Created event: "${event.name}" (ID: ${event.id})`);
  return event;
}

async function addOrganizer(eventId, userId) {
  const existing = await prisma.eventOrganizer.findUnique({
    where: {
      eventId_userId: { eventId, userId }
    }
  });

  if (!existing) {
    await prisma.eventOrganizer.create({
      data: { eventId, userId }
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log(`   ✓ Added organizer: ${user.username} to event ${eventId}`);
  }
}

async function addRsvp(eventId, userId) {
  const existing = await prisma.eventRSVP.findUnique({
    where: {
      eventId_userId: { eventId, userId }
    }
  });

  if (!existing) {
    await prisma.eventRSVP.create({
      data: {
        eventId,
        userId,
        status: 'yes'
      }
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log(`   ✓ Added RSVP: ${user.username} to event ${eventId}`);
  }
}

main()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

