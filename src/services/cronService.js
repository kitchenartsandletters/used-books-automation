// src/services/cronService.js
const shopifyClient = require('../utils/shopifyClient');
const usedBookManager = require('./usedBookManager');
const backupService = require('../utils/backupService');
const notificationService = require('../utils/notificationService');
const logger = require('../utils/logger');
const cron = require('node-cron');

/**
 * Get all used book products
 */
// Updated getAllUsedBooks function
async function getAllUsedBooks() {
    try {
      logger.info('Starting used books scan');
      
      let products = [];
      let hasMoreProducts = true;
      let nextPageToken = null;
      const limit = 250; // Max allowed by Shopify - get the most products per request
      let requestCount = 0;
      const MAX_REQUESTS = 100; // Safety limit
      
      while (hasMoreProducts && requestCount < MAX_REQUESTS) {
        try {
          // Only add a small delay between requests, not 500ms
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
          
          // Filter for used books based on the handle pattern - do this efficiently
          const usedBooks = response.body.products.filter(product => {
            return product.handle && product.handle.includes('-used-');
          });
          
          // Only log the count, not each individual book (reduces log overhead)
          if (usedBooks.length > 0) {
            logger.info(`Found ${usedBooks.length} used books in batch ${requestCount}`);
            
            // If you need detailed logging, uncomment this
            // usedBooks.forEach(book => {
            //   logger.info(`Used book found: ${book.handle}`);
            // });
          }
          
          products = [...products, ...usedBooks];
          
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
      
      logger.info(`Completed catalog scan. Found ${products.length} used books in total after ${requestCount} requests`);
      return products;
    } catch (error) {
      logger.error(`Error fetching used books: ${error.message}`);
      throw error;
    }
  }
  
/**
 * Process all used books
 */
async function processAllUsedBooks() {
  try {
    logger.info('Starting scheduled check of all used books');
    
    const usedBooks = await getAllUsedBooks();
    logger.info(`Found ${usedBooks.length} used books to process`);
    
    for (const product of usedBooks) {
      // Process each variant of the product
      for (const variant of product.variants) {
        await usedBookManager.processInventoryChange(
          variant.inventory_item_id,
          variant.id,
          product.id
        );
      }
    }
    
    logger.info('Completed scheduled check of all used books');
  } catch (error) {
    logger.error(`Error in scheduled job: ${error.message}`);
  }
}

/**
 * Start the scheduled jobs
 */
function startScheduledJobs() {
    // Process all used books every 30 minutes
    const inventoryJob = cron.schedule('*/30 * * * *', async () => {
      global.lastScanTime = new Date().toISOString();
      try {
        await processAllUsedBooks();
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
    getAllUsedBooks,
    processAllUsedBooks,
    startScheduledJobs
  };