// src/app.js
const express = require('express');
const cors = require('cors');
const webhookController = require('./controllers/webhookController');
const apiController = require('./controllers/apiController');
const logger = require('./utils/logger');

const app = express();

// Middleware to capture raw body for webhook verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(cors());

// Webhook routes
app.post('/webhooks/inventory-levels', webhookController.handleInventoryLevelUpdate);

// API routes
app.post('/api/check-product', apiController.triggerProductCheck);
app.post('/api/scan-all', apiController.scanAllUsedBooks);
app.post('/api/lookup-product', apiController.lookupProduct);

// Health check
// Add to app.js
app.get('/health', async (req, res) => {
    try {
      const health = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        memory: process.memoryUsage(),
        status: 'healthy'
      };
      
      // Check Shopify API connection
      try {
        const shopResponse = await shopifyClient.get('shop.json');
        health.shopify = {
          connected: true,
          shop: shopResponse.body.shop.name
        };
      } catch (error) {
        health.shopify = {
          connected: false,
          error: error.message
        };
      }
      
      res.status(200).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error.message
      });
    }
  });

app.get('/api/test-client', apiController.testShopifyClient);

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;