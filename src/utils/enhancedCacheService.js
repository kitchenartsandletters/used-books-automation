// src/utils/enhancedCacheService.js
const logger = require('./logger');

/**
 * Enhanced in-memory cache with expiration and versioning
 * Designed to improve dashboard performance
 */
class EnhancedCache {
  constructor() {
    this.cache = {};
    // Default TTL settings (in seconds)
    this.ttlSettings = {
      products: 5 * 60, // 5 minutes for product data
      inventory: 2 * 60, // 2 minutes for inventory data
      redirects: 5 * 60, // 5 minutes for redirects
      stats: 5 * 60, // 5 minutes for stats
      logs: 1 * 60 // 1 minute for logs
    };
    // Track versions to allow partial updates
    this.versions = {};
  }
  
  /**
   * Set a value in the cache with customizable TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {string} category - Category for TTL (products, inventory, etc.)
   * @param {boolean} incrementVersion - Whether to increment version number
   */
  set(key, value, category = 'default', incrementVersion = true) {
    const now = Date.now();
    const ttlSeconds = this.ttlSettings[category] || 5 * 60; // Default 5 min
    
    this.cache[key] = {
      value,
      expiry: now + (ttlSeconds * 1000)
    };
    
    // Increment version if requested
    if (incrementVersion) {
      if (!this.versions[category]) {
        this.versions[category] = 1;
      } else {
        this.versions[category]++;
      }
    }
    
    logger.debug(`Cache: Set ${key} (${category}, v${this.versions[category] || 1})`);
  }
  
  /**
   * Set a value with specific TTL override
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {string} category - Category for version tracking
   * @param {number} customTTL - Custom TTL in seconds (overrides category default)
   */
  setWithCustomTTL(key, value, category = 'default', customTTL = null) {
    const now = Date.now();
    const ttlSeconds = customTTL || this.ttlSettings[category] || 5 * 60; // Use custom or default
    
    this.cache[key] = {
      value,
      expiry: now + (ttlSeconds * 1000)
    };
    
    // Increment version
    if (!this.versions[category]) {
      this.versions[category] = 1;
    } else {
      this.versions[category]++;
    }
    
    logger.debug(`Cache: Set ${key} with custom TTL ${ttlSeconds}s (${category}, v${this.versions[category]})`);
  }
  
  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @param {boolean} resetExpiryOnAccess - Whether to reset expiry on access
   * @returns {any} Cached value or null if expired/missing
   */
  get(key, resetExpiryOnAccess = false) {
    const now = Date.now();
    const item = this.cache[key];
    
    // Return null if item doesn't exist or is expired
    if (!item || item.expiry < now) {
      if (item) {
        // Delete expired item
        delete this.cache[key];
        logger.debug(`Cache: ${key} expired`);
      }
      return null;
    }
    
    // Reset expiry if requested
    if (resetExpiryOnAccess) {
      // Find category from key
      const category = key.split(':')[0] || 'default';
      const ttlSeconds = this.ttlSettings[category] || 5 * 60;
      item.expiry = now + (ttlSeconds * 1000);
      logger.debug(`Cache: Extended expiry for ${key}`);
    }
    
    logger.debug(`Cache: Hit ${key}`);
    return item.value;
  }
  
  /**
   * Get cache version for a category
   * @param {string} category - Category to get version for
   * @returns {number} Version number
   */
  getVersion(category) {
    return this.versions[category] || 1;
  }
  
  /**
   * Check if cache is fresh for a category compared to a version
   * @param {string} category - Category to check
   * @param {number} clientVersion - Client's current version
   * @returns {boolean} Whether client has latest version
   */
  isFresh(category, clientVersion) {
    const currentVersion = this.getVersion(category);
    return clientVersion === currentVersion;
  }
  
  /**
   * Delete a value from the cache
   * @param {string} key - Key to delete
   */
  delete(key) {
    delete this.cache[key];
    logger.debug(`Cache: Deleted ${key}`);
  }
  
  /**
   * Delete cache entries by prefix pattern
   * @param {string} prefix - Key prefix to match
   * @param {string} category - Category to update version for (optional)
   */
  deleteByPrefix(prefix, category = null) {
    const keysToDelete = Object.keys(this.cache).filter(key => key.startsWith(prefix));
    
    keysToDelete.forEach(key => {
      delete this.cache[key];
    });
    
    // Increment version for category if provided
    if (category && this.versions[category]) {
      this.versions[category]++;
    }
    
    logger.debug(`Cache: Deleted ${keysToDelete.length} items with prefix ${prefix}`);
    return keysToDelete.length;
  }
  
  /**
   * Clear all items from a category
   * @param {string} category - Category to clear
   */
  clearCategory(category) {
    const keysToDelete = Object.keys(this.cache).filter(key => 
      key.startsWith(`${category}:`)
    );
    
    keysToDelete.forEach(key => {
      delete this.cache[key];
    });
    
    // Increment version for category
    if (!this.versions[category]) {
      this.versions[category] = 1;
    } else {
      this.versions[category]++;
    }
    
    logger.info(`Cache: Cleared ${keysToDelete.length} items from category ${category}`);
  }
  
  /**
   * Clear all items from the cache
   */
  clear() {
    this.cache = {};
    // Increment all versions
    Object.keys(this.versions).forEach(category => {
      this.versions[category]++;
    });
    logger.info('Cache: Cleared all items');
  }
  
  /**
   * Add or update a specific subset of data
   * @param {string} key - Cache key
   * @param {string} property - Property path to update (dot notation)
   * @param {any} value - Value to set
   * @param {string} category - Category for version tracking
   */
  updateProperty(key, property, value, category = 'default') {
    // Get existing cached item
    const item = this.get(key);
    
    if (!item) {
      // If item doesn't exist, create a new object with the property
      const newItem = {};
      const props = property.split('.');
      let current = newItem;
      
      // Build the nested property path
      for (let i = 0; i < props.length - 1; i++) {
        current[props[i]] = {};
        current = current[props[i]];
      }
      
      // Set the value at the leaf
      current[props[props.length - 1]] = value;
      
      // Store the new item
      this.set(key, newItem, category);
    } else {
      // If item exists, update the property
      const props = property.split('.');
      let current = item;
      
      // Navigate to the property's parent
      for (let i = 0; i < props.length - 1; i++) {
        if (!current[props[i]]) {
          current[props[i]] = {};
        }
        current = current[props[i]];
      }
      
      // Update the property value
      current[props[props.length - 1]] = value;
      
      // Store the updated item without changing expiry
      const now = Date.now();
      const ttlSeconds = this.ttlSettings[category] || 5 * 60;
      
      this.cache[key] = {
        value: item,
        expiry: now + (ttlSeconds * 1000)
      };
      
      // Increment version
      if (!this.versions[category]) {
        this.versions[category] = 1;
      } else {
        this.versions[category]++;
      }
      
      logger.debug(`Cache: Updated property ${property} of ${key} (${category}, v${this.versions[category]})`);
    }
  }
}

// Create cache instances
const dashboardCache = new EnhancedCache();
const apiCache = new EnhancedCache();

module.exports = {
  dashboardCache,
  apiCache
};