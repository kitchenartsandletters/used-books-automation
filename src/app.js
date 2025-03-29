// src/app.js (updated with dashboard routes)
const express = require('express');
const cors = require('cors');
const path = require('path');
const webhookController = require('./controllers/webhookController');
const apiController = require('./controllers/apiController');
const dashboardController = require('./controllers/dashboardController');
const logger = require('./utils/logger');

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

app.use(cors());

// Dashboard routes
app.get('/dashboard', dashboardController.getDashboard);
app.get('/api/redirects', dashboardController.getRedirectsApi);
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

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;