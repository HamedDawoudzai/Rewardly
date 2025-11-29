/*
 * Script to create a regular user for testing
 * Usage: node prisma/createuser.js <utorid> <email> <password> [points]
 * Example: node prisma/createuser.js testuser test@mail.utoronto.ca Password123! 1000
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createUser() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node prisma/createuser.js <utorid> <email> <password> [points]');
    console.error('Example: node prisma/createuser.js testuser test@mail.utoronto.ca Password123! 1000');
    process.exit(1);
  }

  const [utorid, email, password, pointsArg] = args;
  const points = parseInt(pointsArg) || 0;

  // Validate inputs
  if (!utorid || !email || !password) {
    console.error('Error: utorid, email, and password are required');
    process.exit(1);
  }

  if (!email.includes('@')) {
    console.error('Error: Invalid email format');
    process.exit(1);
  }

  try {
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

    // Ensure regular role exists
    let regularRole = await prisma.role.findUnique({
      where: { name: 'regular' }
    });

    if (!regularRole) {
      console.log('Creating regular role...');
      regularRole = await prisma.role.create({
        data: {
          name: 'regular',
          description: 'Regular user with basic privileges'
        }
      });
    }

    // Create the user in a transaction
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

      // Create loyalty account for the user with initial points
      const account = await tx.loyaltyAccount.create({
        data: {
          userId: user.id,
          pointsCached: points
        }
      });

      // Assign regular role
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: regularRole.id
        }
      });

      return { user, account };
    });

    console.log('\nRegular user created successfully!');
    console.log('================================');
    console.log(`  Username: ${result.user.username}`);
    console.log(`  Email: ${result.user.email}`);
    console.log(`  User ID: ${result.user.id}`);
    console.log(`  Points: ${result.account.pointsCached}`);
    console.log(`  Activated: ${result.user.isActivated}`);
    console.log(`  Role: regular`);
    console.log('================================\n');

  } catch (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();

