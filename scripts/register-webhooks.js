// scripts/register-webhooks.js
require('dotenv').config();
const logger = require('../src/utils/logger');
const shopifyClient = require('../src/utils/shopifyClient');

async function registerWebhooks() {
  try {
    // Use APP_URL from environment variables
    const appUrl = process.env.APP_URL || 'https://your-railway-app-url.up.railway.app';
    
    // Set up the webhook for inventory level updates
    const response = await shopifyClient.post('webhooks.json', {
      webhook: {
        topic: 'inventory_levels/update',
        address: `${appUrl}/webhooks/inventory-levels`,
        format: 'json'
      }
    });
    
    logger.info(`Webhook registered: ${JSON.stringify(response.body.webhook)}`);
    
    // You can add more webhooks here if needed
  } catch (error) {
    logger.error(`Error registering webhook: ${error.message}`);
    process.exit(1);
  }
}

registerWebhooks();