// src/services/productService.js
const shopifyClient = require('../utils/shopifyClient');
const logger = require('../utils/logger');

/**
 * Get product details by ID
 */
async function getProductById(productId) {
    try {
      // Make sure we're using a string path, not an object
      const path = `products/${productId}.json`;
      const response = await shopifyClient.get(path);
      return response.body.product;
    } catch (error) {
      logger.error(`Error fetching product ${productId}: ${error.message}`);
      throw error;
    }
  }

/**
 * Publish/unpublish a product
 */
async function setProductPublishStatus(productId, shouldPublish) {
    try {
      const publishedAt = shouldPublish ? new Date().toISOString() : null;
      
      // Fix the path construction to ensure it's a string
      const path = `products/${productId}.json`;
      
      const response = await shopifyClient.put(path, {
        product: {
          id: productId,
          published_at: publishedAt
        }
      });
      
      return response.body.product;
    } catch (error) {
      logger.error(`Error ${shouldPublish ? 'publishing' : 'unpublishing'} product ${productId}: ${error.message}`);
      throw error;
    }
  }

/**
 * Checks if a handle is for a hurt book
 */
function isHurtBookHandle(handle) {
  // Look for the pattern that matches our hurt book handle convention
  // Specifically "-hurt-condition" at the end of the handle
  // e.g., "book-title-hurt-very-good" or "book-title-hurt-acceptable"
  const HurtPattern = /-hurt-(like-new|very-good|good|acceptable)$/;
  return HurtPattern.test(handle);
}

/**
 * Get the corresponding new book handle from a hurt book handle
 */
function getNewBookHandleFromHurt(HurtBookHandle) {
  return HurtBookHandle.split('-hurt-')[0];
}

module.exports = {
  getProductById,
  setProductPublishStatus,
  isHurtBookHandle,
  getNewBookHandleFromHurt
};