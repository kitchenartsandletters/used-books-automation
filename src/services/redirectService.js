// src/services/redirectService.js
const shopifyClient = require('../utils/shopifyClient');
const logger = require('../utils/logger');

/**
 * Create a 302 redirect for a used book
 */
async function createRedirect(usedBookPath, targetPath) {
  try {
    const response = await shopifyClient.post({
      path: 'redirects',
      data: {
        redirect: {
          path: `/products/${usedBookPath}`,
          target: `/products/${targetPath}`,
          redirect_type: '302'
        }
      }
    });
    
    logger.info(`Created redirect from ${usedBookPath} to ${targetPath}`);
    return response.body.redirect;
  } catch (error) {
    logger.error(`Error creating redirect from ${usedBookPath} to ${targetPath}: ${error.message}`);
    throw error;
  }
}

/**
 * Find a redirect by path
 */
async function findRedirectByPath(path) {
  try {
    const response = await shopifyClient.get({
      path: 'redirects',
      query: {
        path: `/products/${path}`
      }
    });
    
    return response.body.redirects[0];
  } catch (error) {
    logger.error(`Error finding redirect for path ${path}: ${error.message}`);
    throw error;
  }
}

/**
 * Delete a redirect
 */
async function deleteRedirect(redirectId) {
  try {
    await shopifyClient.delete({
      path: `redirects/${redirectId}`
    });
    
    logger.info(`Deleted redirect ${redirectId}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting redirect ${redirectId}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createRedirect,
  findRedirectByPath,
  deleteRedirect
};