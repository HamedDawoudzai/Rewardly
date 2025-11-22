'use strict';

// Global test setup
// This file runs before each test file

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

// Clean up after tests
afterAll(async () => {
  // Close any open database connections
  // Add cleanup logic if needed
});

