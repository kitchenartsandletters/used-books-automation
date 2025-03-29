// config/environment.js
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
      enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      from: process.env.EMAIL_FROM || 'used-books-automation@example.com',
      defaultRecipient: process.env.EMAIL_RECIPIENT
    }
  }
};