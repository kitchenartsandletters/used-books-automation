// src/utils/sessionStore.js
const session = require('express-session');
const config = require('../../config/environment');
const logger = require('./logger');

/**
 * Create session store
 * In production, you'd want to use a more robust store like Redis or MongoDB
 * For simplicity, we're using the in-memory store here
 */
function createSessionStore() {
  // For production, you should use a persistent store
  if (process.env.NODE_ENV === 'production') {
    logger.warn('Using in-memory session store in production - not recommended');
    logger.warn('Consider using Redis or MongoDB for session storage');
  }
  
  // Create and configure session middleware
  const sessionMiddleware = session({
    secret: config.auth.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: config.auth.cookieMaxAge || 24 * 60 * 60 * 1000 // 24 hours
    }
  });
  
  return sessionMiddleware;
}

module.exports = createSessionStore;