// src/utils/backupService.js
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const shopifyClient = require('./shopifyClient');
const notificationService = require('.notificationService');

// Set up backup directory
const BACKUP_DIR = path.join(__dirname, '../../backups');

/**
 * Make sure backup directory exists
 */
async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    return true;
  } catch (error) {
    logger.error(`Failed to create backup directory: ${error.message}`);
    return false;
  }
}

/**
 * Get all redirects related to used books
 */
async function getAllUsedBookRedirects() {
  try {
    // Get all redirects from Shopify (with limit)
    const response = await shopifyClient.get('redirects.json', {
      query: { limit: 250 }
    });
    
    if (!response.body || !response.body.redirects) {
      return [];
    }
    
    // Filter to only include redirects for used books
    const usedBookRedirects = response.body.redirects.filter(redirect => 
      redirect.path && 
      redirect.path.includes('/products/') && 
      redirect.path.includes('-used-')
    );
    
    return usedBookRedirects;
  } catch (error) {
    logger.error(`Error getting used book redirects: ${error.message}`);
    return [];
  }
}

/**
 * Create a backup of all redirects
 */
async function backupRedirects() {
  try {
    // Ensure backup directory exists
    if (!(await ensureBackupDir())) {
      throw new Error('Could not create backup directory');
    }
    
    // Get all used book redirects
    const redirects = await getAllUsedBookRedirects();
    
    if (redirects.length === 0) {
      logger.info('No redirects to backup');
      return null;
    }
    
    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `redirects-backup-${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    // Write to file
    await fs.writeFile(filePath, JSON.stringify(redirects, null, 2));
    
    logger.info(`Backup created: ${filePath} with ${redirects.length} redirects`);
    notificationService.notify('info', 'Backup Created', 
      `Created backup with ${redirects.length} redirects`);
    
    return {
      path: filePath,
      count: redirects.length
    };
  } catch (error) {
    logger.error(`Error creating backup: ${error.message}`);
    notificationService.notifyCriticalError(error, { context: 'Backup creation' });
    return null;
  }
}

/**
 * Get list of all backups
 */
async function listBackups() {
  try {
    if (!(await ensureBackupDir())) {
      return [];
    }
    
    const files = await fs.readdir(BACKUP_DIR);
    
    // Filter and sort backup files
    const backupFiles = files
      .filter(file => file.startsWith('redirects-backup-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Newest first
    
    return backupFiles.map(file => ({
      filename: file,
      path: path.join(BACKUP_DIR, file),
      timestamp: file.replace('redirects-backup-', '').replace('.json', '')
    }));
  } catch (error) {
    logger.error(`Error listing backups: ${error.message}`);
    return [];
  }
}

/**
 * Restore redirects from a backup
 */
async function restoreFromBackup(backupFilename) {
  try {
    if (!backupFilename) {
      throw new Error('No backup filename provided');
    }
    
    const filePath = path.join(BACKUP_DIR, backupFilename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (e) {
      throw new Error(`Backup file not found: ${backupFilename}`);
    }
    
    // Read and parse the backup file
    const data = await fs.readFile(filePath, 'utf8');
    const redirects = JSON.parse(data);
    
    if (!Array.isArray(redirects) || redirects.length === 0) {
      throw new Error('Invalid or empty backup file');
    }
    
    const results = {
      total: redirects.length,
      restored: 0,
      skipped: 0,
      failed: 0
    };
    
    // Process each redirect
    for (const redirect of redirects) {
      try {
        // Check if redirect already exists
        const existingRedirect = await shopifyClient.get('redirects.json', {
          query: { path: redirect.path }
        });
        
        if (existingRedirect.body && 
            existingRedirect.body.redirects && 
            existingRedirect.body.redirects.length > 0) {
          // Skip existing redirects
          results.skipped++;
          continue;
        }
        
        // Create the redirect
        await shopifyClient.post('redirects.json', {
          redirect: {
            path: redirect.path,
            target: redirect.target,
            redirect_type: redirect.redirect_type || '302'
          }
        });
        
        results.restored++;
      } catch (error) {
        logger.error(`Failed to restore redirect ${redirect.id}: ${error.message}`);
        results.failed++;
      }
    }
    
    logger.info(`Restore complete: ${results.restored} created, ${results.skipped} skipped, ${results.failed} failed`);
    notificationService.notify('info', 'Backup Restored', 
      `Restored ${results.restored} redirects from backup`);
    
    return results;
  } catch (error) {
    logger.error(`Error restoring from backup: ${error.message}`);
    notificationService.notifyCriticalError(error, { context: 'Backup restoration' });
    return null;
  }
}

module.exports = {
  backupRedirects,
  listBackups,
  restoreFromBackup,
  getAllUsedBookRedirects
};