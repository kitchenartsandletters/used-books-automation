// src/app.js (updated with dashboard routes)

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session'); // Add this import
const webhookController = require('./controllers/webhookController');
const apiController = require('./controllers/apiController');
const dashboardController = require('./controllers/dashboardController');
const logger = require('./utils/logger');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const createSessionStore = require('./utils/sessionStore');
const { authMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard'); 
const flashMiddleware = require('./middleware/flash');
const errorHandler = require('./middleware/errorHandler');
const config = require('../config/environment');

const app = express();
const dashboardAPIRoutes = require('./routes/dashboardAPI');

// Set up view engine (EJS) for dashboard
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware to capture raw body for webhook verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Configure cookie and session middleware
app.use(cookieParser(config.auth.cookieSecret));

// Create and use the session middleware (don't call createSessionStore again)
app.use(session({
  secret: config.auth.sessionSecret || 'secret-key-for-development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Create session store
app.use('/api/dashboard', dashboardAPIRoutes);

// Flash messages middleware
app.use(flash());
app.use(flashMiddleware);

// CORS and body parsing
app.use(cors());
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(express.json()); // For parsing JSON

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount route modules
app.use('/auth', authRoutes);
app.use('/dashboard', authMiddleware, dashboardRoutes);

// API routes
app.post('/api/check-product', apiController.triggerProductCheck);
app.post('/api/scan-all', apiController.scanAllHurtBooks);
app.get('/api/test-client', apiController.testShopifyClient);

// Webhook routes
app.post('/webhooks/inventory-levels', webhookController.handleInventoryLevelUpdate);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Root route handler - redirects to dashboard if authenticated, login if not
app.get('/', (req, res) => {
  // Check if user is authenticated
  const token = req.cookies && req.cookies.token;
  
  if (token) {
    try {
      // Verify token validity
      jwt.verify(token, config.auth.jwtSecret);
      // If valid, redirect to dashboard
      return res.redirect('/dashboard');
    } catch (error) {
      // If token is invalid, clear it
      res.clearCookie('token');
    }
  }
  
  // If no token or invalid token, redirect to login page
  res.redirect('/auth/login');
});

// SendGrid endpoint test for email notifications
app.get('/api/test-email', async (req, res) => {
  try {
    const emailService = require('./utils/emailService');
    const result = await emailService.sendEmail(
      'Test Email', 
      '<h1>Test Email</h1><p>This is a test email from your hurt Books Automation app.</p>'
    );
    
    if (result) {
      res.status(200).json({ success: true, message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send test email' });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error sending test email', 
      error: error.message 
    });
  }
});

// Error handler should be last
app.use(errorHandler);

module.exports = app;