// src/utils/shopifyClient.js
console.log('Loading shopifyClient.js');

const config = require('../../config/environment');
const logger = require('./logger');
const crypto = require('crypto');
const { apiCache } = require('./cacheService');

console.log('ShopifyClient loading with config:', {
    shopUrl: config.shopify.shopUrl,
    hasAccessToken: !!config.shopify.accessToken,
    hasApiKey: !!config.shopify.apiKey,
    hasApiSecret: !!config.shopify.apiSecret,
    hasWebhookSecret: !!config.shopify.webhookSecret
  });


// Helper function to determine if a request is cacheable
function isCacheableRequest(path) {
    // Only cache specific path patterns
    const cacheablePatterns = [
      /^products\/.*\.json$/,      // Product details
      /^inventory_levels\.json/,   // Inventory levels
      /^redirects\.json/,          // Redirects
    ];
    
    return cacheablePatterns.some(pattern => pattern.test(path));
  }

const shopifyClient = {
    // Update the get method in shopifyClient.js to handle paths correctly
    get: async function(path, params = {}) {
        try {
        // Check if path is an object and convert it properly
        if (typeof path === 'object') {
            console.error('Path should be a string, not an object:', path);
            path = 'products.json'; // Default fallback
        }
        
        // Check if request is cacheable
        const cacheable = isCacheableRequest(path);

        // Generate cache key if cacheable
        const cacheKey = cacheable ? 
        `shopify:${path}:${JSON.stringify(params || {})}` : null;

        // Try to get from cache if appropriate
        if (cacheable && !skipCache && cacheKey) {
            const cachedResponse = apiCache.get(cacheKey);
            if (cachedResponse) {
                console.log(`Cache hit for: ${path}`);
                return cachedResponse;
            }
        }

        // Ensure we have the complete shop URL
        const shopUrl = config.shopify.shopUrl;
        if (!shopUrl) {
            throw new Error('Shop URL is not defined in config');
        }
        
        // Create a clean URL without protocol
        const cleanUrl = shopUrl.replace(/^https?:\/\//, '');
        
        // Build the full URL
        const url = new URL(`https://${cleanUrl}/admin/api/2025-01/${path}`);
        
        // Add query parameters
        if (params && params.query) {
            Object.entries(params.query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
            });
        }
        
        console.log(`Making GET request to: ${url.toString()}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': config.shopify.accessToken
            }
        });
        
        // Log the status code
        console.log(`Response status: ${response.status}`);

        // Handle rate limiting
        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
            console.log(`Rate limited by Shopify API. Waiting ${retryAfter} seconds...`);
            
            // Wait for the specified time
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            
            // Retry the request
            return this.get(path, params, skipCache);
        }
        
        // Check if response is ok
        if (!response.ok) {
            const text = await response.text();
            console.error(`Error response: ${text}`);
            throw new Error(`API returned status ${response.status}: ${text}`);
        }
        
        const responseData = await response.json();
        return {
            body: responseData,
            status: response.status,
            headers: response.headers
        };

        // Cache the result if appropriate
        if (cacheable && !skipCache && cacheKey) {
            apiCache.set(cacheKey, result);
        }

            return result;
        } catch (error) {
        logger.error(`Error in GET request to ${path}: ${error.message}`);
        throw error;
        }
    },
  
    // Update POST method to handle rate limiting
    post: async function(path, data = {}) {
        try {
          if (typeof path === 'object') {
            console.error('Path should be a string, not an object:', path);
            path = ''; // Default fallback
            return { status: 400, body: {} }; // Return an error status
          }
          
          const url = new URL(`https://${config.shopify.shopUrl.replace(/^https?:\/\//, '')}/admin/api/2025-01/${path}`);
          
          console.log(`Making POST request to: ${url.toString()}`);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': config.shopify.accessToken
            },
            body: JSON.stringify(data)
          });
          
          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
            console.log(`Rate limited by Shopify API. Waiting ${retryAfter} seconds...`);
            
            // Wait for the specified time
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            
            // Retry the request
            return this.post(path, data);
          }
          
          // Check if response is ok
          if (!response.ok) {
            const text = await response.text();
            console.error(`Error response: ${text}`);
            throw new Error(`API returned status ${response.status}: ${text}`);
          }
          
          const responseData = await response.json();
          
          // Invalidate related cache entries if this was a modification operation
          if (path.includes('products') || path.includes('inventory')) {
            apiCache.deleteByPrefix('shopify:products');
            apiCache.deleteByPrefix('shopify:inventory');
          } else if (path.includes('redirects')) {
            apiCache.deleteByPrefix('shopify:redirects');
          }
          
          return {
            body: responseData,
            status: response.status
          };
        } catch (error) {
          logger.error(`Error in POST request to ${path}: ${error.message}`);
          throw error;
        }
    },
    
    // Update PUT method to handle rate limiting
    put: async function(path, data = {}) {
        try {
        // Check if path is an object and convert it properly
        if (typeof path === 'object') {
            console.error('Path should be a string, not an object:', path);
            path = 'products.json'; // Default fallback
        }
        
        const url = new URL(`https://${config.shopify.shopUrl.replace(/^https?:\/\//, '')}/admin/api/2025-01/${path}`);
        
        console.log(`Making PUT request to: ${url.toString()}`);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': config.shopify.accessToken
            },
            body: JSON.stringify(data)
        });
        
        // Handle rate limiting
        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
            console.log(`Rate limited by Shopify API. Waiting ${retryAfter} seconds...`);
            
            // Wait for the specified time
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            
            // Retry the request
            return this.put(path, data);
        }
        
        // Check if response is ok
        if (!response.ok) {
            const text = await response.text();
            console.error(`Error response: ${text}`);
            throw new Error(`API returned status ${response.status}: ${text}`);
        }
        
        const responseData = await response.json();
        
        // Invalidate related cache entries
        if (path.includes('products')) {
            apiCache.deleteByPrefix('shopify:products');
        } else if (path.includes('inventory')) {
            apiCache.deleteByPrefix('shopify:inventory');
        }
        
        return {
            body: responseData,
            status: response.status
        };
        } catch (error) {
        logger.error(`Error in PUT request to ${path}: ${error.message}`);
        throw error;
        }
    },
    
    // Update DELETE method to handle rate limiting and cache invalidation
    delete: async function(path) {
        try {
          if (typeof path === 'object') {
            console.error('Path should be a string, not an object:', path);
            path = ''; // Default fallback
            return { status: 400 }; // Return an error status
          }
          
          const url = new URL(`https://${config.shopify.shopUrl.replace(/^https?:\/\//, '')}/admin/api/2025-01/${path}`);
          
          console.log(`Making DELETE request to: ${url.toString()}`);
          
          const response = await fetch(url, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': config.shopify.accessToken
            }
          });
          
          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
            console.log(`Rate limited by Shopify API. Waiting ${retryAfter} seconds...`);
            
            // Wait for the specified time
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            
            // Retry the request
            return this.delete(path);
          }
          
          // Invalidate related cache entries
          if (path.includes('products')) {
            apiCache.deleteByPrefix('shopify:products');
          } else if (path.includes('redirects')) {
            apiCache.deleteByPrefix('shopify:redirects');
          }
          
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