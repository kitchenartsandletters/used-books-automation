// config/environment.js (updated for SendGrid)
require('dotenv').config();

module.exports = {
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    shopUrl: process.env.SHOP_URL,
    webhookSecret: process.env.WEBHOOK_SECRET,
  },
  app: {
    port: process.env.PORT || 3000,
  },
  notifications: {
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      provider: 'sendgrid',
      apiKey: process.env.SENDGRID_API_KEY,
      from: process.env.EMAIL_FROM || 'used-books-automation@example.com',
      to: process.env.EMAIL_TO || 'admin@example.com',
    }
  }
};