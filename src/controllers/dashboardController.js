// src/controllers/dashboardController.js
const shopifyClient = require('../utils/shopifyClient');
const productService = require('../services/productService');
const redirectService = require('../services/redirectService');
const cronService = require('../services/cronService');
const backupService = require('../utils/backupService');
const notificationService = require('../utils/notificationService');
const logger = require('../utils/logger');

// In-memory stats for the dashboard
let systemStats = {
  lastScanTime: global.lastScanTime || 'Not yet run',
  webhooksRegistered: false,
  totalRedirects: 0,
  totalProducts: 0,
  publishedBooks: 0,
  unpublishedBooks: 0,
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
    systemStats.publishedBooks = usedBooks.filter(p => p.published_at !== null).length;
    systemStats.unpublishedBooks = systemStats.totalProducts - systemStats.publishedBooks;
    
    return systemStats;
  } catch (error) {
    logger.error(`Error updating system stats: ${error.message}`);
    return systemStats;
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
 * Render dashboard home page
 */
async function getDashboard(req, res) {
  try {
    // Get redirects and update stats
    await updateSystemStats();
    
    // Get notification history
    const notifications = notificationService.getHistory(5);
    
    // Get recent backups (if available)
    let recentBackups = [];
    try {
      recentBackups = await backupService.listBackups();
      recentBackups = recentBackups.slice(0, 3); // Get only 3 most recent
    } catch (error) {
      logger.error(`Error getting backups: ${error.message}`);
    }
    
    // Render dashboard view
    res.render('dashboard/index', {
      title: 'Dashboard - Used Books Automation',
      stats: systemStats,
      notifications,
      recentBackups,
      user: req.user
    });
  } catch (error) {
    logger.error(`Error rendering dashboard: ${error.message}`);
    res.status(500).render('error', {
      error: {
        status: 500,
        stack: process.env.NODE_ENV === 'production' ? null : error.stack
      },
      message: 'Failed to load dashboard. Please try again later.',
      user: req.user
    });
  }
}

/**
 * Render redirects management page
 */
async function getRedirects(req, res) {
  try {
    // Get all redirects
    const redirects = await getActiveRedirects();
    
    // Render redirects view
    res.render('dashboard/redirects', {
      title: 'Redirects Management - Used Books Automation',
      redirects,
      user: req.user
    });
  } catch (error) {
    logger.error(`Error rendering redirects page: ${error.message}`);
    res.status(500).render('error', {
      error: {
        status: 500,
        stack: process.env.NODE_ENV === 'production' ? null : error.stack
      },
      message: 'Failed to load redirects. Please try again later.',
      user: req.user
    });
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
 * Render books management page
 */
async function getBooks(req, res) {
  try {
    // Get query parameters for filtering and pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const searchTerm = req.query.search || '';
    const filter = req.query.filter || 'all'; // all, published, unpublished
    
    // Get used books
    const usedBooks = await cronService.getAllUsedBooks();
    
    // Apply filters
    let filteredBooks = usedBooks;
    
    // Apply search filter if provided
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredBooks = filteredBooks.filter(book => 
        book.title.toLowerCase().includes(searchLower) || 
        book.handle.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply published/unpublished filter
    if (filter === 'published') {
      filteredBooks = filteredBooks.filter(book => book.published_at !== null);
    } else if (filter === 'unpublished') {
      filteredBooks = filteredBooks.filter(book => book.published_at === null);
    }
    
    // Calculate pagination
    const totalBooks = filteredBooks.length;
    const totalPages = Math.ceil(totalBooks / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedBooks = filteredBooks.slice(startIndex, endIndex);
    
    // Render books view
    res.render('dashboard/books', {
      title: 'Books Management - Used Books Automation',
      books: paginatedBooks,
      pagination: {
        page,
        limit,
        totalBooks,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filter,
      searchTerm,
      user: req.user
    });
  } catch (error) {
    logger.error(`Error rendering books page: ${error.message}`);
    res.status(500).render('error', {
      error: {
        status: 500,
        stack: process.env.NODE_ENV === 'production' ? null : error.stack
      },
      message: 'Failed to load books. Please try again later.',
      user: req.user
    });
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
  } catch (error) {
    logger.error(`Error in manual override: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Render system logs page
 */
async function getLogs(req, res) {
  try {
    // Get all notifications
    const notifications = notificationService.getHistory(50);
    
    // Render logs view
    res.render('dashboard/logs', {
      title: 'System Logs - Used Books Automation',
      notifications,
      user: req.user
    });
  } catch (error) {
    logger.error(`Error rendering logs page: ${error.message}`);
    res.status(500).render('error', {
      error: {
        status: 500,
        stack: process.env.NODE_ENV === 'production' ? null : error.stack
      },
      message: 'Failed to load logs. Please try again later.',
      user: req.user
    });
  }
}

/**
 * Render settings page
 */
async function getSettings(req, res) {
  try {
    // Get all backups
    const backups = await backupService.listBackups();
    
    // Render settings view
    res.render('dashboard/settings', {
      title: 'Settings - Used Books Automation',
      backups,
      config: {
        shopUrl: process.env.SHOP_URL,
        emailEnabled: process.env.EMAIL_ENABLED === 'true',
        emailFrom: process.env.EMAIL_FROM,
        emailTo: process.env.EMAIL_TO,
        webhooksRegistered: systemStats.webhooksRegistered
      },
      user: req.user
    });
  } catch (error) {
    logger.error(`Error rendering settings page: ${error.message}`);
    res.status(500).render('error', {
      error: {
        status: 500,
        stack: process.env.NODE_ENV === 'production' ? null : error.stack
      },
      message: 'Failed to load settings. Please try again later.',
      user: req.user
    });
  }
}

/**
 * Run manual system scan
 */
async function runScan(req, res) {
  try {
    // Update last scan time
    systemStats.lastScanTime = new Date().toISOString();
    global.lastScanTime = systemStats.lastScanTime;
    
    // Start the scan in background
    cronService.processAllUsedBooks()
      .then(() => {
        logger.info('Manual scan completed');
        notificationService.notify('info', 'Manual Scan Completed', 'The system scan was completed successfully');
      })
      .catch(error => {
        logger.error(`Error in manual scan: ${error.message}`);
        systemStats.lastErrors.push({
          timestamp: new Date().toISOString(),
          message: `Manual scan error: ${error.message}`
        });
        
        notificationService.notifyCriticalError(error, { context: 'Manual scan' });
        
        // Keep only last 10 errors
        if (systemStats.lastErrors.length > 10) {
          systemStats.lastErrors.shift();
        }
      });
    
    // Add flash message
    if (req.flash) {
      req.flash('success', 'System scan started');
    }
    
    // Redirect back to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    logger.error(`Error starting manual scan: ${error.message}`);
    if (req.flash) {
      req.flash('error', `Failed to start scan: ${error.message}`);
    }
    res.redirect('/dashboard');
  }
}

/**
 * Publish a book
 */
async function publishBook(req, res) {
  try {
    const productId = req.params.id;
    
    if (!productId) {
      if (req.flash) {
        req.flash('error', 'Invalid product ID');
      }
      return res.redirect('/dashboard/books');
    }
    
    // Publish the product
    await productService.setProductPublishStatus(productId, true);
    
    logger.info(`Manually published product ${productId}`);
    
    if (req.flash) {
      req.flash('success', 'Product successfully published');
    }
    
    res.redirect('/dashboard/books');
  } catch (error) {
    logger.error(`Error publishing product: ${error.message}`);
    if (req.flash) {
      req.flash('error', `Failed to publish product: ${error.message}`);
    }
    res.redirect('/dashboard/books');
  }
}

/**
 * Unpublish a book
 */
async function unpublishBook(req, res) {
  try {
    const productId = req.params.id;
    
    if (!productId) {
      if (req.flash) {
        req.flash('error', 'Invalid product ID');
      }
      return res.redirect('/dashboard/books');
    }
    
    // Unpublish the product
    await productService.setProductPublishStatus(productId, false);
    
    logger.info(`Manually unpublished product ${productId}`);
    
    if (req.flash) {
      req.flash('success', 'Product successfully unpublished');
    }
    
    res.redirect('/dashboard/books');
  } catch (error) {
    logger.error(`Error unpublishing product: ${error.message}`);
    if (req.flash) {
      req.flash('error', `Failed to unpublish product: ${error.message}`);
    }
    res.redirect('/dashboard/books');
  }
}

module.exports = {
  getDashboard,
  getRedirects,
  getBooks,
  getLogs,
  getSettings,
  runScan,
  publishBook,
  unpublishBook,
  updateSystemStats
};