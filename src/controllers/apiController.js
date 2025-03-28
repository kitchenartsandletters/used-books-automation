// src/controllers/apiController.js (updated)
console.log('Loading apiController.js');

const shopifyClient = require('../utils/shopifyClient');
const productService = require('../services/productService');
const usedBookManager = require('../services/usedBookManager');
const cronService = require('../services/cronService');
const logger = require('../utils/logger');

// Replace the existing scanAllUsedBooks function with this simpler version
async function scanAllUsedBooks(req, res) {
  try {
    logger.info('Manual scan of all used books initiated');
    
    // Return a simple response for now to bypass the client issue
    res.status(200).json({ message: 'Scan not implemented yet' });
  } catch (error) {
    logger.error(`Error scanning all used books: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Manually trigger inventory check for a specific product
 */
async function triggerProductCheck(req, res) {
  try {
    const { productId, variantId, inventoryItemId } = req.body;
    
    if (!productId || !variantId || !inventoryItemId) {
      return res.status(400).json({ 
        error: 'Missing required fields: productId, variantId, and inventoryItemId are required' 
      });
    }
    
    const result = await usedBookManager.processInventoryChange(
      inventoryItemId,
      variantId,
      productId
    );
    
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error triggering product check: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Scan all used book products and update them
 */
async function scanAllUsedBooks(req, res) {
  try {
    // Use the cronService to process all used books
    logger.info('Manual scan of all used books initiated');
    
    // Start the process but don't wait for it to complete
    cronService.processAllUsedBooks()
      .then(() => logger.info('Manual scan completed'))
      .catch(err => logger.error(`Error in manual scan: ${err.message}`));
    
    res.status(200).json({ message: 'Scan initiated' });
  } catch (error) {
    logger.error(`Error scanning all used books: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

async function testShopifyClient(req, res) {
    try {
      const shopifyClient = require('../utils/shopifyClient');
      
      // Test a simple API call
      const response = await shopifyClient.get('shop.json');
      
      res.status(200).json({
        message: 'Shopify client test successful',
        shopInfo: response.body.shop
      });
    } catch (error) {
      logger.error(`Error testing Shopify client: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

// Add this to apiController.js
async function lookupProduct(req, res) {
    try {
      const { handle } = req.body;
      
      if (!handle) {
        return res.status(400).json({ error: 'Product handle is required' });
      }
      
      logger.info(`Looking up product with handle: ${handle}`);
      
      const response = await shopifyClient.get('products.json', {
        query: { handle: handle }
      });
      
      if (response.body.products && response.body.products.length > 0) {
        const product = response.body.products[0];
        logger.info(`Found product: ${product.title} (${product.handle})`);
        res.status(200).json(product);
      } else {
        logger.info(`No product found with handle: ${handle}`);
        res.status(404).json({ error: 'Product not found' });
      }
    } catch (error) {
      logger.error(`Error looking up product: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

module.exports = {
  triggerProductCheck,
  scanAllUsedBooks,
  testShopifyClient,
  lookupProduct
};