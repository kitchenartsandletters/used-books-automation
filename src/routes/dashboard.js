// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAdmin } = require('../middleware/auth');

/**
 * GET /dashboard
 * Dashboard home page
 */
router.get('/', authMiddlware, dashboardController.getDashboard);

/**
 * GET /dashboard/redirects
 * Redirects management page
 */
router.get('/redirects', authMiddlware, dashboardController.getRedirects);

/**
 * GET /dashboard/books
 * Used books management page
 */
router.get('/books', authMiddlware, dashboardController.getBooks);

/**
 * GET /dashboard/logs
 * System logs page
 */
router.get('/logs', authMiddlware, dashboardController.getLogs);

/**
 * GET /dashboard/settings
 * Settings page
 */
router.get('/settings', isAdmin, authMiddlware, dashboardController.getSettings);

/**
 * POST /dashboard/scan
 * Run full system scan
 */
router.post('/scan', authMiddlware, dashboardController.runScan);

/**
 * POST /dashboard/books/:id/publish
 * Publish a book
 */
router.post('/books/:id/publish', authMiddlware, dashboardController.publishBook);

/**
 * POST /dashboard/books/:id/unpublish
 * Unpublish a book
 */
router.post('/books/:id/unpublish', authMiddlware, dashboardController.unpublishBook);

/**
 * POST /dashboard/backups/create
 * Create a new backup
 */
router.post('/backups/create', isAdmin, authMiddlware, dashboardController.createBackup);

/**
 * POST /dashboard/backups/restore
 * Restore from a backup
 */
router.post('/backups/restore', isAdmin, authMiddlware, dashboardController.restoreBackup);

/**
 * POST /dashboard/backups/delete
 * Delete a backup
 */
router.post('/backups/delete', isAdmin, authMiddlware, dashboardController.deleteBackup);

/**
 * POST /dashboard/webhooks/register
 * Register webhooks
 */
router.post('/webhooks/register', isAdmin, authMiddlware, dashboardController.registerWebhooks);

/**
 * POST /dashboard/settings/test-email
 * Send a test email
 */
router.post('/settings/test-email', isAdmin, authMiddlware, dashboardController.sendTestEmail);

/**
 * POST /dashboard/cron/start
 * Start scheduled tasks
 */
router.post('/cron/start', isAdmin, authMiddlware, dashboardController.startCronJobs);

/**
 * POST /dashboard/cron/stop
 * Stop scheduled tasks
 */
router.post('/cron/stop', isAdmin, authMiddlware, dashboardController.stopCronJobs);

/**
 * POST /dashboard/redirects/create
 * Create a new redirect
 */
router.post('/redirects/create', authMiddlware, dashboardController.createRedirect);

/**
 * POST /dashboard/redirects/update
 * Update a redirect
 */
router.post('/redirects/update', authMiddlware, dashboardController.updateRedirect);

/**
 * POST /dashboard/redirects/:id/delete
 * Delete a redirect
 */
router.post('/redirects/:id/delete', authMiddlware, dashboardController.deleteRedirect);

module.exports = router;