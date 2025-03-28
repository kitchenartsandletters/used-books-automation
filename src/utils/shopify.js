// src/utils/shopify.js
const { shopifyApi, ApiVersion, BillingInterval } = require('@shopify/shopify-api');
const { restResources } = require('@shopify/shopify-api/rest/admin/2025-01');
const { shopifyApp } = require('@shopify/shopify-app-express');
const config = require('../../config/environment');
const logger = require('./logger');

// Initialize Shopify API client with Node adapter
const shopify = shopifyApi({
  apiKey: config.shopify.apiKey,
  apiSecretKey: config.shopify.apiSecret,
  scopes: ['read_products', 'write_products', 'read_inventory', 'write_inventory'],
  hostName: config.shopify.shopUrl.replace(/^https?:\/\//, ''),
  apiVersion: ApiVersion.January2025,
  isEmbeddedApp: false,
  // Add Node adapter
  restResources,
});

// Create a simpler REST client for our needs
const adminApiClient = {
  get: async function(path, params = {}) {
    const url = new URL(`https://${config.shopify.shopUrl.replace(/^https?:\/\//, '')}/admin/api/2025-01/${path}`);
    
    // Add query parameters
    if (params.query) {
      Object.entries(params.query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': config.shopify.accessToken
      }
    });
    
    return {
      body: await response.json(),
      status: response.status
    };
  },
  
  post: async function(path, data = {}) {
    const url = new URL(`https://${config.shopify.shopUrl.replace(/^https?:\/\//, '')}/admin/api/2025-01/${path}`);
    
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
  },
  
  put: async function(path, data = {}) {
    const url = new URL(`https://${config.shopify.shopUrl.replace(/^https?:\/\//, '')}/admin/api/2025-01/${path}`);
    
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
  },
  
  delete: async function(path) {
    const url = new URL(`https://${config.shopify.shopUrl.replace(/^https?:\/\//, '')}/admin/api/2025-01/${path}`);
    
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
  }
};

module.exports = { shopify, client: adminApiClient };