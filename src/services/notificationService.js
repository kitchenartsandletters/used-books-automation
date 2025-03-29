// src/utils/notificationService.js
const logger = require('./logger');
const config = require('../../config/environment');

// Store last few notifications in memory
const notificationHistory = [];

/**
 * Add a notification to the history
 */
function addToHistory(type, subject, message) {
  const notification = {
    timestamp: new Date().toISOString(),
    type,
    subject,
    message
  };
  
  notificationHistory.unshift(notification);
  
  // Keep only last 50 notifications
  if (notificationHistory.length > 50) {
    notificationHistory.pop();
  }
  
  return notification;
}

/**
 * Get notification history
 */
function getHistory(limit = 10) {
  return notificationHistory.slice(0, limit);
}

/**
 * Log a notification (for now, we're just using the logger)
 * In a future phase, this could be extended to email, Slack, etc.
 */
function notify(type, subject, message) {
  const notification = addToHistory(type, subject, message);
  
  switch (type) {
    case 'error':
      logger.error(`[NOTIFICATION] ${subject}: ${message}`);
      break;
    case 'warning':
      logger.warn(`[NOTIFICATION] ${subject}: ${message}`);
      break;
    case 'info':
    default:
      logger.info(`[NOTIFICATION] ${subject}: ${message}`);
  }
  
  return notification;
}

/**
 * Log a critical error notification
 */
function notifyCriticalError(error, context = {}) {
  const subject = 'Critical Error Detected';
  let message = error.message;
  
  if (context.productId) {
    message += ` | Product ID: ${context.productId}`;
  }
  
  if (context.handle) {
    message += ` | Handle: ${context.handle}`;
  }
  
  return notify('error', subject, message);
}

/**
 * Log a system status notification
 */
function notifySystemStatus(stats) {
  const subject = 'System Status';
  const message = `Active Redirects: ${stats.totalRedirects}, Published Books: ${stats.publishedProducts}, Unpublished Books: ${stats.unpublishedProducts}`;
  
  return notify('info', subject, message);
}

/**
 * Log an inventory mismatch notification
 */
function notifyInventoryMismatch(product, expected, actual) {
  const subject = 'Inventory Mismatch';
  const message = `Product: ${product.title} (${product.id}) | Expected: ${expected ? 'In Stock' : 'Out of Stock'} | Actual: ${actual ? 'In Stock' : 'Out of Stock'}`;
  
  return notify('warning', subject, message);
}

module.exports = {
  notify,
  notifyCriticalError,
  notifySystemStatus,
  notifyInventoryMismatch,
  getHistory
};