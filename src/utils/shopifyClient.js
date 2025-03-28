// src/utils/shopifyClient.js
console.log('Loading shopifyClient.js');

const config = require('../../config/environment');
const logger = require('./logger');
const crypto = require('crypto');

console.log('ShopifyClient loading with config:', {
    shopUrl: config.shopify.shopUrl,
    hasAccessToken: !!config.shopify.accessToken,
    hasApiKey: !!config.shopify.apiKey,
    hasApiSecret: !!config.shopify.apiSecret,
    hasWebhookSecret: !!config.shopify.webhookSecret
  });

const shopifyClient = {
get: async function(path, params = {}) {
    const url = new URL(`https://${config.shopify.shopUrl.replace(/^https?:\/\//, '')}/admin/api/2025-01/${path}`);
    
    // Add query parameters
    if (params && params.query) {
      Object.entries(params.query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    console.log(`Making GET request to: ${url.toString()}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': config.shopify.accessToken
        }
      });
      
      // Log status code
      console.log(`Response status: ${response.status}`);
      
      // Check if response is ok
      if (!response.ok) {
        const text = await response.text();
        console.error(`Error response: ${text}`);
        throw new Error(`API returned status ${response.status}: ${text}`);
      }
      
      const responseData = await response.json();
      return {
        body: responseData,
        status: response.status
      };
    } catch (error) {
      logger.error(`Error in GET request to ${path}: ${error.message}`);
      throw error;
    }
  },
  
  post: async function(path, data = {}) {
    const url = new URL(`https://${config.shopify.shopUrl.replace(/^https?:\/\//, '')}/admin/api/2025-01/${path}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': config.shopify.accessToken
        },
        body: JSON.stringify(data)
      });
      
      return {
        body: await response.json(),
        status: response.status
      };
    } catch (error) {
      logger.error(`Error in POST request to ${path}: ${error.message}`);
      throw error;
    }
  },
  
  put: async function(path, data = {}) {
    const url = new URL(`https://${config.shopify.shopUrl.replace(/^https?:\/\//, '')}/admin/api/2025-01/${path}`);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': config.shopify.accessToken
        },
        body: JSON.stringify(data)
      });
      
      return {
        body: await response.json(),
        status: response.status
      };
    } catch (error) {
      logger.error(`Error in PUT request to ${path}: ${error.message}`);
      throw error;
    }
  },
  
  delete: async function(path) {
    const url = new URL(`https://${config.shopify.shopUrl.replace(/^https?:\/\//, '')}/admin/api/2025-01/${path}`);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': config.shopify.accessToken
        }
      });
      
      return {
        status: response.status
      };
    } catch (error) {
      logger.error(`Error in DELETE request to ${path}: ${error.message}`);
      throw error;
    }
  },
  
  verifyWebhook: function(hmac, data) {
    const calculatedHmac = crypto
      .createHmac('sha256', config.shopify.webhookSecret)
      .update(data, 'utf8')
      .digest('base64');
    
    return calculatedHmac === hmac;
  }
};

module.exports = shopifyClient;