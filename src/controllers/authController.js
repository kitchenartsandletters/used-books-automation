// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../../config/environment');
const logger = require('../utils/logger');

const adminPassword = 'admin123';
bcrypt.hash(adminPassword, 10).then(hash => {
  console.log('Use this hash for admin user:', hash);
});
const staffPassword = 'staff123';
bcrypt.hash(staffPassword, 10).then(hash => {
  console.log('Use this hash for staff user:', hash);
});

// Hard-coded users for simplicity
// In a production environment, this would be replaced with a database
const users = [
  {
    id: 1,
    username: 'admin',
    // Default password: admin123 (would be properly hashed in production)
    passwordHash: adminPassword,
    role: 'admin',
    name: 'Admin User'
  },
  {
    id: 2,
    username: 'staff',
    // Default password: staff123 (would be properly hashed in production)
    passwordHash: staffPassword,
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
  res.render('login', {
    title: 'Login - Used Books Automation',
    error: req.flash ? req.flash('error') : null,
    success: req.flash ? req.flash('success') : null
  });
};

/**
 * Process login form submission
 */
const processLogin = async (req, res) => {
  console.log('Login attempt received:', { username: req.body.username });
  
  const { username, password } = req.body;
  
  // Validate input
  if (!username || !password) {
    console.log('Login failed: Missing username or password');
    if (req.flash) {
      req.flash('error', 'Username and password are required');
    }
    return res.redirect('/auth/login');
  }
  
  try {
    // Find user
    const user = users.find(u => u.username === username);
    
    if (!user) {
      console.log(`Login failed: User not found - '${username}'`);
      if (req.flash) {
        req.flash('error', 'Invalid username or password');
      }
      return res.redirect('/auth/login');
    }
    
    console.log(`User found: ${username}, attempting password verification`);
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      console.log(`Login failed: Password mismatch for user '${username}'`);
      if (req.flash) {
        req.flash('error', 'Invalid username or password');
      }
      return res.redirect('/auth/login');
    }
    
    console.log(`Password verified for user: ${username}, creating JWT token`);
    
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
    
    console.log('JWT token created, setting cookie');
    
    // Set cookie with token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    console.log(`Successful login: ${username}, redirecting to dashboard`);
    
    // Redirect to dashboard
    return res.redirect('/dashboard');
  } catch (error) {
    console.error(`Login error: ${error.message}`, error);
    if (req.flash) {
      req.flash('error', 'An error occurred during login');
    }
    return res.redirect('/auth/login');
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