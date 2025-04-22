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
 * Get books with pagination for async loading
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} filter - Filter type (all, published, unpublished)
 * @param {string} search - Search term
 */
async function getBooksPaginated(page, limit, filter = 'all', search = '') {
  try {
    // Default page and limit if invalid
    page = page > 0 ? page : 1;
    limit = limit > 0 && limit <= 100 ? limit : 20;
    
    // This prevents loading the entire catalog at once - get the list but with a hard limit
    // For a production app, this would use database pagination
    const HurtBooks = await cronService.getAllHurtBooks(250); // Hard limit to prevent excessive loading
    
    // Apply filters
    let filteredBooks = HurtBooks;
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
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
    
    // Get the subset of books for this page
    const paginatedBooks = filteredBooks.slice(startIndex, Math.min(endIndex, filteredBooks.length));
    
    // Create pagination info
    const pagination = {
      page,
      limit,
      totalBooks,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
    
    return {
      books: paginatedBooks,
      pagination
    };
  } catch (error) {
    logger.error(`Error getting paginated books: ${error.message}`);
    throw error;
  }
}

/**
 * Get all redirects for async loading
 */
async function getAllRedirects() {
  try {
    // Get active redirects (reuse existing function)
    return await getActiveRedirects();
  } catch (error) {
    logger.error(`Error getting all redirects: ${error.message}`);
    throw error;
  }
}

/**
 * Get filtered logs for async loading
 * @param {string} type - Log type filter (all, error, warning, info)
 */
async function getFilteredLogs(type = 'all') {
  try {
    // Get all notifications
    const allNotifications = notificationService.getHistory(50);
    
    // Apply filter if not 'all'
    if (type !== 'all') {
      return allNotifications.filter(notification => notification.type === type);
    }
    
    return allNotifications;
  } catch (error) {
    logger.error(`Error getting filtered logs: ${error.message}`);
    throw error;
  }
}

/**
 * Update system stats for the dashboard
 */
async function updateSystemStats() {
  try {
    // Get all active redirects
    const redirects = await getActiveRedirects();
    systemStats.totalRedirects = redirects.length;
    
    // Get hurt book products
    const HurtBooks = await cronService.getAllHurtBooks();
    systemStats.totalProducts = HurtBooks.length;
    systemStats.publishedBooks = HurtBooks.filter(p => p.published_at !== null).length;
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
    
    // Filter to only include redirects for hurt books
    const HurtBookRedirects = response.body.redirects.filter(redirect => 
      redirect.path && redirect.path.includes('/products/') && 
      redirect.path.includes('-hurt-')
    );
    
    return HurtBookRedirects;
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
    // Render the dashboard immediately with minimal data
    // Don't wait for expensive operations
    res.render('../views/dashboard/index', {
      title: 'Dashboard - hurt Books Automation',
      stats: {
        lastScanTime: global.lastScanTime || 'Not yet run',
        webhooksRegistered: false,
        totalRedirects: 0,
        totalProducts: 0,
        publishedBooks: 0,
        unpublishedBooks: 0,
        lastErrors: []
      },
      notifications: [],
      recentBackups: [],
      user: req.user || { name: 'User', username: 'user', role: 'guest' }
    });
    
    // Then start updating stats in the background - client will fetch via API
    updateSystemStats().catch(error => {
      logger.error(`Background stats update error: ${error.message}`);
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
      title: 'Redirects Management - hurt Books Automation',
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
async function runManualScan(req, res) {
  try {
    // Update last scan time
    systemStats.lastScanTime = new Date().toISOString();
    
    // Start the scan in background
    cronService.processAllHurtBooks()
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
*/
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
    const notifications = notificationService.getHistory(5);
    
    // Get hurt books
    const HurtBooks = await cronService.getAllHurtBooks(100);

    // Log books info for debugging
    logger.info(`Books found: ${HurtBooks.length}`);
    
    // Apply filters
    let filteredBooks = HurtBooks;
    
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

    // Log filtered books count
    logger.info(`Filtered books: ${filteredBooks.length}`);    
    
    // Calculate pagination
    const totalBooks = filteredBooks.length;
    const totalPages = Math.ceil(totalBooks / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

    // Log pagination info
    logger.info(`Page ${page}, showing ${paginatedBooks.length} books (${startIndex}-${endIndex} of ${totalBooks})`);
    
    // Render books view
    res.render('dashboard/books', {
      title: 'Books Management - hurt Books Automation',
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
      notifications,
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
    
    // Check if it's a hurt book
    if (!productService.isHurtBookHandle(product.handle)) {
      return res.status(400).json({
        error: 'This is not a hurt book product'
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
      const newBookHandle = productService.getNewBookHandleFromHurt(product.handle);
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
      title: 'System Logs - hurt Books Automation',
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
      title: 'Settings - hurt Books Automation',
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
    cronService.processAllHurtBooks()
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
  updateSystemStats,
  manualOverride,
  getBooksPaginated,
  getAllRedirects,
  getFilteredLogs
};