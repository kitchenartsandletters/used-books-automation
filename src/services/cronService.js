// src/services/cronService.js
const shopifyClient = require('../utils/shopifyClient');
const hurtBookManager = require('./hurtBookManager');
const backupService = require('../utils/backupService');
const notificationService = require('../utils/notificationService');
const logger = require('../utils/logger');
const cron = require('node-cron');

/**
 * Get hurt book products with optional limit
 * @param {number} maxItems - Maximum number of items to return
 * @returns {Promise<Array>} Array of hurt book products
 */
async function getAllHurtBooks(maxItems = null, quickLoad = false) {
  try {
    if (quickLoad) {
      // Just get the first page with a small limit
      const response = await shopifyClient.get('products.json', {
        query: { limit: 50 }
      });
      
      if (!response.body || !response.body.products) {
        return [];
      }
      
      // Filter for hurt books based on the handle pattern
      const HurtBooks = response.body.products.filter(product => {
        return product.handle && product.handle.includes('-hurt-');
      });
      
      logger.info(`Quick loaded ${HurtBooks.length} hurt books for dashboard`);
      return HurtBooks;
    }

    logger.info(`Starting hurt books scan${maxItems ? ` (limited to ${maxItems} items)` : ''}`);
    
    let products = [];
    let hasMoreProducts = true;
    let nextPageToken = null;
    const limit = 250; // Max allowed by Shopify - get the most products per request
    let requestCount = 0;
    const MAX_REQUESTS = maxItems ? Math.ceil(maxItems / limit) : 100; // Safety limit
    
    while (hasMoreProducts && requestCount < MAX_REQUESTS) {
      try {
        // Only add a small delay between requests
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Build the query parameters
        const queryParams = { limit };
        if (nextPageToken) {
          queryParams.page_info = nextPageToken;
        }
        
        logger.info(`Fetching products batch ${requestCount + 1}${nextPageToken ? ' (continued)' : ' (first batch)'}`);
        requestCount++;
        
        const response = await shopifyClient.get('products.json', {
          query: queryParams
        });
        
        if (!response.body || !response.body.products || response.body.products.length === 0) {
          logger.info('No more products found');
          break;
        }
        
        // Get the pagination information from the Link header
        const linkHeader = response.headers ? response.headers.get('Link') : null;
        nextPageToken = null;
        
        if (linkHeader) {
          // Parse the Link header to extract the next page token
          const nextLink = linkHeader.split(',').find(link => link.includes('rel="next"'));
          if (nextLink) {
            const match = nextLink.match(/page_info=([^&>]*)/);
            if (match && match[1]) {
              nextPageToken = match[1];
            }
          }
        }
        
        // Filter for hurt books based on the handle pattern - do this efficiently
        const HurtBooks = response.body.products.filter(product => {
          return product.handle && product.handle.includes('-hurt-');
        });
        
        // Only log the count, not each individual book (reduces log overhead)
        if (HurtBooks.length > 0) {
          logger.info(`Found ${HurtBooks.length} hurt books in batch ${requestCount}`);
        }
        
        products = [...products, ...HurtBooks];
        
        // Check if we've reached the maxItems limit
        if (maxItems && products.length >= maxItems) {
          products = products.slice(0, maxItems);
          hasMoreProducts = false;
          logger.info(`Reached specified item limit (${maxItems})`);
          break;
        }
        
        // If we don't have a next page token, we've reached the end
        hasMoreProducts = !!nextPageToken;
        
      } catch (error) {
        if (error.message && error.message.includes('429')) {
          logger.warn('Rate limited by Shopify API, pausing before retry');
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Don't increment requestCount so we retry this request
          requestCount--;
        } else {
          throw error;
        }
      }
    }
    
    if (requestCount >= MAX_REQUESTS && hasMoreProducts) {
      logger.warn(`Reached maximum request threshold (${MAX_REQUESTS}). Some products may not have been scanned.`);
    }
    
    logger.info(`Completed catalog scan. Found ${products.length} hurt books in total after ${requestCount} requests`);
    return products;
  } catch (error) {
    logger.error(`Error fetching hurt books: ${error.message}`);
    throw error;
  }
}
  
/**
 * Process all hurt books
 */
async function processAllHurtBooks() {
  try {
    logger.info('Starting scheduled check of all hurt books');
    
    const HurtBooks = await getAllHurtBooks();
    logger.info(`Found ${HurtBooks.length} hurt books to process`);
    
    for (const product of HurtBooks) {
      // Process each variant of the product
      for (const variant of product.variants) {
        await hurtBookManager.processInventoryChange(
          variant.inventory_item_id,
          variant.id,
          product.id
        );
      }
    }
    
    logger.info('Completed scheduled check of all hurt books');
  } catch (error) {
    logger.error(`Error in scheduled job: ${error.message}`);
  }
}

/**
 * Start the scheduled jobs
 */
function startScheduledJobs() {
    // Process all hurt books every 30 minutes
    const inventoryJob = cron.schedule('*/30 * * * *', async () => {
      global.lastScanTime = new Date().toISOString();
      try {
        await processAllHurtBooks();
        logger.info('Scheduled inventory check completed successfully');
      } catch (error) {
        logger.error(`Error in scheduled inventory check: ${error.message}`);
        notificationService.notifyCriticalError(error, { 
          context: 'Scheduled inventory check'
        });
      }
    });
    
    // Create daily backup at 1:00 AM
    const backupJob = cron.schedule('0 1 * * *', async () => {
      try {
        logger.info('Starting daily backup...');
        const backup = await backupService.backupRedirects();
        
        if (backup) {
          logger.info(`Daily backup completed: ${backup.count} redirects saved`);
        } else {
          logger.warn('Daily backup completed with no redirects saved');
        }
      } catch (error) {
        logger.error(`Error in daily backup: ${error.message}`);
        notificationService.notifyCriticalError(error, { 
          context: 'Daily backup'
        });
      }
    });
    
    // Set global flag to indicate jobs are running
    global.cronJobsActive = true;
    global.lastScanTime = 'Not yet run';
    
    logger.info('Scheduled jobs started: inventory check and daily backup');
    
    // Return job handles so they can be stopped if needed
    return {
      inventoryJob,
      backupJob
    };
  }
  
  module.exports = {
    getAllHurtBooks,
    processAllHurtBooks,
    startScheduledJobs
  };