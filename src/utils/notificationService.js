// src/utils/notificationService.js
const nodemailer = require('nodemailer');
const logger = require('./logger');
const config = require('../../config/environment');

// Email transport configuration
const transporter = nodemailer.createTransport({
  host: config.notifications.email.host,
  port: config.notifications.email.port,
  secure: config.notifications.email.secure,
  auth: {
    user: config.notifications.email.user,
    pass: config.notifications.email.password
  }
});

/**
 * Send an email notification
 */
async function sendEmail(subject, message, recipient = config.notifications.email.defaultRecipient) {
  if (!config.notifications.email.enabled) {
    logger.info(`Email notifications disabled. Would have sent: ${subject}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: config.notifications.email.from,
      to: recipient,
      subject: `[Used Books Automation] ${subject}`,
      html: message
    });

    logger.info(`Email notification sent: ${subject}, ID: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email notification: ${error.message}`);
  }
}

/**
 * Send a critical error notification
 */
function notifyCriticalError(error, context = {}) {
  const subject = 'Critical Error Detected';
  const message = `
    <h2>Critical Error Detected</h2>
    <p><strong>Error:</strong> ${error.message}</p>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    ${context.productId ? `<p><strong>Product ID:</strong> ${context.productId}</p>` : ''}
    ${context.handle ? `<p><strong>Product Handle:</strong> ${context.handle}</p>` : ''}
    <p><strong>Stack Trace:</strong></p>
    <pre>${error.stack}</pre>
  `;
  
  return sendEmail(subject, message);
}

/**
 * Send a system status notification
 */
function notifySystemStatus(stats) {
  const subject = 'System Status Report';
  const message = `
    <h2>Used Books Automation - Daily Status Report</h2>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    <p><strong>Active Redirects:</strong> ${stats.totalRedirects}</p>
    <p><strong>Published Books:</strong> ${stats.publishedBooks}</p>
    <p><strong>Unpublished Books:</strong> ${stats.unpublishedBooks}</p>
    <p><strong>Last Scan Time:</strong> ${stats.lastScanTime}</p>
    <p><strong>Errors in Last 24h:</strong> ${stats.errorCount}</p>
  `;
  
  return sendEmail(subject, message);
}

/**
 * Send a notification for inventory mismatch
 */
function notifyInventoryMismatch(product, expected, actual) {
  const subject = 'Inventory Mismatch Detected';
  const message = `
    <h2>Inventory Mismatch Detected</h2>
    <p><strong>Product:</strong> ${product.title} (${product.handle})</p>
    <p><strong>Product ID:</strong> ${product.id}</p>
    <p><strong>Expected Status:</strong> ${expected ? 'In Stock' : 'Out of Stock'}</p>
    <p><strong>Actual Status:</strong> ${actual ? 'In Stock' : 'Out of Stock'}</p>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    <p>Please check the inventory and publishing status for this product.</p>
  `;
  
  return sendEmail(subject, message);
}

module.exports = {
  sendEmail,
  notifyCriticalError,
  notifySystemStatus,
  notifyInventoryMismatch
};