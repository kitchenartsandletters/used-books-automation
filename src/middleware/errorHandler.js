// src/middleware/errorHandler.js
const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`Error: ${err.message}`);
  logger.error(err.stack);
  
  // Set status code
  const statusCode = err.statusCode || 500;
  
  // If API request, return JSON error
  if (req.path.startsWith('/api')) {
    return res.status(statusCode).json({
      error: true,
      message: process.env.NODE_ENV === 'production' ? 
        'An error occurred' : 
        err.message,
      stack: process.env.NODE_ENV === 'production' ? 
        undefined : 
        err.stack
    });
  }
  
  // For web pages, render error template
  res.status(statusCode).render('error', {
    title: 'Error',
    message: process.env.NODE_ENV === 'production' ? 
      'An error occurred' : 
      err.message,
    error: {
      status: statusCode,
      stack: process.env.NODE_ENV === 'production' ? 
        undefined : 
        err.stack
    },
    user: req.user
  });
};

module.exports = errorHandler;