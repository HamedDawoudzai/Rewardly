#!/usr/bin/env node
'use strict';

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { bootstrap } = require('./src/utils/bootstrap');
const app = express();

// Security headers (XSS protection, clickjacking prevention, etc.)
app.use(helmet());

// Rate limiting - general API limit (100 requests per 15 min per IP)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(generalLimiter);

// Strict rate limit for auth endpoints (prevent brute force attacks)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per 15 min
    message: { error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

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

// Mount routes (apply auth limiter to auth routes)
app.use('/users', userRoutes);
app.use('/auth', authLimiter, authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/events', eventRoutes);
app.use('/promotions', promotionRoutes);
app.use('/export', exportRoutes);
app.use('/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Bootstrap database and start server
(async () => {
    try {
        // Initialize database with roles, permissions, and hierarchy
        await bootstrap();
        
        // Start server after successful bootstrap
        const server = app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log('Security: Helmet.js enabled, Rate limiting active');
        });

        server.on('error', (err) => {
            console.error(`cannot start server: ${err.message}`);
            process.exit(1);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
})();
