// src/services/seoService.js
const shopifyClient = require('../utils/shopifyClient');
const logger = require('../utils/logger');
const notificationService = require('../utils/notificationService');

/**
 * Set canonical URL for a product using metafields
 */
async function setCanonicalUrl(productId, canonicalUrl) {
  try {
    // Check if inputs are valid
    if (!productId || !canonicalUrl) {
      logger.warn(`Invalid inputs for setting canonical URL: productId=${productId}, url=${canonicalUrl}`);
      return null;
    }
    
    // Update the product with metafield for canonical URL
    const response = await shopifyClient.put(`products/${productId}.json`, {
      product: {
        id: productId,
        metafields: [
          {
            namespace: 'seo',
            key: 'canonical_url',
            value: canonicalUrl,
            type: 'single_line_text_field'
          }
        ]
      }
    });
    
    logger.info(`Set canonical URL for product ${productId} to ${canonicalUrl}`);
    return response.body.product;
  } catch (error) {
    logger.error(`Error setting canonical URL for product ${productId}: ${error.message}`);
    notificationService.notify('warning', 'SEO Update Failed', 
      `Could not set canonical URL for product ${productId}: ${error.message}`);
    return null;
  }
}

/**
 * Set canonical URL for a used book to point to its new book equivalent
 */
async function updateUsedBookCanonicals(product, newBookHandle) {
  try {
    if (!product || !product.id || !product.handle || !newBookHandle) {
      logger.warn(`Invalid inputs for updating canonical URL`);
      return null;
    }
    
    // Construct the canonical URL to the new book
    const shopUrl = process.env.SHOP_URL || '';
    const canonicalUrl = `https://${shopUrl}/products/${newBookHandle}`;
    
    // Set the canonical URL
    const result = await setCanonicalUrl(product.id, canonicalUrl);
    
    return result;
  } catch (error) {
    logger.error(`Error updating canonical URL for used book ${product.id}: ${error.message}`);
    return null;
  }
}

module.exports = {
  setCanonicalUrl,
  updateUsedBookCanonicals
};