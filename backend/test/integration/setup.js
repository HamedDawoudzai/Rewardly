'use strict';

/**
 * Setup file for integration tests
 * Creates Express app instance for testing
 */

const express = require('express');

// Create app instance for testing
const app = express();
app.use(express.json());

// Import routes
const userRoutes = require('../../src/routes/userRoutes');
const authRoutes = require('../../src/routes/authRoutes');
const transactionRoutes = require('../../src/routes/transactionRoutes');
const eventRoutes = require('../../src/routes/eventRoutes');
const promotionRoutes = require('../../src/routes/promotionRoutes');

// Mount routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/transactions', transactionRoutes);
app.use('/events', eventRoutes);
app.use('/promotions', promotionRoutes);

module.exports = app;

