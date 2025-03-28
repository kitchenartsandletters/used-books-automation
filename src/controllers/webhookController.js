// src/controllers/webhookController.js
const shopifyClient = require('../utils/shopifyClient');
const usedBookManager = require('../services/usedBookManager');
const logger = require('../utils/logger');

/**
 * Handle inventory level update webhook
 */
async function handleInventoryLevelUpdate(req, res) {
    try {
      // Verify webhook
      const hmac = req.headers['x-shopify-hmac-sha256'];
      const valid = shopifyClient.verifyWebhook(hmac, req.rawBody);
      
      if (!valid) {
        logger.error('Invalid webhook signature');
        return res.status(401).send('Invalid webhook signature');
      }
      
      const data = req.body;
      logger.info(`Received inventory webhook: ${JSON.stringify(data)}`);
      
      // Extract inventory item ID
      const { inventory_item_id } = data;
      if (!inventory_item_id) {
        logger.error('No inventory_item_id in webhook payload');
        return res.status(400).send('Missing inventory_item_id');
      }
      
      // Find variant associated with this inventory item
      logger.info(`Finding variant for inventory item: ${inventory_item_id}`);
      const variantResponse = await shopifyClient.get('variants.json', { 
        query: { inventory_item_ids: inventory_item_id }
      });
      
      if (!variantResponse.body.variants || variantResponse.body.variants.length === 0) {
        logger.error(`No variant found for inventory item ${inventory_item_id}`);
        return res.status(200).send('No applicable variant found');
      }
      
      const variant = variantResponse.body.variants[0];
      const productId = variant.product_id;
      
      // Process the inventory change
      logger.info(`Processing inventory change for product: ${productId}, variant: ${variant.id}`);
      await usedBookManager.processInventoryChange(
        inventory_item_id,
        variant.id,
        productId
      );
      
      res.status(200).send('Webhook processed successfully');
    } catch (error) {
      logger.error(`Error processing inventory level update webhook: ${error.message}`);
      // Still return 200 to Shopify so they don't retry
      res.status(200).send(`Error processing webhook: ${error.message}`);
    }
  }

module.exports = {
  handleInventoryLevelUpdate
};