// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../../config/environment');
const logger = require('../utils/logger');

// Hard-coded users for simplicity
// In a production environment, this would be replaced with a database
const users = [
  {
    id: 1,
    username: 'admin',
    // Default password: admin123 (would be properly hashed in production)
    passwordHash: '$2b$10$3euPcmQFCiblsZB8sKaYAOV9UHjxNR3LOzKpYXEyNWBHvhkuLX/3e',
    role: 'admin',
    name: 'Admin User'
  },
  {
    id: 2,
    username: 'staff',
    // Default password: staff123 (would be properly hashed in production)
    passwordHash: '$2b$10$LHnUGsVCNUGXDUFBv3JLyeLlxiS5/xR.9Jl15qN.aK6p/r0UMY.Iy',
    role: 'staff',
    name: 'Staff User'
  }
];

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
  res.render('auth/login', {
    title: 'Login - Used Books Automation',
    error: req.flash ? req.flash('error') : null,
    success: req.flash ? req.flash('success') : null
  });
};

/**
 * Process login form submission
 */
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
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
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
  logout
};