// src/app.js (updated with dashboard routes)
const express = require('express');
const cors = require('cors');
const path = require('path');
const webhookController = require('./controllers/webhookController');
const apiController = require('./controllers/apiController');
const dashboardController = require('./controllers/dashboardController');
const logger = require('./utils/logger');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const createSessionStore = require('./utils/sessionStore');
const { authMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const flashMiddleware = require('./middleware/flash');
const config = require('../config/environment');

const app = express();

// Set up view engine (EJS) for dashboard
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware to capture raw body for webhook verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(cookieParser(config.auth.cookieSecret));
app.use(createSessionStore());
app.use(flash());
app.use(flashMiddleware);

app.use(cors());

// Dashboard routes
app.get('/dashboard', dashboardController.getDashboard);
app.get('/api/redirects', dashboardController.getRedirects);
app.post('/api/scan', dashboardController.runManualScan);
app.post('/api/override', dashboardController.manualOverride);

// Webhook routes
app.post('/webhooks/inventory-levels', webhookController.handleInventoryLevelUpdate);

// API routes
app.post('/api/check-product', apiController.triggerProductCheck);
app.post('/api/scan-all', apiController.scanAllUsedBooks);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/api/test-client', apiController.testShopifyClient);

// SendGrid endpoint test for email notifications
app.get('/api/test-email', async (req, res) => {
    try {
      const emailService = require('./utils/emailService');
      const result = await emailService.sendEmail(
        'Test Email', 
        '<h1>Test Email</h1><p>This is a test email from your Used Books Automation app.</p>'
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

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

app.use('/auth', authRoutes);
app.use('/dashboard', authMiddleware, dashboardRoutes);

module.exports = app;