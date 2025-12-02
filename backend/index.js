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
const { bootstrap } = require('./src/utils/bootstrap');
const app = express();

// Enable CORS for frontend
app.use(cors({
    origin: 'http://localhost:5173', // Vite dev server
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

// Mount routes
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
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