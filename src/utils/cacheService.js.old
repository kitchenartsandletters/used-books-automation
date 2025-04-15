// src/utils/cacheService.js
const logger = require('./logger');

/**
 * Simple in-memory cache with expiration
 */
class Cache {
  constructor(ttlSeconds = 300) { // Default TTL: 5 minutes
    this.cache = {};
    this.ttlSeconds = ttlSeconds;
  }
  
  /**
   * Set a value in the cache
   */
  set(key, value) {
    const now = Date.now();
    
    this.cache[key] = {
      value,
      expiry: now + (this.ttlSeconds * 1000)
    };
    
    logger.info(`Cache: Set ${key}`);
  }
  
  /**
   * Get a value from the cache
   */
  get(key) {
    const now = Date.now();
    const item = this.cache[key];
    
    // Return null if item doesn't exist or is expired
    if (!item || item.expiry < now) {
      if (item) {
        // Delete expired item
        delete this.cache[key];
        logger.info(`Cache: ${key} expired`);
      }
      return null;
    }
    
    logger.info(`Cache: Hit ${key}`);
    return item.value;
  }
  
  /**
   * Delete a value from the cache
   */
  delete(key) {
    delete this.cache[key];
    logger.info(`Cache: Deleted ${key}`);
  }
  
  /**
   * Clear all items from the cache
   */
  clear() {
    this.cache = {};
    logger.info('Cache: Cleared all items');
  }
  
  /**
   * Get all keys that match a prefix
   */
  getKeysByPrefix(prefix) {
    return Object.keys(this.cache).filter(key => key.startsWith(prefix));
  }
  
  /**
   * Delete all items with keys matching a prefix
   */
  deleteByPrefix(prefix) {
    const keys = this.getKeysByPrefix(prefix);
    let count = 0;
    
    keys.forEach(key => {
      this.delete(key);
      count++;
    });
    
    logger.info(`Cache: Deleted ${count} items with prefix ${prefix}`);
    return count;
  }
}

// Create cache instance
const apiCache = new Cache(300); // 5 minutes cache

module.exports = {
  apiCache
};