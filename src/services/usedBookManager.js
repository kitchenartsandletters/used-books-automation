// src/services/usedBookManager.js (updated with SEO management)
const productService = require('./productService');
const inventoryService = require('./inventoryService');
const redirectService = require('./redirectService');
const seoService = require('./seoService');
const logger = require('../utils/logger');
const notificationService = require('../utils/notificationService');
const shopifyClient = require('../utils/shopifyClient');

console.log('Loading usedBookManager.js with services:', {
  hasProductService: !!productService,
  hasInventoryService: !!inventoryService,
  hasRedirectService: !!redirectService,
  hasSeoService: !!seoService, // Added
  hasShopifyClient: !!shopifyClient
});

/**
 * Process inventory level change for a product variant
 */
async function processInventoryChange(inventoryItemId, variantId, productId) {
  try {
    // Get product details
    const product = await productService.getProductById(productId);
    
    if (!product) {
      logger.warn(`Product ${productId} not found, skipping`);
      return;
    }
    
    // Check if this is a used book product
    if (!productService.isUsedBookHandle(product.handle)) {
      logger.info(`Product ${productId} is not a used book, skipping`);
      return;
    }
    
    // Check if the variant is in stock
    const isInStock = await inventoryService.isVariantInStock(variantId, inventoryItemId);
    logger.info(`Used book ${product.handle} stock status: ${isInStock ? 'in stock' : 'out of stock'}`);
    
    // Find the corresponding new book handle
    const newBookHandle = productService.getNewBookHandleFromUsed(product.handle);
    
    // Always set the canonical URL regardless of stock status
    // This ensures SEO points to the main product even when the used book is in stock
    const canonicalSet = await seoService.updateUsedBookCanonicals(product, newBookHandle);
    
    if (isInStock) {
      // Product is in stock, so publish it and remove any redirects
      await productService.setProductPublishStatus(productId, true);
      logger.info(`Published used book ${product.handle} as it's now in stock`);
      
      // Check if there's a redirect to remove
      try {
        const existingRedirect = await redirectService.findRedirectByPath(product.handle);
        if (existingRedirect) {
          const success = await redirectService.deleteRedirect(existingRedirect.id);
          if (success) {
            logger.info(`Removed redirect for ${product.handle}`);
          } else {
            logger.warn(`Failed to remove redirect for ${product.handle}`);
            notificationService.notify('warning', 'Redirect Removal Failed', 
              `Could not remove redirect for ${product.handle}`);
          }
        }
      } catch (redirectError) {
        logger.warn(`Could not check or remove redirect for ${product.handle}: ${redirectError.message}`);
        notificationService.notify('warning', 'Redirect Operation Failed', 
          `Error with redirect for ${product.handle}: ${redirectError.message}`);
        // Continue processing even if redirect operations fail
      }
    } else {
      // Product is out of stock, so unpublish it and set up redirects
      await productService.setProductPublishStatus(productId, false);
      logger.info(`Unpublished used book ${product.handle} as it's out of stock`);
      
      // Create redirect to new book page if it doesn't exist
      try {
        const existingRedirect = await redirectService.findRedirectByPath(product.handle);
        if (!existingRedirect) {
          const redirect = await redirectService.createRedirect(product.handle, newBookHandle);
          if (redirect) {
            logger.info(`Created redirect from ${product.handle} to ${newBookHandle}`);
          } else {
            logger.warn(`Failed to create redirect from ${product.handle} to ${newBookHandle}`);
            notificationService.notify('warning', 'Redirect Creation Failed', 
              `Could not create redirect from ${product.handle} to ${newBookHandle}`);
          }
        }
      } catch (redirectError) {
        logger.warn(`Could not check or create redirect for ${product.handle}: ${redirectError.message}`);
        notificationService.notify('warning', 'Redirect Operation Failed', 
          `Error with redirect for ${product.handle}: ${redirectError.message}`);
        // Continue processing even if redirect operations fail
      }
    }
    
    return {
      productId,
      handle: product.handle,
      inStock: isInStock,
      action: isInStock ? 'published' : 'unpublished',
      canonicalSet: !!canonicalSet
    };
  } catch (error) {
    logger.error(`Error processing inventory change for product ${productId}: ${error.message}`);
    notificationService.notifyCriticalError(error, { 
      productId,
      context: 'Inventory change processing'
    });
    throw error;
  }
}

module.exports = {
  processInventoryChange
};