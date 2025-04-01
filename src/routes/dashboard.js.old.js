// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

/**
 * GET /dashboard
 * Dashboard home page
 */
router.get('/', dashboardController.getDashboard);

/**
 * GET /dashboard/redirects
 * Redirects management page
 */
router.get('/redirects', dashboardController.getRedirects);

/**
 * GET /dashboard/books
 * Used books management page
 */
router.get('/books', dashboardController.getBooks);

/**
 * GET /dashboard/logs
 * System logs page
 */
router.get('/logs', dashboardController.getLogs);

/**
 * GET /dashboard/settings
 * Settings page
 */
router.get('/settings', dashboardController.getSettings);

/**
 * POST /dashboard/scan
 * Run full system scan
 */
router.post('/scan', dashboardController.runScan);

/**
 * POST /dashboard/books/:id/publish
 * Publish a book
 */
router.post('/books/:id/publish', dashboardController.publishBook);

/**
 * POST /dashboard/books/:id/unpublish
 * Unpublish a book
 */
router.post('/books/:id/unpublish', dashboardController.unpublishBook);

module.exports = router;