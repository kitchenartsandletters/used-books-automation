// src/services/productService.js
const shopifyClient = require('../utils/shopifyClient');
const logger = require('../utils/logger');

/**
 * Get product details by ID
 */
async function getProductById(productId) {
  try {
    const response = await shopifyClient.get({
      path: `products/${productId}`,
    });
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
    
    const response = await shopifyClient.put({
      path: `products/${productId}`,
      data: {
        product: {
          id: productId,
          published_at: publishedAt
        }
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
  return handle.includes('-used-');
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