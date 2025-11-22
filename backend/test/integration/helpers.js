'use strict';

/**
 * Helper functions for integration tests
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const authService = require('../../src/services/authService');

const prisma = new PrismaClient();

/**
 * Create a user for testing
 */
async function createUser(utorid, email, password = 'password', role = 'regular') {
  const SALT_ROUNDS = 10;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Get role
  let roleRecord = await prisma.role.findUnique({
    where: { name: role }
  });

  if (!roleRecord) {
    roleRecord = await prisma.role.create({
      data: {
        name: role,
        description: `${role} role`
      }
    });
  }

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
    // Update password if user exists
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash, isActivated: true }
    });
    return existingUser;
  }

  // Create the user
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: utorid,
        email: email,
        passwordHash: passwordHash,
        name: utorid,
        isActivated: true,
        isStudentVerified: false,
        isSuspicious: false,
        tokenVersion: 0
      }
    });

    const account = await tx.loyaltyAccount.create({
      data: {
        userId: user.id,
        pointsCached: 0
      }
    });

    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: roleRecord.id
      }
    });

    return { user, account };
  });

  return result.user;
}

/**
 * Create a superuser for testing
 */
async function createSuperuser(utorid = 'superuser', email = 'superuser@mail.utoronto.ca', password = 'password') {
  const SALT_ROUNDS = 10;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Ensure superuser role exists
  let superuserRole = await prisma.role.findUnique({
    where: { name: 'superuser' }
  });

  if (!superuserRole) {
    superuserRole = await prisma.role.create({
      data: {
        name: 'superuser',
        description: 'Full database access and all privileges'
      }
    });
  }

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
    // Update password if user exists
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash }
    });
    return existingUser;
  }

  // Create the superuser
  const result = await prisma.$transaction(async (tx) => {
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

    const account = await tx.loyaltyAccount.create({
      data: {
        userId: user.id,
        pointsCached: 0
      }
    });

    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: superuserRole.id
      }
    });

    return { user, account };
  });

  return result.user;
}

/**
 * Clean up database (optional - use with caution)
 */
async function cleanupDatabase() {
  // This is optional - tests should generally clean up after themselves
  // or use transactions
}

module.exports = {
  createSuperuser,
  createUser,
  cleanupDatabase,
  prisma
};

