// src/services/inventoryService.js
const shopifyClient = require('../utils/shopifyClient');
const logger = require('../utils/logger');

/**
 * Get inventory level for a variant
 */
async function getInventoryLevel(inventoryItemId) {
    try {
      const response = await shopifyClient.get(`inventory_levels.json`, {
        query: {
          inventory_item_ids: inventoryItemId
        }
      });
      
      // Add defensive checks to handle empty or unexpected responses
      if (!response.body || !response.body.inventory_levels || !Array.isArray(response.body.inventory_levels)) {
        logger.warn(`No inventory data returned for item ${inventoryItemId}`);
        return null; // Return null instead of assuming there's an array with an index 0
      }
      
      // If array is empty, return null instead of trying to access index 0
      if (response.body.inventory_levels.length === 0) {
        logger.warn(`Empty inventory levels array for item ${inventoryItemId}`);
        return null;
      }
      
      return response.body.inventory_levels[0];
    } catch (error) {
      logger.error(`Error fetching inventory for item ${inventoryItemId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Check if a product variant is in stock
   */
  async function isVariantInStock(variantId, inventoryItemId) {
    try {
      const inventoryLevel = await getInventoryLevel(inventoryItemId);
      
      // If we got null from getInventoryLevel, handle it gracefully
      if (inventoryLevel === null) {
        logger.warn(`Could not determine inventory for variant ${variantId}, assuming out of stock`);
        return false; // Default to considering it out of stock
      }
      
      return inventoryLevel && inventoryLevel.available > 0;
    } catch (error) {
      logger.error(`Error checking stock for variant ${variantId}: ${error.message}`);
      throw error;
    }
  }

module.exports = {
  getInventoryLevel,
  isVariantInStock
};