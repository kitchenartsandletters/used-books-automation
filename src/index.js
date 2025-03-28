// src/index.js (updated)
console.log('Loading index.js');

const app = require('./app');
const config = require('../config/environment');
const logger = require('./utils/logger');
const { startScheduledJobs } = require('./services/cronService');

const PORT = config.app.port;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Start scheduled jobs
  startScheduledJobs();
});