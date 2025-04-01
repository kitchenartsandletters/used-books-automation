// config/environment.js
require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  
  shopify: {
    shopUrl: process.env.SHOP_URL,
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    webhookSecret: process.env.WEBHOOK_SECRET
  },
  
  notifications: {
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      provider: sendgrid,
      apiKey: process.env.SENDGRID_API_KEY,
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO
    }
  },
  
  // New authentication configuration
  auth: {
    jwtSecret: process.env.AUTH_JWT_SECRET || 'your-default-secret-key-change-in-production',
    jwtExpiration: process.env.AUTH_JWT_EXPIRATION || '24h',
    cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
    cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    sessionSecret: process.env.SESSION_SECRET || 'session-secret-change-in-production'
  }
};