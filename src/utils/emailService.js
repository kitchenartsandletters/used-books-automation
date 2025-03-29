// src/utils/emailService.js
const sgMail = require('@sendgrid/mail');
const config = require('../../config/environment');
const logger = require('./logger');

// Initialize SendGrid with API key
if (config.notifications.email.enabled && config.notifications.email.apiKey) {
  sgMail.setApiKey(config.notifications.email.apiKey);
  logger.info('SendGrid initialized for email notifications');
} else {
  logger.warn('SendGrid not initialized: email notifications disabled or API key missing');
}

/**
 * Send an email using SendGrid
 */
async function sendEmail(subject, message, recipient = null) {
  // Check if email notifications are enabled
  if (!config.notifications.email.enabled) {
    logger.info(`Email notifications disabled. Would have sent: ${subject}`);
    return false;
  }
  
  // Check if API key is set
  if (!config.notifications.email.apiKey) {
    logger.warn(`SendGrid API key not set. Cannot send email: ${subject}`);
    return false;
  }
  
  try {
    const msg = {
      to: recipient || config.notifications.email.to,
      from: config.notifications.email.from,
      subject: `[Used Books Automation] ${subject}`,
      html: message,
    };
    
    const response = await sgMail.send(msg);
    logger.info(`Email sent: ${subject} to ${msg.to}`);
    return true;
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    
    // Log more details if available
    if (error.response) {
      logger.error(`SendGrid error details: ${JSON.stringify(error.response.body)}`);
    }
    
    return false;
  }
}

module.exports = {
  sendEmail
};