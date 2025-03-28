// src/services/usedBookManager.js
const productService = require('./productService');
const inventoryService = require('./inventoryService');
const redirectService = require('./redirectService');
const logger = require('../utils/logger');
const shopifyClient = require('../utils/shopifyClient'); // Add this line

console.log('Loading usedBookManager.js with services:', {
  hasProductService: !!productService,
  hasInventoryService: !!inventoryService,
  hasRedirectService: !!redirectService,
  hasShopifyClient: !!shopifyClient
});

/**
 * Process inventory level change for a product variant
 */
async function processInventoryChange(inventoryItemId, variantId, productId) {
  try {
    // Get product details
    const product = await productService.getProductById(productId);
    
    // Check if this is a used book product
    if (!productService.isUsedBookHandle(product.handle)) {
      logger.info(`Product ${productId} is not a used book, skipping`);
      return;
    }
    
    // Check if the variant is in stock
    const isInStock = await inventoryService.isVariantInStock(variantId, inventoryItemId);
    
    // Find the corresponding new book handle
    const newBookHandle = productService.getNewBookHandleFromUsed(product.handle);
    
    if (isInStock) {
      // Product is in stock, so publish it and remove any redirects
      await productService.setProductPublishStatus(productId, true);
      logger.info(`Published used book ${product.handle} as it's now in stock`);
      
      // Check if there's a redirect to remove
      const existingRedirect = await redirectService.findRedirectByPath(product.handle);
      if (existingRedirect) {
        await redirectService.deleteRedirect(existingRedirect.id);
        logger.info(`Removed redirect for ${product.handle}`);
      }
    } else {
      // Product is out of stock, so unpublish it and set up redirects
      await productService.setProductPublishStatus(productId, false);
      logger.info(`Unpublished used book ${product.handle} as it's out of stock`);
      
      // Create redirect to new book page if it doesn't exist
      const existingRedirect = await redirectService.findRedirectByPath(product.handle);
      if (!existingRedirect) {
        await redirectService.createRedirect(product.handle, newBookHandle);
        logger.info(`Created redirect from ${product.handle} to ${newBookHandle}`);
      }
    }
    
    return {
      productId,
      handle: product.handle,
      inStock: isInStock,
      action: isInStock ? 'published' : 'unpublished'
    };
  } catch (error) {
    logger.error(`Error processing inventory change for product ${productId}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  processInventoryChange
};