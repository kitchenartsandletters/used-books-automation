// src/services/cronService.js
const shopifyClient = require('../utils/shopifyClient');
const usedBookManager = require('./usedBookManager');
const logger = require('../utils/logger');
const cron = require('node-cron');

/**
 * Get all used book products
 */
async function getAllUsedBooks() {
    try {
      logger.info('Starting used books scan with correct naming convention');
      
      let products = [];
      let hasMorePages = true;
      let currentPage = 1;
      const productsPerPage = 250;
      
      // Use limit-based pagination with rate limiting
      while (hasMorePages) { // No page limit to scan the entire catalog
        logger.info(`Fetching products page ${currentPage}`);
        
        try {
          // Add delay to avoid rate limiting
          if (currentPage > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Request a page of products
          const response = await shopifyClient.get('products.json', {
            query: { limit: productsPerPage }
          });
          
          if (!response.body.products || response.body.products.length === 0) {
            logger.info('No more products found');
            break;
          }
          
          // Filter for used books using the naming convention from Title Format.md
          const usedBooks = response.body.products.filter(product => {
            // Check for the -used- pattern in the handle
            return product.handle && product.handle.includes('-used-');
          });
          
          if (usedBooks.length > 0) {
            logger.info(`Found ${usedBooks.length} used books on page ${currentPage}`);
            usedBooks.forEach(book => {
              logger.info(`  - Found used book: ${book.handle}`);
            });
          }
          
          products = [...products, ...usedBooks];
          
          // Check if we've reached the end of the catalog
          hasMorePages = response.body.products.length === productsPerPage;
          currentPage++;
          
        } catch (error) {
          if (error.message && error.message.includes('429')) {
            logger.warn('Rate limited by Shopify API, pausing before retry');
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Don't increment currentPage so we retry this page
          } else {
            throw error;
          }
        }
      }
      
      logger.info(`Completed catalog scan. Found ${products.length} used books in total`);
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
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', processAllUsedBooks);
  logger.info('Scheduled jobs started');
}

module.exports = {
  startScheduledJobs,
  processAllUsedBooks
};