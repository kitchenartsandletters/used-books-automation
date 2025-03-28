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
  }
};