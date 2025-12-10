#!/usr/bin/env node
'use strict';

// Load environment variables from .env file
require('dotenv').config();

const port = (() => {
    // Use PORT env var (Railway/production), command line arg, or default to 3000
    if (process.env.PORT) {
        return parseInt(process.env.PORT, 10);
    }
    
    const args = process.argv;
    if (args.length >= 3) {
        const num = parseInt(args[2], 10);
        if (!isNaN(num)) {
            return num;
        }
    }
    
    return 3000; // Default port for local development
})();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { bootstrap } = require('./src/utils/bootstrap');
const { initRedis, getRedisClient, isRedisAvailable } = require('./src/utils/redis');
const app = express();

// Express: Trust first proxy (Railway) for correct client IP detection
app.set('trust proxy', 1);

// Security headers (XSS protection, clickjacking prevention, etc.)
app.use(helmet());

/**
 * Create Redis store for rate limiting with unique prefix
 * Falls back to in-memory if Redis unavailable
 */
function createRedisRateLimitStore(prefix) {
    const client = getRedisClient();
    if (!client || !isRedisAvailable()) {
        return undefined; // Will use default MemoryStore
    }

    // Custom Redis store for express-rate-limit with unique prefix
    return {
        prefix: prefix,
        init: async () => {},
        increment: async (key) => {
            const prefixedKey = `${prefix}:${key}`;
            const results = await client.multi()
                .incr(prefixedKey)
                .pTTL(prefixedKey)
                .exec();
            
            const totalHits = results[0];
            const timeToExpire = results[1];
            
            // Set expiry if this is a new key
            if (timeToExpire < 0) {
                await client.expire(prefixedKey, 15 * 60); // 15 minutes
            }
            
            return {
                totalHits,
                resetTime: timeToExpire > 0 
                    ? new Date(Date.now() + timeToExpire)
                    : new Date(Date.now() + 15 * 60 * 1000)
            };
        },
        decrement: async (key) => {
            await client.decr(`${prefix}:${key}`);
        },
        resetKey: async (key) => {
            await client.del(`${prefix}:${key}`);
        },
        get: async (key) => {
            const prefixedKey = `${prefix}:${key}`;
            const result = await client.get(prefixedKey);
            if (!result) return undefined;
            
            const ttl = await client.pTTL(prefixedKey);
            return {
                totalHits: parseInt(result, 10),
                resetTime: ttl > 0 ? new Date(Date.now() + ttl) : undefined
            };
        }
    };
}

// Rate limiting - general API limit (10,000 requests per 15 min per IP)
const createGeneralLimiter = () => {
    const store = createRedisRateLimitStore('rl:general');
    if (!store) {
        console.log('⚠️ General rate limiting: Using in-memory store');
    }
    return rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10000,
        message: { error: 'Too many requests, please try again later' },
        standardHeaders: true,
        legacyHeaders: false,
        store: store,
        validate: { xForwardedForHeader: false }
    });
};

// Rate limit for auth endpoints (prevent brute force attacks)
const createAuthLimiter = () => {
    const store = createRedisRateLimitStore('rl:auth');
    if (!store) {
        console.log('⚠️ Auth rate limiting: Using in-memory store');
    }
    return rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500,
        message: { error: 'Too many login attempts, please try again later' },
        standardHeaders: true,
        legacyHeaders: false,
        store: store,
        validate: { xForwardedForHeader: false }
    });
};

// Enable CORS for frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite dev server
    credentials: true
}));

app.use(express.json());

// Import routes
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const promotionRoutes = require('./src/routes/promotionRoutes');
const exportRoutes = require('./src/routes/exportRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

// Health check endpoint (always available)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        redis: isRedisAvailable() ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Bootstrap database and start server
(async () => {
    try {
        // 1. Initialize Redis (optional - app works without it)
        try {
            await initRedis();
            console.log('✅ Redis rate limiting enabled');
        } catch (redisErr) {
            console.warn('⚠️ Redis not available:', redisErr.message);
            console.warn('   Using in-memory rate limiting and no caching');
        }

        // 2. Set up rate limiters (after Redis init so they can use Redis store)
        const generalLimiter = createGeneralLimiter();
        const authLimiter = createAuthLimiter();
        app.use(generalLimiter);

        // 3. Mount routes (apply auth limiter to auth routes)
        app.use('/users', userRoutes);
        app.use('/auth', authLimiter, authRoutes);
        app.use('/transactions', transactionRoutes);
        app.use('/events', eventRoutes);
        app.use('/promotions', promotionRoutes);
        app.use('/export', exportRoutes);
        app.use('/analytics', analyticsRoutes);

        // 4. Initialize database with roles, permissions, and hierarchy
        await bootstrap();
        
        // 5. Start server after successful bootstrap
        const server = app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log('Security: Helmet.js enabled, Rate limiting active');
            if (isRedisAvailable()) {
                console.log('Caching: Redis enabled for analytics & rate limiting');
            }
        });

        server.on('error', (err) => {
            console.error(`cannot start server: ${err.message}`);
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received, shutting down gracefully...');
            const { closeRedis } = require('./src/utils/redis');
            await closeRedis();
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
})();
