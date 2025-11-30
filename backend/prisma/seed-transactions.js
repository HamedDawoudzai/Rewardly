/**
 * Seed script for testing Cashier & Manager Transactions functionality
 * 
 * This script creates:
 * - Test users (regular, cashier, manager)
 * - Sample transactions (purchases, redemptions, adjustments)
 * - A pending redemption for testing the process redemption flow
 * 
 * Usage:
 *   node prisma/seed-transactions.js
 * 
 * Pre-requisites:
 *   - Run `npx prisma migrate dev` first to ensure schema is up to date
 *   - Run bootstrap to create roles if not already created
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Test123!';

async function main() {
  console.log('🌱 Starting transaction test data seed...\n');

  // Ensure roles exist
  await ensureRolesExist();

  // Create test users
  const regularUser = await createUser('testuser1', 'testuser1@mail.utoronto.ca', 'Test User One', 'regular');
  const regularUser2 = await createUser('testuser2', 'testuser2@mail.utoronto.ca', 'Test User Two', 'regular');
  const cashier = await createUser('testcashier', 'testcashier@mail.utoronto.ca', 'Test Cashier', 'cashier');
  const manager = await createUser('testmanager', 'testmanager@mail.utoronto.ca', 'Test Manager', 'manager');

  // Add some initial points to users for testing
  await prisma.loyaltyAccount.update({
    where: { userId: regularUser.id },
    data: { pointsCached: 5000 }
  });
  
  await prisma.loyaltyAccount.update({
    where: { userId: regularUser2.id },
    data: { pointsCached: 2500 }
  });

  // Create sample transactions
  console.log('\n📝 Creating sample transactions...');

  // Purchase transactions
  const purchase1 = await createPurchaseTransaction(regularUser, cashier, 25.50, 102);
  const purchase2 = await createPurchaseTransaction(regularUser, cashier, 15.00, 60);
  const purchase3 = await createPurchaseTransaction(regularUser2, cashier, 100.00, 400);

  // Create multiple pending redemptions (for testing process redemption)
  const pendingRedemption1 = await createRedemptionTransaction(regularUser, 500, 'pending_verification');
  const pendingRedemption2 = await createRedemptionTransaction(regularUser, 200, 'pending_verification');
  const pendingRedemption3 = await createRedemptionTransaction(regularUser2, 300, 'pending_verification');
  
  console.log(`\n   📌 PENDING REDEMPTIONS TO TEST:`);
  console.log(`      ID ${pendingRedemption1.id}: testuser1 wants to redeem 500 pts`);
  console.log(`      ID ${pendingRedemption2.id}: testuser1 wants to redeem 200 pts`);
  console.log(`      ID ${pendingRedemption3.id}: testuser2 wants to redeem 300 pts`);

  // Create a processed redemption
  const processedRedemption = await createRedemptionTransaction(regularUser2, 100, 'posted');

  // Create adjustment transaction
  const adjustment = await createAdjustmentTransaction(regularUser, manager, 100, 'Bonus points for customer feedback');

  // Create a suspicious transaction
  const suspiciousPurchase = await createPurchaseTransaction(regularUser2, cashier, 500.00, 2000);
  await prisma.user.update({
    where: { id: regularUser2.id },
    data: { isSuspicious: true }
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Seed completed successfully!');
  console.log('='.repeat(60));
  console.log('\n📋 Test Credentials (password for all: ' + DEFAULT_PASSWORD + ')');
  console.log('─'.repeat(60));
  console.log(`Regular User:  testuser1    (has 5000 points, pending redemptions)`);
  console.log(`Regular User:  testuser2    (has 2500 points, marked suspicious)`);
  console.log(`Cashier:       testcashier  (can create purchases, process redemptions)`);
  console.log(`Manager:       testmanager  (can view all transactions, toggle suspicious)`);
  console.log('─'.repeat(60));
  console.log('\n🧪 Test Scenarios:');
  console.log(`1. Login as cashier → Create Transaction → Enter "testuser1" and amount`);
  console.log(`2. Login as cashier → Process Redemption → Enter ID: ${pendingRedemption1.id}, ${pendingRedemption2.id}, or ${pendingRedemption3.id}`);
  console.log(`3. Login as manager → All Transactions → View, filter, toggle suspicious`);
  console.log('\n');
}

async function ensureRolesExist() {
  console.log('🔧 Ensuring roles exist...');
  
  const roles = ['regular', 'cashier', 'manager', 'superuser'];
  
  for (const roleName of roles) {
    const existing = await prisma.role.findUnique({ where: { name: roleName } });
    if (!existing) {
      await prisma.role.create({
        data: {
          name: roleName,
          description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`
        }
      });
      console.log(`   ✓ Created role: ${roleName}`);
    }
  }
}

async function createUser(username, email, name, roleName) {
  console.log(`👤 Creating user: ${username} (${roleName})`);
  
  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`   ⏭ User ${username} already exists, skipping...`);
    return existing;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      name,
      passwordHash,
      isActivated: true,
      isStudentVerified: true,
      account: {
        create: {
          pointsCached: 0
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
  return user;
}

async function createPurchaseTransaction(user, cashier, spent, points) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { userId: user.id }
  });

  const transaction = await prisma.transaction.create({
    data: {
      type: 'purchase',
      status: 'posted',
      createdByUserId: cashier.id,
      accountId: account.id,
      cashierId: cashier.id,
      totalCents: Math.round(spent * 100),
      pointsCalculated: points,
      pointsPosted: points,
      notes: `Purchase of $${spent.toFixed(2)}`
    }
  });

  console.log(`   ✓ Created purchase transaction (ID: ${transaction.id}): $${spent.toFixed(2)} → ${points} pts`);
  return transaction;
}

async function createRedemptionTransaction(user, points, status) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { userId: user.id }
  });

  const transaction = await prisma.transaction.create({
    data: {
      type: 'redemption',
      status: status,
      createdByUserId: user.id,
      accountId: account.id,
      pointsCalculated: -points,
      pointsPosted: status === 'posted' ? -points : null,
      notes: `Redemption request for ${points} points`
    }
  });

  console.log(`   ✓ Created ${status} redemption (ID: ${transaction.id}): ${points} pts`);
  return transaction;
}

async function createAdjustmentTransaction(user, manager, points, remark) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { userId: user.id }
  });

  const transaction = await prisma.transaction.create({
    data: {
      type: 'adjustment',
      status: 'posted',
      createdByUserId: manager.id,
      accountId: account.id,
      managerId: manager.id,
      pointsCalculated: points,
      pointsPosted: points,
      notes: remark
    }
  });

  console.log(`   ✓ Created adjustment transaction (ID: ${transaction.id}): ${points} pts`);
  return transaction;
}

main()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

