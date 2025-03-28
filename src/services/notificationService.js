// src/services/notificationService.js
const logger = require('../utils/logger');
const nodemailer = require('nodemailer'); // You would need to install this

class NotificationService {
  constructor() {
    // Configure transports based on environment variables
    this.emailEnabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';
    this.slackEnabled = process.env.ENABLE_SLACK_NOTIFICATIONS === 'true';
    
    if (this.emailEnabled) {
      this.emailTransport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
    
    if (this.slackEnabled) {
      // Configure Slack webhook (you would need to install a Slack client)
      this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    }
  }
  
  async sendNotification(level, message, details = {}) {
    logger.info(`Sending ${level} notification: ${message}`);
    
    if (level === 'critical' && this.emailEnabled) {
      await this.sendEmail(message, details);
    }
    
    if (this.slackEnabled) {
      await this.sendSlack(level, message, details);
    }
  }
  
  async sendEmail(subject, details) {
    try {
      const recipients = process.env.EMAIL_RECIPIENTS.split(',');
      
      await this.emailTransport.sendMail({
        from: process.env.EMAIL_FROM,
        to: recipients.join(', '),
        subject: `[ALERT] ${subject}`,
        text: `
          Alert: ${subject}
          
          Details:
          ${JSON.stringify(details, null, 2)}
          
          Time: ${new Date().toISOString()}
        `,
        html: `
          <h2>Alert: ${subject}</h2>
          <p><strong>Details:</strong></p>
          <pre>${JSON.stringify(details, null, 2)}</pre>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        `
      });
      
      logger.info('Email notification sent successfully');
    } catch (error) {
      logger.error(`Failed to send email notification: ${error.message}`);
    }
  }
  
  async sendSlack(level, message, details) {
    try {
      // Implementation would depend on your Slack client
      // This is a placeholder
      const response = await fetch(this.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `*${level.toUpperCase()}*: ${message}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${level.toUpperCase()}*: ${message}`
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "```" + JSON.stringify(details, null, 2) + "```"
              }
            }
          ]
        })
      });
      
      logger.info('Slack notification sent successfully');
    } catch (error) {
      logger.error(`Failed to send Slack notification: ${error.message}`);
    }
  }
}

module.exports = new NotificationService();