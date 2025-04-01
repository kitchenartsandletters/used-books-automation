// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../../config/environment');
const logger = require('../utils/logger');

/**
 * Authentication middleware to protect dashboard routes
 * Verifies JWT token in cookies and adds user data to request
 */
const authMiddleware = (req, res, next) => {
  // Check for token in cookie
  const token = req.cookies && req.cookies.token;
  
  if (!token) {
    logger.info('Access attempt without token, redirecting to login');
    return res.redirect('/auth/login');
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    
    // Add user data to request
    req.user = decoded;
    
    // Continue to next middleware
    next();
  } catch (error) {
    logger.warn(`Invalid token: ${error.message}`);
    
    // Clear invalid token
    res.clearCookie('token');
    
    // Add flash message if available
    if (req.flash) {
      req.flash('error', 'Your session has expired. Please log in again.');
    }
    
    // Redirect to login
    return res.redirect('/auth/login');
  }
};

/**
 * Check if user has admin role
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn(`Unauthorized access attempt: ${req.user ? req.user.username : 'unknown'}`);
    
    // Add flash message if available
    if (req.flash) {
      req.flash('error', 'You do not have permission to access this page.');
    }
    
    return res.redirect('/dashboard');
  }
  
  next();
};

module.exports = {
  authMiddleware,
  isAdmin
};