// src/services/redirectService.js
const shopifyClient = require('../utils/shopifyClient');
const logger = require('../utils/logger');

/**
 * Find a redirect by path
 */
async function findRedirectByPath(path) {
    try {
      // Make sure we're passing a string path, not an object with query params
      const response = await shopifyClient.get('redirects.json', {
        query: {
          path: `/products/${path}`
        }
      });
      
      // Add better error handling for the response
      if (!response.body || !response.body.redirects) {
        logger.warn(`Unexpected response format when finding redirect for ${path}`);
        return null;
      }
      
      // Check if the array is empty before trying to access the first element
      if (response.body.redirects.length === 0) {
        logger.info(`No redirect found for path ${path}`);
        return null;
      }
      
      return response.body.redirects[0];
    } catch (error) {
      logger.error(`Error finding redirect for path ${path}: ${error.message}`);
      // Return null instead of throwing an error to make this operation non-fatal
      return null;
    }
  }
  
  /**
   * Create a 302 redirect for a used book
   */
  async function createRedirect(usedBookPath, targetPath) {
    try {
      const response = await shopifyClient.post('redirects.json', {
        redirect: {
          path: `/products/${usedBookPath}`,
          target: `/products/${targetPath}`,
          redirect_type: '302'
        }
      });
      
      logger.info(`Created redirect from ${usedBookPath} to ${targetPath}`);
      return response.body.redirect;
    } catch (error) {
      logger.error(`Error creating redirect from ${usedBookPath} to ${targetPath}: ${error.message}`);
      // Return null instead of throwing an error to make this operation non-fatal
      return null;
    }
  }
  
  /**
   * Delete a redirect
   */
  async function deleteRedirect(redirectId) {
    try {
      if (!redirectId) {
        logger.warn('Attempted to delete redirect with null or undefined ID');
        return false;
      }
      
      await shopifyClient.delete(`redirects/${redirectId}.json`);
      
      logger.info(`Deleted redirect ${redirectId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting redirect ${redirectId}: ${error.message}`);
      // Return false instead of throwing an error to make this operation non-fatal
      return false;
    }
  }

module.exports = {
  createRedirect,
  findRedirectByPath,
  deleteRedirect
};