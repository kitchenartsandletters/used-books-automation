// src/routes/dashboardAPI.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');
const { dashboardCache } = require('../utils/enhancedCacheService');
const logger = require('../utils/logger');

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for async loading
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Check if client has latest version
    const clientVersion = parseInt(req.query.version) || 0;
    const currentVersion = dashboardCache.getVersion('stats');
    
    // If client has latest version, send notification that data is fresh
    if (dashboardCache.isFresh('stats', clientVersion)) {
      return res.json({
        fresh: true,
        version: currentVersion
      });
    }
    
    // Check if stats are cached
    const cachedStats = dashboardCache.get('stats:dashboard');
    
    if (cachedStats) {
      // Return cached stats
      return res.json({
        fresh: false,
        version: currentVersion,
        stats: cachedStats
      });
    }
    
    // If not cached, get fresh stats
    const stats = await dashboardController.updateSystemStats();
    
    // Cache the results
    dashboardCache.set('stats:dashboard', stats, 'stats');
    
    // Return fresh stats
    return res.json({
      fresh: false,
      version: dashboardCache.getVersion('stats'),
      stats
    });
  } catch (error) {
    logger.error(`Error fetching dashboard stats: ${error.message}`);
    return res.status(500).json({
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

/**
 * GET /api/dashboard/books
 * Get books data for async loading with pagination
 */
router.get('/books', authMiddleware, async (req, res) => {
  try {
    // Get pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = req.query.filter || 'all';
    const search = req.query.search || '';
    
    // Check if client has latest version
    const clientVersion = parseInt(req.query.version) || 0;
    const currentVersion = dashboardCache.getVersion('books');
    
    // Generate cache key based on filters
    const cacheKey = `books:${filter}:${search}:${page}:${limit}`;
    
    // If client has latest version, send notification that data is fresh
    if (dashboardCache.isFresh('books', clientVersion)) {
      return res.json({
        fresh: true,
        version: currentVersion
      });
    }
    
    // Check if data is cached
    const cachedData = dashboardCache.get(cacheKey);
    
    if (cachedData) {
      // Return cached data
      return res.json({
        fresh: false,
        version: currentVersion,
        ...cachedData
      });
    }
    
    // If not cached, fetch fresh data
    // This would be implemented in the dashboardController
    const { books, pagination } = await dashboardController.getBooksPaginated(page, limit, filter, search);
    
    // Cache the results
    dashboardCache.set(cacheKey, { books, pagination }, 'books');
    
    // Return fresh data
    return res.json({
      fresh: false,
      version: dashboardCache.getVersion('books'),
      books,
      pagination
    });
  } catch (error) {
    logger.error(`Error fetching books data: ${error.message}`);
    return res.status(500).json({
      error: 'Failed to fetch books data'
    });
  }
});

/**
 * GET /api/dashboard/redirects
 * Get redirects data for async loading
 */
router.get('/redirects', authMiddleware, async (req, res) => {
  try {
    // Check if client has latest version
    const clientVersion = parseInt(req.query.version) || 0;
    const currentVersion = dashboardCache.getVersion('redirects');
    
    // If client has latest version, send notification that data is fresh
    if (dashboardCache.isFresh('redirects', clientVersion)) {
      return res.json({
        fresh: true,
        version: currentVersion
      });
    }
    
    // Check if redirects are cached
    const cachedRedirects = dashboardCache.get('redirects:all');
    
    if (cachedRedirects) {
      // Return cached redirects
      return res.json({
        fresh: false,
        version: currentVersion,
        redirects: cachedRedirects
      });
    }
    
    // If not cached, fetch fresh redirects
    const redirects = await dashboardController.getAllRedirects();
    
    // Cache the results
    dashboardCache.set('redirects:all', redirects, 'redirects');
    
    // Return fresh redirects
    return res.json({
      fresh: false,
      version: dashboardCache.getVersion('redirects'),
      redirects
    });
  } catch (error) {
    logger.error(`Error fetching redirects: ${error.message}`);
    return res.status(500).json({
      error: 'Failed to fetch redirects'
    });
  }
});

/**
 * GET /api/dashboard/logs
 * Get logs data for async loading
 */
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    // Get filter type
    const type = req.query.type || 'all';
    
    // Check if client has latest version
    const clientVersion = parseInt(req.query.version) || 0;
    const currentVersion = dashboardCache.getVersion('logs');
    
    // If client has latest version, send notification that data is fresh
    if (dashboardCache.isFresh('logs', clientVersion)) {
      return res.json({
        fresh: true,
        version: currentVersion
      });
    }
    
    // Generate cache key based on type
    const cacheKey = `logs:${type}`;
    
    // Check if logs are cached
    const cachedLogs = dashboardCache.get(cacheKey);
    
    if (cachedLogs) {
      // Return cached logs
      return res.json({
        fresh: false,
        version: currentVersion,
        notifications: cachedLogs
      });
    }
    
    // If not cached, fetch fresh logs
    const notifications = await dashboardController.getFilteredLogs(type);
    
    // Cache the results
    dashboardCache.set(cacheKey, notifications, 'logs');
    
    // Return fresh logs
    return res.json({
      fresh: false,
      version: dashboardCache.getVersion('logs'),
      notifications
    });
  } catch (error) {
    logger.error(`Error fetching logs: ${error.message}`);
    return res.status(500).json({
      error: 'Failed to fetch logs'
    });
  }
});

module.exports = router;