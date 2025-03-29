// src/utils/notificationService.js (updated for SendGrid)
const logger = require('./logger');
const emailService = require('./emailService');

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
 * Log a notification and send email for critical ones
 */
async function notify(type, subject, message, sendEmail = false) {
  const notification = addToHistory(type, subject, message);
  
  // Log notification based on type
  switch (type) {
    case 'error':
      logger.error(`[NOTIFICATION] ${subject}: ${message}`);
      // Always send email for errors
      await emailService.sendEmail(`ERROR: ${subject}`, createHtmlMessage(type, subject, message));
      break;
    case 'warning':
      logger.warn(`[NOTIFICATION] ${subject}: ${message}`);
      // Only send email for warnings if explicitly requested
      if (sendEmail) {
        await emailService.sendEmail(`WARNING: ${subject}`, createHtmlMessage(type, subject, message));
      }
      break;
    case 'info':
    default:
      logger.info(`[NOTIFICATION] ${subject}: ${message}`);
      // Only send email for info if explicitly requested
      if (sendEmail) {
        await emailService.sendEmail(subject, createHtmlMessage(type, subject, message));
      }
  }
  
  return notification;
}

/**
 * Create HTML email message
 */
function createHtmlMessage(type, subject, message) {
  const bgColor = type === 'error' ? '#ffeded' : 
                  type === 'warning' ? '#fff9ed' : 
                  '#edf7ff';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: ${bgColor}; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #333;">${subject}</h2>
        <p style="margin-bottom: 0;">${message}</p>
      </div>
      <div style="color: #666; font-size: 12px;">
        <p>Sent from Used Books Automation at ${new Date().toISOString()}</p>
      </div>
    </div>
  `;
}

/**
 * Log a critical error notification
 */
async function notifyCriticalError(error, context = {}) {
  const subject = 'Critical Error Detected';
  let message = error.message;
  
  if (context.productId) {
    message += ` | Product ID: ${context.productId}`;
  }
  
  if (context.handle) {
    message += ` | Handle: ${context.handle}`;
  }
  
  if (context.context) {
    message += ` | Context: ${context.context}`;
  }
  
  // Add stack trace for detailed debugging
  const htmlMessage = `
    <p><strong>Error:</strong> ${error.message}</p>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    ${context.productId ? `<p><strong>Product ID:</strong> ${context.productId}</p>` : ''}
    ${context.handle ? `<p><strong>Handle:</strong> ${context.handle}</p>` : ''}
    ${context.context ? `<p><strong>Context:</strong> ${context.context}</p>` : ''}
    <p><strong>Stack Trace:</strong></p>
    <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">${error.stack}</pre>
  `;
  
  // Always send email for critical errors
  await emailService.sendEmail(`CRITICAL ERROR: ${subject}`, htmlMessage);
  
  return notify('error', subject, message);
}

/**
 * Log a system status notification
 */
async function notifySystemStatus(stats) {
  const subject = 'System Status Report';
  const message = `Active Redirects: ${stats.totalRedirects}, Published: ${stats.publishedBooks}, Unpublished: ${stats.unpublishedBooks}`;
  
  const htmlMessage = `
    <h2>Used Books Automation - Status Report</h2>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr style="background-color: #f2f2f2;">
        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Metric</th>
        <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Value</th>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Active Redirects</td>
        <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${stats.totalRedirects}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Published Books</td>
        <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${stats.publishedBooks}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Unpublished Books</td>
        <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${stats.unpublishedBooks}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Last Scan Time</td>
        <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${stats.lastScanTime}</td>
      </tr>
    </table>
    <p>This is an automated status report from your Used Books Automation system.</p>
  `;
  
  // Send email for daily status report
  await emailService.sendEmail(subject, htmlMessage);
  
  return notify('info', subject, message);
}

/**
 * Log an inventory mismatch notification
 */
async function notifyInventoryMismatch(product, expected, actual) {
  const subject = 'Inventory Mismatch';
  const message = `Product: ${product.title} (${product.id}) | Expected: ${expected ? 'In Stock' : 'Out of Stock'} | Actual: ${actual ? 'In Stock' : 'Out of Stock'}`;
  
  // Send email for inventory mismatches
  const htmlMessage = `
    <h2>Inventory Mismatch Detected</h2>
    <p><strong>Product:</strong> ${product.title}</p>
    <p><strong>Product ID:</strong> ${product.id}</p>
    <p><strong>Handle:</strong> ${product.handle}</p>
    <p><strong>Expected Status:</strong> ${expected ? 'In Stock' : 'Out of Stock'}</p>
    <p><strong>Actual Status:</strong> ${actual ? 'In Stock' : 'Out of Stock'}</p>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    <p>Please check the inventory and publishing status of this product.</p>
  `;
  
  await emailService.sendEmail(subject, htmlMessage);
  
  return notify('warning', subject, message, true);
}

module.exports = {
  notify,
  notifyCriticalError,
  notifySystemStatus,
  notifyInventoryMismatch,
  getHistory
};