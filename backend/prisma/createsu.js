/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example: 
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createSuperuser() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length !== 3) {
    console.error('Usage: node prisma/createsu.js <utorid> <email> <password>');
    process.exit(1);
  }

  const [utorid, email, password] = args;

  // Validate inputs
  if (!utorid || !email || !password) {
    console.error('Error: All arguments (utorid, email, password) are required');
    process.exit(1);
  }

  // Basic email validation
  if (!email.includes('@')) {
    console.error('Error: Invalid email format');
    process.exit(1);
  }

  try {
    // Hash the password
    const SALT_ROUNDS = 10;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: utorid }
        ]
      }
    });

    if (existingUser) {
      console.error('Error: A user with this email or username already exists');
      process.exit(1);
    }

    // Ensure superuser role exists
    let superuserRole = await prisma.role.findUnique({
      where: { name: 'superuser' }
    });

    if (!superuserRole) {
      console.log('Creating superuser role...');
      superuserRole = await prisma.role.create({
        data: {
          name: 'superuser',
          description: 'Full database access and all privileges'
        }
      });
    }

    // Create the superuser in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          username: utorid,
          email: email,
          passwordHash: passwordHash,
          name: utorid,
          isActivated: true,
          isStudentVerified: true,
          isSuspicious: false,
          tokenVersion: 0
        }
      });

      // Create loyalty account for the user
      const account = await tx.loyaltyAccount.create({
        data: {
          userId: user.id,
          pointsCached: 0
        }
      });

      // Assign superuser role
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: superuserRole.id
        }
      });

      return { user, account };
    });

    console.log('Superuser created successfully!');
    console.log(`  Username: ${result.user.username}`);
    console.log(`  Email: ${result.user.email}`);
    console.log(`  User ID: ${result.user.id}`);
    console.log(`  Account ID: ${result.account.id}`);
    console.log(`  Activated: ${result.user.isActivated}`);
    console.log(`  Verified: ${result.user.isStudentVerified}`);

  } catch (error) {
    console.error('Error creating superuser:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperuser();