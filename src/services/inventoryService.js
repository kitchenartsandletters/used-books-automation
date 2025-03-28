// src/services/inventoryService.js
const shopifyClient = require('../utils/shopifyClient');
const logger = require('../utils/logger');

/**
 * Get inventory level for a variant
 */
async function getInventoryLevel(inventoryItemId) {
  try {
    const response = await shopifyClient.get({
      path: `inventory_levels.json`,
      query: {
        inventory_item_ids: inventoryItemId
      }
    });
    
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