'use strict';

/**
 * Middleware to validate request body is not empty
 * This should run before authentication to return 400 instead of 401
 */
function validateBodyNotEmpty(req, res, next) {
  // Only check for POST/PATCH/PUT methods
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    // Check if body is empty or undefined
    // When send({}) is called, req.body is {} which has length 0
    // We need to check this before authentication runs
    const body = req.body;
    
    if (body === undefined || body === null) {
      return res.status(400).json({ error: 'Request body is required' });
    }
    
    // Check if it's an empty object (not array, not null)
    if (typeof body === 'object' && !Array.isArray(body) && Object.keys(body).length === 0) {
      return res.status(400).json({ error: 'Request body is required' });
    }
  }
  next();
}

module.exports = {
  validateBodyNotEmpty
};

