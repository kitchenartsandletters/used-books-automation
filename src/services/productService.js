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
 * Checks if a handle is for a used book
 */
function isUsedBookHandle(handle) {
  // Look for the pattern that matches our used book handle convention
  // Specifically "-used-condition" at the end of the handle
  // e.g., "book-title-used-very-good" or "book-title-used-acceptable"
  const usedPattern = /-used-(like-new|very-good|good|acceptable)$/;
  return usedPattern.test(handle);
}

/**
 * Get the corresponding new book handle from a used book handle
 */
function getNewBookHandleFromUsed(usedBookHandle) {
  return usedBookHandle.split('-used-')[0];
}

module.exports = {
  getProductById,
  setProductPublishStatus,
  isUsedBookHandle,
  getNewBookHandleFromUsed
};