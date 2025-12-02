'use strict';

/**
 * Analytics Service
 * Provides spending forecasts and trend analysis using linear regression
 */

const { PrismaClient } = require('@prisma/client');
const ss = require('simple-statistics');

const prisma = new PrismaClient();

/**
 * Get spending forecast using linear regression
 * @param {string} period - 'daily', 'weekly', or 'monthly'
 * @param {number} lookback - Number of periods to analyze
 * @param {number} predictPeriods - Number of future periods to predict
 */
async function getSpendingForecast(period = 'weekly', lookback = 12, predictPeriods = 4) {
  // 1. Fetch purchase transactions
  const startDate = getStartDate(period, lookback);
  
  const transactions = await prisma.transaction.findMany({
    where: {
      type: 'purchase',
      status: 'posted',
      createdAt: { gte: startDate }
    },
    select: {
      totalCents: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  });

  // 2. Aggregate by period
  const aggregated = aggregateByPeriod(transactions, period);
  
  // 3. If not enough data, return early with basic stats
  if (aggregated.length < 3) {
    const total = aggregated.reduce((sum, d) => sum + d.spending, 0);
    return {
      summary: {
        totalSpending: Math.round(total * 100) / 100,
        averagePerPeriod: aggregated.length > 0 ? Math.round((total / aggregated.length) * 100) / 100 : 0,
        trend: { 
          direction: 'neutral', 
          percentage: 0, 
          description: 'Not enough data for trend analysis (need at least 3 periods)' 
        },
        forecast: { 
          nextPeriod: 0, 
          next4Periods: 0,
          confidence: 0 
        }
      },
      historical: aggregated,
      predictions: [],
      regression: null
    };
  }

  // 4. Prepare data for regression: [[x1, y1], [x2, y2], ...]
  const dataPoints = aggregated.map((d, i) => [i + 1, d.spending]);
  
  // 5. Run linear regression
  const regression = ss.linearRegression(dataPoints);
  const regressionLine = ss.linearRegressionLine(regression);
  const rSquared = ss.rSquared(dataPoints, regressionLine);

  // 6. Generate predictions
  const predictions = [];
  const lastIndex = dataPoints.length;
  const lastDate = new Date(aggregated[aggregated.length - 1].period);
  
  for (let i = 1; i <= predictPeriods; i++) {
    const predictedSpending = Math.max(0, regressionLine(lastIndex + i));
    const futureDate = addPeriod(lastDate, period, i);
    
    predictions.push({
      period: futureDate.toISOString().split('T')[0],
      label: `${getPeriodLabel(period)} ${lastIndex + i} (Predicted)`,
      spending: Math.round(predictedSpending * 100) / 100,
      isPrediction: true
    });
  }

  // 7. Calculate trend
  const avgSpending = ss.mean(dataPoints.map(d => d[1]));
  const trendPercentage = avgSpending > 0 ? (regression.m / avgSpending) * 100 : 0;
  const trendDirection = regression.m > 0.01 ? 'up' : regression.m < -0.01 ? 'down' : 'neutral';

  // 8. Build response
  return {
    summary: {
      totalSpending: Math.round(aggregated.reduce((sum, d) => sum + d.spending, 0) * 100) / 100,
      averagePerPeriod: Math.round(avgSpending * 100) / 100,
      trend: {
        direction: trendDirection,
        percentage: Math.round(Math.abs(trendPercentage) * 10) / 10,
        description: getTrendDescription(trendDirection, trendPercentage, period)
      },
      forecast: {
        nextPeriod: predictions[0]?.spending || 0,
        next4Periods: Math.round(predictions.reduce((sum, p) => sum + p.spending, 0) * 100) / 100,
        confidence: Math.round(Math.max(0, Math.min(1, rSquared)) * 100) / 100
      }
    },
    historical: aggregated,
    predictions,
    regression: {
      slope: Math.round(regression.m * 100) / 100,
      intercept: Math.round(regression.b * 100) / 100,
      rSquared: Math.round(Math.max(0, Math.min(1, rSquared)) * 100) / 100
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
 * Aggregate transactions by time period
 */
function aggregateByPeriod(transactions, period) {
  const buckets = new Map();

  for (const tx of transactions) {
    const key = getPeriodKey(tx.createdAt, period);
    const current = buckets.get(key) || 0;
    buckets.set(key, current + (tx.totalCents || 0) / 100);
  }

  // Convert to array and sort by date
  const sorted = Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));

  return sorted.map(([periodKey, spending], index) => ({
    period: periodKey,
    label: `${getPeriodLabel(period)} ${index + 1}`,
    spending: Math.round(spending * 100) / 100
  }));
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
  
  return now;
}

/**
 * Add periods to a date
 */
function addPeriod(date, period, count) {
  const result = new Date(date);
  
  if (period === 'daily') {
    result.setDate(result.getDate() + count);
  } else if (period === 'weekly') {
    result.setDate(result.getDate() + (count * 7));
  } else if (period === 'monthly') {
    result.setMonth(result.getMonth() + count);
  }
  
  return result;
}

/**
 * Get human-readable period label
 */
function getPeriodLabel(period) {
  return period === 'daily' ? 'Day' : period === 'weekly' ? 'Week' : 'Month';
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
  getSpendingForecast,
  getTransactionStats
};

