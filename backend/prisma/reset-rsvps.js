/**
 * Quick script to reset testuser1 RSVPs for testing
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Resetting RSVPs for testing...\n');

  // Get testuser1
  const testuser1 = await prisma.user.findUnique({ where: { username: 'testuser1' } });
  if (!testuser1) {
    console.log('testuser1 not found');
    return;
  }

  // Remove testuser1's RSVPs from events 1 and 2 (so they can test RSVP)
  const deleted = await prisma.eventRSVP.deleteMany({
    where: {
      userId: testuser1.id,
      eventId: { in: [1, 2] }
    }
  });

  console.log(`Deleted ${deleted.count} RSVPs for testuser1 on events 1 and 2`);
  console.log('\n✅ testuser1 can now RSVP to events 1 and 2 for testing');
}

main()
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

