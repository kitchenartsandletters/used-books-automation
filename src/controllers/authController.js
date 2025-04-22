// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../../config/environment');
const logger = require('../utils/logger');

/**
 * Generate a password hash using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const generatePasswordHash = async (password) => {
  try {
    // Use a salt round of 10 (industry standard)
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    logger.error(`Error generating password hash: ${error.message}`);
    throw error;
  }
};

// For development/testing - utility to hash passwords
const generateTestUserHashes = async () => {
  if (process.env.NODE_ENV === 'production') {
    logger.warn('Attempted to generate test user hashes in production');
    return;
  }
  
  try {
    const admin = await generatePasswordHash('admin123');
    const staff = await generatePasswordHash('staff123');
    
    logger.info('Test user password hashes generated:');
    logger.info(`Admin: ${admin}`);
    logger.info(`Staff: ${staff}`);
    
    return { admin, staff };
  } catch (error) {
    logger.error(`Error generating test hashes: ${error.message}`);
  }
};

// First, define the users array with pre-computed hashes
const users = [
  {
    id: 1,
    username: 'admin',
    // Pre-computed hash for 'admin123'
    passwordHash: '$2b$10$UyGEc33GuByrd7skVHkR2u4eJks7cyJJ70MY8J06naiN8d9JPPs5y',
    role: 'admin',
    name: 'Admin User'
  },
  {
    id: 2,
    username: 'staff',
    // Pre-computed hash for 'staff123'
    passwordHash: '$2b$10$SBUelNvfjYaqQwrd8x20Pe36sjb1X4doTaln6VGI9egdrpUjWFBOW',
    role: 'staff',
    name: 'Staff User'
  }
];

// You can generate new hashes with code like this:
// (Keep this for development, but remove or comment out for production)
/*
const bcrypt = require('bcrypt');
const adminPassword = 'admin123';
bcrypt.hash(adminPassword, 10).then(hash => {
  console.log('Use this hash for admin user:', hash);
});
const staffPassword = 'staff123';
bcrypt.hash(staffPassword, 10).then(hash => {
  console.log('Use this hash for staff user:', hash);
});
*/

/**
 * Render login page
 */
const getLoginPage = (req, res) => {
  // If user is already logged in, redirect to dashboard
  if (req.cookies && req.cookies.token) {
    try {
      jwt.verify(req.cookies.token, config.auth.jwtSecret);
      return res.redirect('/dashboard');
    } catch (error) {
      // Invalid token, clear it
      res.clearCookie('token');
    }
  }
  
  // Render login page
  res.render('login', {
    title: 'Login - hurt Books Automation',
    error: req.flash ? req.flash('error') : null,
    success: req.flash ? req.flash('success') : null
  });
};

/**
 * Process login form submission
 */
// Fix for authController.js

const processLogin = async (req, res) => {
  const { username, password } = req.body;
  
  // Validate input
  if (!username || !password) {
    if (req.flash) {
      req.flash('error', 'Username and password are required');
    }
    return res.redirect('/auth/login');
  }
  
  try {
    // Find user
    const user = users.find(u => u.username === username);
    
    if (!user) {
      logger.warn(`Login attempt with invalid username: ${username}`);
      if (req.flash) {
        req.flash('error', 'Invalid username or password');
      }
      return res.redirect('/auth/login');
    }
    
    // Verify password
    // First check if we're dealing with a testing environment with hardcoded passwords
    let passwordMatch = false;
    
    // Use proper bcrypt compare for production
    try {
      passwordMatch = await bcrypt.compare(password, user.passwordHash);
    } catch (bcryptError) {
      logger.error(`bcrypt compare error: ${bcryptError.message}`);
      
      // Fallback to hardcoded check for development/testing only
      if (process.env.NODE_ENV !== 'production') {
        // Temporary fallback for development - REMOVE IN PRODUCTION
        passwordMatch = (
          (username === 'admin' && password === 'admin123') || 
          (username === 'staff' && password === 'staff123')
        );
        
        if (passwordMatch) {
          logger.warn('Using hardcoded password check - NOT SECURE FOR PRODUCTION');
        }
      }
    }
    
    if (!passwordMatch) {
      logger.warn(`Failed login attempt for user: ${username}`);
      if (req.flash) {
        req.flash('error', 'Invalid username or password');
      }
      return res.redirect('/auth/login');
    }
    
    // Create JWT token with user data (excluding password)
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiration || '24h' }
    );
    
    // Set cookie with token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    logger.info(`Successful login: ${username}`);
    
    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    if (req.flash) {
      req.flash('error', 'An error occurred during login');
    }
    res.redirect('/auth/login');
  }
};

/**
 * Process user logout
 */
const logout = (req, res) => {
  // Clear token cookie
  res.clearCookie('token');
  
  if (req.flash) {
    req.flash('success', 'You have been logged out successfully');
  }
  
  res.redirect('/auth/login');
};

module.exports = {
  getLoginPage,
  processLogin,
  logout,
  generatePasswordHash,
  // Only export the test function in development
  ...(process.env.NODE_ENV !== 'production' ? { generateTestUserHashes } : {})
};