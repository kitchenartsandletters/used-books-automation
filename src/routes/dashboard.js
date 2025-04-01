// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAdmin } = require('../middleware/auth');

/**
 * GET /dashboard
 * Dashboard home page
 */
router.get('/', authMiddleware, dashboardController.getDashboard);

/**
 * GET /dashboard/redirects
 * Redirects management page
 */
router.get('/redirects', authMiddleware, dashboardController.getRedirects);

/**
 * GET /dashboard/books
 * Used books management page
 */
router.get('/books', authMiddleware, dashboardController.getBooks);

/**
 * GET /dashboard/logs
 * System logs page
 */
router.get('/logs', authMiddleware, dashboardController.getLogs);

/**
 * GET /dashboard/settings
 * Settings page
 */
router.get('/settings', isAdmin, authMiddleware, dashboardController.getSettings);

/**
 * POST /dashboard/scan
 * Run full system scan
 */
router.post('/scan', authMiddleware, dashboardController.runScan);

/**
 * POST /dashboard/books/:id/publish
 * Publish a book
 */
router.post('/books/:id/publish', authMiddleware, dashboardController.publishBook);

/**
 * POST /dashboard/books/:id/unpublish
 * Unpublish a book
 */
router.post('/books/:id/unpublish', authMiddleware, dashboardController.unpublishBook);

/**
 * POST /dashboard/backups/create
 * Create a new backup
 */
router.post('/backups/create', isAdmin, authMiddleware, dashboardController.createBackup);

/**
 * POST /dashboard/backups/restore
 * Restore from a backup
 */
router.post('/backups/restore', isAdmin, authMiddleware, dashboardController.restoreBackup);

/**
 * POST /dashboard/backups/delete
 * Delete a backup
 */
router.post('/backups/delete', isAdmin, authMiddleware, dashboardController.deleteBackup);

/**
 * POST /dashboard/webhooks/register
 * Register webhooks
 */
router.post('/webhooks/register', isAdmin, authMiddleware, dashboardController.registerWebhooks);

/**
 * POST /dashboard/settings/test-email
 * Send a test email
 */
router.post('/settings/test-email', isAdmin, authMiddleware, dashboardController.sendTestEmail);

/**
 * POST /dashboard/cron/start
 * Start scheduled tasks
 */
router.post('/cron/start', isAdmin, authMiddleware, dashboardController.startCronJobs);

/**
 * POST /dashboard/cron/stop
 * Stop scheduled tasks
 */
router.post('/cron/stop', isAdmin, authMiddleware, dashboardController.stopCronJobs);

/**
 * POST /dashboard/redirects/create
 * Create a new redirect
 */
router.post('/redirects/create', authMiddleware, dashboardController.createRedirect);

/**
 * POST /dashboard/redirects/update
 * Update a redirect
 */
router.post('/redirects/update', authMiddleware, dashboardController.updateRedirect);

/**
 * POST /dashboard/redirects/:id/delete
 * Delete a redirect
 */
router.post('/redirects/:id/delete', authMiddleware, dashboardController.deleteRedirect);

module.exports = router;