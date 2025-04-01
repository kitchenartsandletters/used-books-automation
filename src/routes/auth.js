// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * GET /auth/login
 * Login page
 */
router.get('/login', authController.getLoginPage);

/**
 * POST /auth/login
 * Process login form
 */
router.post('/login', authController.processLogin);

/**
 * GET /auth/logout
 * Log out user
 */
router.get('/logout', authController.logout);

module.exports = router;