'use strict';

/**
 * Analytics Service
 * Provides spending trend analysis using linear regression
 */

const { PrismaClient } = require('@prisma/client');
const ss = require('simple-statistics');

const prisma = new PrismaClient();

/**
 * Get spending trends using linear regression
 * @param {string} period - 'daily', 'weekly', or 'monthly'
 * @param {number} lookback - Number of periods to analyze (defaults to ~3 months)
 */
async function getSpendingTrends(period = 'weekly', lookback = null) {
  // Default lookback to ~3 months based on period type
  if (lookback === null) {
    if (period === 'daily') {
      lookback = 90;  // 90 days = ~3 months
    } else if (period === 'weekly') {
      lookback = 12;  // 12 weeks = ~3 months
    } else {
      lookback = 3;   // 3 months
    }
  }

  // 1. Calculate the date range ending at current date
  const now = new Date();
  const startDate = getStartDate(period, lookback);
  
  const transactions = await prisma.transaction.findMany({
    where: {
      type: 'purchase',
      status: 'posted',
      createdAt: { 
        gte: startDate,
        lte: now
      }
    },
    select: {
      totalCents: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  });

  // 2. Aggregate by period with proper date labels
  const aggregated = aggregateByPeriod(transactions, period, startDate, now);
  
  // 3. If not enough data, return early with basic stats
  if (aggregated.length < 3) {
    const total = aggregated.reduce((sum, d) => sum + d.spending, 0);
    return {
      summary: {
        totalSpending: Math.round(total * 100) / 100,
        averagePerPeriod: aggregated.length > 0 ? Math.round((total / aggregated.length) * 100) / 100 : 0,
        transactionCount: transactions.length,
        trend: { 
          direction: 'neutral', 
          percentage: 0, 
          description: 'Not enough data for trend analysis (need at least 3 periods)' 
        }
      },
      historical: aggregated,
      regression: null,
      meta: {
        period,
        lookback,
        dataRange: {
          start: startDate.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        },
        periodsAnalyzed: aggregated.length
      }
    };
  }

  // 4. Prepare data for regression: [[x1, y1], [x2, y2], ...]
  const dataPoints = aggregated.map((d, i) => [i + 1, d.spending]);
  
  // 5. Run linear regression
  const regression = ss.linearRegression(dataPoints);
  const regressionLine = ss.linearRegressionLine(regression);
  const rSquared = ss.rSquared(dataPoints, regressionLine);

  // 6. Calculate trend
  const avgSpending = ss.mean(dataPoints.map(d => d[1]));
  const trendPercentage = avgSpending > 0 ? (regression.m / avgSpending) * 100 : 0;
  const trendDirection = regression.m > 0.01 ? 'up' : regression.m < -0.01 ? 'down' : 'neutral';

  // 7. Calculate additional statistics
  const spendingValues = dataPoints.map(d => d[1]);
  const minSpending = Math.min(...spendingValues);
  const maxSpending = Math.max(...spendingValues);
  const stdDev = ss.standardDeviation(spendingValues);

  // 8. Build response
  return {
    summary: {
      totalSpending: Math.round(aggregated.reduce((sum, d) => sum + d.spending, 0) * 100) / 100,
      averagePerPeriod: Math.round(avgSpending * 100) / 100,
      transactionCount: transactions.length,
      minSpending: Math.round(minSpending * 100) / 100,
      maxSpending: Math.round(maxSpending * 100) / 100,
      standardDeviation: Math.round(stdDev * 100) / 100,
      trend: {
        direction: trendDirection,
        percentage: Math.round(Math.abs(trendPercentage) * 10) / 10,
        description: getTrendDescription(trendDirection, trendPercentage, period),
        slopePerPeriod: Math.round(regression.m * 100) / 100
      }
    },
    historical: aggregated,
    regression: {
      slope: Math.round(regression.m * 100) / 100,
      intercept: Math.round(regression.b * 100) / 100,
      rSquared: Math.round(Math.max(0, Math.min(1, rSquared)) * 100) / 100
    },
    meta: {
      period,
      lookback,
      dataRange: {
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      },
      periodsAnalyzed: aggregated.length
    }
  };
}

/**
 * Get transaction statistics overview
 */
async function getTransactionStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get counts by type
  const typeCounts = await prisma.transaction.groupBy({
    by: ['type'],
    _count: { id: true },
    _sum: { pointsPosted: true }
  });

  // Get recent transaction count
  const recentCount = await prisma.transaction.count({
    where: {
      createdAt: { gte: thirtyDaysAgo }
    }
  });

  // Get total points in circulation
  const totalPoints = await prisma.loyaltyAccount.aggregate({
    _sum: { pointsCached: true }
  });

  // Get pending redemptions
  const pendingRedemptions = await prisma.transaction.count({
    where: {
      type: 'redemption',
      status: 'pending_verification'
    }
  });

  return {
    byType: typeCounts.map(t => ({
      type: t.type,
      count: t._count.id,
      totalPoints: t._sum.pointsPosted || 0
    })),
    recentTransactions: recentCount,
    totalPointsInCirculation: totalPoints._sum.pointsCached || 0,
    pendingRedemptions
  };
}

/**
 * Aggregate transactions by time period with proper date labels
 */
function aggregateByPeriod(transactions, period, startDate, endDate) {
  const buckets = new Map();

  // First, create buckets for all periods in the range (even if empty)
  const allPeriods = generatePeriodRange(startDate, endDate, period);
  for (const p of allPeriods) {
    buckets.set(p.key, { ...p, spending: 0 });
  }

  // Then, fill in spending data
  for (const tx of transactions) {
    const key = getPeriodKey(tx.createdAt, period);
    if (buckets.has(key)) {
      const bucket = buckets.get(key);
      bucket.spending += (tx.totalCents || 0) / 100;
    }
  }

  // Convert to array and sort by date
  return Array.from(buckets.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(item => ({
      period: item.key,
      label: item.label,
      spending: Math.round(item.spending * 100) / 100
    }));
}

/**
 * Generate all period keys and labels in a date range
 */
function generatePeriodRange(startDate, endDate, period) {
  const periods = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const key = getPeriodKey(current, period);
    const label = formatPeriodLabel(current, period);
    
    // Check if we already have this period (avoid duplicates)
    if (!periods.find(p => p.key === key)) {
      periods.push({ key, label });
    }
    
    // Move to next period
    if (period === 'daily') {
      current.setDate(current.getDate() + 1);
    } else if (period === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }
  
  return periods;
}

/**
 * Format a human-readable label for a period
 */
function formatPeriodLabel(date, period) {
  const d = new Date(date);
  
  if (period === 'daily') {
    // Format: "Dec 2"
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (period === 'weekly') {
    // Format: "Nov 25 - Dec 1"
    const weekStart = new Date(d);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  } else {
    // Format: "Nov 2024"
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

/**
 * Get the bucket key for a date based on period type
 */
function getPeriodKey(date, period) {
  const d = new Date(date);
  
  if (period === 'daily') {
    return d.toISOString().split('T')[0];
  } else if (period === 'weekly') {
    // Get Monday of the week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return monday.toISOString().split('T')[0];
  } else if (period === 'monthly') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
  
  return d.toISOString().split('T')[0];
}

/**
 * Get start date for lookback period
 */
function getStartDate(period, lookback) {
  const now = new Date();
  
  if (period === 'daily') {
    now.setDate(now.getDate() - lookback);
  } else if (period === 'weekly') {
    now.setDate(now.getDate() - (lookback * 7));
  } else if (period === 'monthly') {
    now.setMonth(now.getMonth() - lookback);
  }
  
  // Set to start of day
  now.setHours(0, 0, 0, 0);
  
  return now;
}

/**
 * Get trend description text
 */
function getTrendDescription(direction, percentage, period) {
  const periodLabel = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';
  const absPercentage = Math.abs(percentage).toFixed(1);
  
  if (direction === 'up') {
    return `Spending is increasing by ${absPercentage}% per ${periodLabel}`;
  } else if (direction === 'down') {
    return `Spending is decreasing by ${absPercentage}% per ${periodLabel}`;
  }
  return 'Spending is relatively stable';
}

module.exports = {
  getSpendingTrends,
  getTransactionStats
};
