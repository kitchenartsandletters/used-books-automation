// src/controllers/dashboardController.js
const shopifyClient = require('../utils/shopifyClient');
const productService = require('../services/productService');
const redirectService = require('../services/redirectService');
const cronService = require('../services/cronService');
const logger = require('../utils/logger');

// In-memory stats for the dashboard
let systemStats = {
  lastScanTime: 'Not yet run',
  webhooksRegistered: false,
  totalRedirects: 0,
  totalProducts: 0,
  publishedProducts: 0,
  unpublishedProducts: 0,
  lastErrors: []
};

/**
 * Update system stats for the dashboard
 */
async function updateSystemStats() {
  try {
    // Get all active redirects
    const redirects = await getActiveRedirects();
    systemStats.totalRedirects = redirects.length;
    
    // Get used book products
    const usedBooks = await cronService.getAllUsedBooks();
    systemStats.totalProducts = usedBooks.length;
    systemStats.publishedProducts = usedBooks.filter(p => p.published_at !== null).length;
    systemStats.unpublishedProducts = systemStats.totalProducts - systemStats.publishedProducts;
    
    return systemStats;
  } catch (error) {
    logger.error(`Error updating system stats: ${error.message}`);
    return systemStats;
  }
}

/**
 * Render dashboard home page
 */
async function getDashboard(req, res) {
  try {
    // Get redirects and update stats
    await updateSystemStats();
    
    // Get active redirects for display
    const redirects = await getActiveRedirects();
    
    // Render dashboard view
    res.render('dashboard', {
      stats: systemStats,
      redirects,
      title: 'Used Books Automation Dashboard'
    });
  } catch (error) {
    logger.error(`Error rendering dashboard: ${error.message}`);
    res.status(500).render('error', {
      error: 'Failed to load dashboard. Please try again later.'
    });
  }
}

/**
 * Get all active redirects
 */
async function getActiveRedirects() {
  try {
    // Get all redirects from Shopify
    const response = await shopifyClient.get('redirects.json', {
      query: { limit: 250 }
    });
    
    if (!response.body || !response.body.redirects) {
      return [];
    }
    
    // Filter to only include redirects for used books
    const usedBookRedirects = response.body.redirects.filter(redirect => 
      redirect.path && redirect.path.includes('/products/') && 
      redirect.path.includes('-used-')
    );
    
    return usedBookRedirects;
  } catch (error) {
    logger.error(`Error getting active redirects: ${error.message}`);
    return [];
  }
}

/**
 * API endpoint to get redirects
 */
async function getRedirectsApi(req, res) {
  try {
    const redirects = await getActiveRedirects();
    res.status(200).json({ redirects });
  } catch (error) {
    logger.error(`Error in redirects API: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Run manual system scan
 */
async function runManualScan(req, res) {
  try {
    // Update last scan time
    systemStats.lastScanTime = new Date().toISOString();
    
    // Start the scan in background
    cronService.processAllUsedBooks()
      .then(() => {
        logger.info('Manual scan completed');
      })
      .catch(error => {
        logger.error(`Error in manual scan: ${error.message}`);
        systemStats.lastErrors.push({
          timestamp: new Date().toISOString(),
          message: `Manual scan error: ${error.message}`
        });
        
        // Keep only last 10 errors
        if (systemStats.lastErrors.length > 10) {
          systemStats.lastErrors.shift();
        }
      });
    
    // Return immediately
    res.status(200).json({ message: 'Scan started' });
  } catch (error) {
    logger.error(`Error starting manual scan: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Handle manual override
 */
async function manualOverride(req, res) {
  try {
    const { productId, action } = req.body;
    
    // Validate request
    if (!productId) {
      return res.status(400).json({
        error: 'Product ID is required'
      });
    }
    
    if (action !== 'publish' && action !== 'unpublish') {
      return res.status(400).json({
        error: 'Action must be either "publish" or "unpublish"'
      });
    }
    
    // Get product details
    const product = await productService.getProductById(productId);
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }
    
    // Check if it's a used book
    if (!productService.isUsedBookHandle(product.handle)) {
      return res.status(400).json({
        error: 'This is not a used book product'
      });
    }
    
    if (action === 'publish') {
      // Publish the product
      await productService.setProductPublishStatus(productId, true);
      
      // Remove any redirects
      const existingRedirect = await redirectService.findRedirectByPath(product.handle);
      if (existingRedirect) {
        await redirectService.deleteRedirect(existingRedirect.id);
      }
      
      logger.info(`Manual override: Published product ${productId}`);
    } else {
      // Unpublish the product
      await productService.setProductPublishStatus(productId, false);
      
      // Create redirect if needed
      const newBookHandle = productService.getNewBookHandleFromUsed(product.handle);
      const existingRedirect = await redirectService.findRedirectByPath(product.handle);
      
      if (!existingRedirect) {
        await redirectService.createRedirect(product.handle, newBookHandle);
      }
      
      logger.info(`Manual override: Unpublished product ${productId}`);
    }
    
    // Update stats
    await updateSystemStats();
    
    res.status(200).json({
      success: true,
      message: `Product ${productId} ${action === 'publish' ? 'published' : 'unpublished'} successfully`
    });
  } catch (error) {
    logger.error(`Error in manual override: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getDashboard,
  getRedirectsApi,
  runManualScan,
  manualOverride,
  updateSystemStats
};