/**
 * Analytics Test Data Seed Script
 * 
 * This script generates purchase transactions spread over multiple weeks/months
 * to properly test the spending analytics and forecasting features.
 * 
 * Usage:
 *   node prisma/seed-analytics.js
 * 
 * Pre-requisites:
 *   - Run the main seed script first: node prisma/seed-all.js
 *   - Backend server does NOT need to be running
 * 
 * What it creates:
 *   - 100+ purchase transactions spread over 12 weeks
 *   - Realistic spending patterns with some variance
 *   - Uses existing users from seed-all.js
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Spending patterns - simulate realistic business cycles
const WEEKLY_BASE_SPENDING = [
  1500,  // Week 1 - baseline
  1650,  // Week 2 - slight increase
  1400,  // Week 3 - dip
  1800,  // Week 4 - month end spike
  1550,  // Week 5 - new month
  1700,  // Week 6 - growth
  1600,  // Week 7 - stable
  1900,  // Week 8 - month end
  1750,  // Week 9 - new month
  1850,  // Week 10 - growth trend
  2000,  // Week 11 - peak
  2100,  // Week 12 - continued growth
];

// Sample purchase amounts that look realistic
const PURCHASE_AMOUNTS = [
  8.99, 12.50, 15.99, 19.99, 22.50, 25.00, 29.99, 35.00, 
  42.50, 45.99, 55.00, 65.00, 75.00, 89.99, 99.99, 125.00
];

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         ANALYTICS TEST DATA SEED SCRIPT                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Get existing users
  const users = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: 'regular'
          }
        }
      }
    },
    include: {
      account: true
    },
    take: 10
  });

  if (users.length === 0) {
    console.log('❌ No regular users found. Please run seed-all.js first.');
    process.exit(1);
  }

  // Get a cashier to create transactions
  const cashier = await prisma.user.findFirst({
    where: {
      roles: {
        some: {
          role: {
            name: 'cashier'
          }
        }
      }
    }
  });

  if (!cashier) {
    console.log('❌ No cashier found. Please run seed-all.js first.');
    process.exit(1);
  }

  console.log(`📦 Found ${users.length} regular users and cashier: ${cashier.username}`);
  console.log('');
  console.log('🔄 Generating purchase transactions over 12 weeks...');
  console.log('');

  const now = new Date();
  let totalTransactions = 0;
  let totalSpending = 0;

  // Generate transactions for each week
  for (let week = 0; week < WEEKLY_BASE_SPENDING.length; week++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - ((WEEKLY_BASE_SPENDING.length - week) * 7));
    
    const targetSpending = WEEKLY_BASE_SPENDING[week];
    let weekSpending = 0;
    let weekTransactions = 0;

    // Generate random transactions until we hit ~target spending
    while (weekSpending < targetSpending) {
      // Pick random user and amount
      const user = users[Math.floor(Math.random() * users.length)];
      const baseAmount = PURCHASE_AMOUNTS[Math.floor(Math.random() * PURCHASE_AMOUNTS.length)];
      
      // Add some variance (+/- 20%)
      const variance = 0.8 + (Math.random() * 0.4);
      const amount = Math.round(baseAmount * variance * 100) / 100;
      const amountCents = Math.round(amount * 100);
      
      // Calculate points (4 points per dollar)
      const points = Math.round(amount * 4);

      // Random day within the week
      const transactionDate = new Date(weekStart);
      transactionDate.setDate(transactionDate.getDate() + Math.floor(Math.random() * 7));
      transactionDate.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

      // Create the transaction
      await prisma.transaction.create({
        data: {
          type: 'purchase',
          status: 'posted',
          createdByUserId: cashier.id,
          accountId: user.account.id,
          cashierId: cashier.id,
          totalCents: amountCents,
          pointsCalculated: points,
          pointsPosted: points,
          createdAt: transactionDate,
          notes: `Purchase of $${amount.toFixed(2)}`
        }
      });

      weekSpending += amount;
      weekTransactions++;
      totalTransactions++;
      totalSpending += amount;
    }

    const weekLabel = `Week ${week + 1}`;
    const dateRange = `${weekStart.toLocaleDateString()} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}`;
    console.log(`   ✓ ${weekLabel.padEnd(8)} | ${dateRange.padEnd(25)} | ${weekTransactions} transactions | $${weekSpending.toFixed(2)}`);
  }

  // Summary
  console.log('');
  console.log('═'.repeat(60));
  console.log('');
  console.log('✅ Analytics test data seeded successfully!');
  console.log('');
  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ 📊 SUMMARY                                                     │');
  console.log('├────────────────────────────────────────────────────────────────┤');
  console.log(`│ Total Transactions Created: ${String(totalTransactions).padStart(4)}                            │`);
  console.log(`│ Total Spending Generated:   $${totalSpending.toFixed(2).padStart(10)}                      │`);
  console.log(`│ Time Period:                12 weeks                           │`);
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ 🧪 TEST THE ANALYTICS PAGE                                     │');
  console.log('├────────────────────────────────────────────────────────────────┤');
  console.log('│ 1. Start backend:  cd backend && node index.js 3000            │');
  console.log('│ 2. Start frontend: cd frontend && npm run dev                  │');
  console.log('│ 3. Login as manager1 (password: pass)                          │');
  console.log('│ 4. Go to Role View → Manager → Analytics                       │');
  console.log('│ 5. Try Daily, Weekly, Monthly views                            │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log('');
}

main()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

