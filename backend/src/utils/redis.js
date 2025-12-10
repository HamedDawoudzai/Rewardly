'use strict';

const { createClient } = require('redis');

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection
 * @returns {Promise<RedisClient|null>}
 */
async function initRedis() {
  if (redisClient && isConnected) return redisClient;

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('⚠️ Redis: Max reconnection attempts reached, running without cache');
            return false; // Stop reconnecting
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      if (isConnected) {
        console.error('Redis Client Error:', err.message);
      }
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      isConnected = true;
    });

    redisClient.on('end', () => {
      console.log('🔌 Redis disconnected');
      isConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.warn('⚠️ Redis connection failed:', err.message);
    console.warn('   App will continue without caching');
    redisClient = null;
    isConnected = false;
    return null;
  }
}

/**
 * Get Redis client instance
 * @returns {RedisClient|null}
 */
function getRedisClient() {
  return isConnected ? redisClient : null;
}

/**
 * Check if Redis is available
 * @returns {boolean}
 */
function isRedisAvailable() {
  return isConnected && redisClient !== null;
}

/**
 * Get cached value by key
 * @param {string} key - Cache key
 * @returns {Promise<any|null>}
 */
async function cacheGet(key) {
  if (!isConnected || !redisClient) return null;
  
  try {
    const data = await redisClient.get(key);
    if (data) {
      console.log(`📦 Cache HIT: ${key}`);
      return JSON.parse(data);
    }
    console.log(`📭 Cache MISS: ${key}`);
    return null;
  } catch (err) {
    console.error('Redis GET error:', err.message);
    return null;
  }
}

/**
 * Set cached value with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
 */
async function cacheSet(key, value, ttlSeconds = 300) {
  if (!isConnected || !redisClient) return;
  
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    console.log(`💾 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (err) {
    console.error('Redis SET error:', err.message);
  }
}

/**
 * Delete cached value by key
 * @param {string} key - Cache key
 */
async function cacheDelete(key) {
  if (!isConnected || !redisClient) return;
  
  try {
    await redisClient.del(key);
    console.log(`🗑️ Cache DEL: ${key}`);
  } catch (err) {
    console.error('Redis DEL error:', err.message);
  }
}

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., 'analytics:*')
 */
async function cacheDeletePattern(pattern) {
  if (!isConnected || !redisClient) return;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️ Cache DEL pattern: ${pattern} (${keys.length} keys)`);
    }
  } catch (err) {
    console.error('Redis DEL pattern error:', err.message);
  }
}

/**
 * Close Redis connection gracefully
 */
async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('🔌 Redis connection closed');
    } catch (err) {
      console.error('Redis close error:', err.message);
    }
    redisClient = null;
    isConnected = false;
  }
}

module.exports = {
  initRedis,
  getRedisClient,
  isRedisAvailable,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  closeRedis
};

