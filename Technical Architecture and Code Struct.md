# Technical Architecture and Code Structure

This document provides detailed technical guidance for implementing the admin dashboard and cloud automation for the Used Books Automation system.

## Admin Dashboard Architecture

### Directory Structure

```
src/
├── views/                  # Dashboard view templates
│   ├── layouts/            # Layout templates
│   │   └── main.ejs        # Main layout template
│   ├── partials/           # Reusable view components
│   │   ├── header.ejs      # Header component
│   │   ├── footer.ejs      # Footer component
│   │   ├── sidebar.ejs     # Sidebar navigation
│   │   └── alerts.ejs      # Flash message/alert component
│   ├── dashboard/          # Dashboard view templates
│   │   ├── index.ejs       # Dashboard home page
│   │   ├── books.ejs       # Used books management page
│   │   ├── redirects.ejs   # Redirects management page
│   │   ├── logs.ejs        # System logs page
│   │   └── settings.ejs    # Settings page
│   ├── auth/               # Authentication view templates
│   │   ├── login.ejs       # Login page
│   │   └── register.ejs    # User registration page
│   └── error.ejs           # Error page
├── public/                 # Static assets
│   ├── css/                # CSS files
│   ├── js/                 # Client-side JavaScript
│   └── img/                # Images
├── routes/                 # Route handlers
│   ├── admin.js            # Admin dashboard routes (expanded)
│   ├── auth.js             # Authentication routes
│   ├── api.js              # API routes (existing)
│   └── webhooks.js         # Webhook routes (existing)
├── controllers/            # Controller logic
│   ├── dashboardController.js  # Dashboard controller (expanded)
│   ├── authController.js       # Authentication controller
│   ├── booksController.js      # Books management controller
│   ├── redirectsController.js  # Redirects management controller
│   └── settingsController.js   # Settings controller
├── middleware/             # Custom middleware
│   ├── auth.js             # Authentication middleware
│   ├── errorHandler.js     # Error handling middleware
│   └── flash.js            # Flash message middleware
└── utils/                  # Utility functions (existing)
```

### Authentication Implementation

Create a simple authentication system using JSON Web Tokens (JWT):

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../../config/environment');

const authMiddleware = (req, res, next) => {
  // Check for token in cookie
  const token = req.cookies.token;
  
  if (!token) {
    return res.redirect('/auth/`login');
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.redirect('/auth/login');
  }
};

module.exports = authMiddleware;
```

```javascript
// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../../config/environment');

// Hard-coded users for simplicity - replace with database in production
const users = [
  {
    id: 1,
    username: 'admin',
    // Hashed password for 'admin123'
    passwordHash: '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  }
];

const login = async (req, res) => {
  const { username, password } = req.body;
  
  // Find user
  const user = users.find(u => u.username === username);
  if (!user) {
    req.flash('error', 'Invalid credentials');
    return res.redirect('/auth/login');
  }
  
  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    req.flash('error', 'Invalid credentials');
    return res.redirect('/auth/login');
  }
  
  // Create token
  const token = jwt.sign(
    { id: user.id, username: user.username },
    config.auth.jwtSecret,
    { expiresIn: '1d' }
  );
  
  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });
  
  res.redirect('/admin');
};

module.exports = {
  login,
  logout: (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/login');
  }
};
```

### Dashboard Home Implementation

The dashboard home page will show system stats and recent activity:

```javascript
// src/controllers/dashboardController.js (expanded)
const shopifyClient = require('../utils/shopifyClient');
const productService = require('../services/productService');
const redirectService = require('../services/redirectService');
const cronService = require('../services/cronService');
const backupService = require('../utils/backupService');
const notificationService = require('../utils/notificationService');
const logger = require('../utils/logger');

// Get dashboard home page with statistics
async function getDashboardHome(req, res) {
  try {
    // Get system stats
    const stats = await getSystemStats();
    
    // Get recent notifications/logs
    const notifications = notificationService.getHistory(10);
    
    // Get recent backups
    const backups = await backupService.listBackups();
    
    // Get activity data for charts
    const activityData = await getActivityData();
    
    res.render('dashboard/index', {
      title: 'Dashboard - Used Books Automation',
      stats,
      notifications,
      backups,
      activityData,
      user: req.user
    });
  } catch (error) {
    logger.error(`Error rendering dashboard: ${error.message}`);
    req.flash('error', 'Failed to load dashboard data');
    res.render('dashboard/index', {
      title: 'Dashboard - Used Books Automation',
      stats: {},
      notifications: [],
      backups: [],
      activityData: {},
      user: req.user
    });
  }
}

// Get detailed system statistics
async function getSystemStats() {
  try {
    // Get all active redirects
    const redirects = await redirectService.getAllUsedBookRedirects();
    
    // Get used book products
    const usedBooks = await cronService.getAllUsedBooks();
    
    // Calculate stats
    const publishedBooks = usedBooks.filter(p => p.published_at !== null);
    const outOfStockBooks = usedBooks.filter(p => {
      // A book might be out of stock if all variants have zero inventory
      return p.variants.every(v => v.inventory_quantity === 0);
    });
    
    // Return stats object
    return {
      totalBooks: usedBooks.length,
      publishedBooks: publishedBooks.length,
      unpublishedBooks: usedBooks.length - publishedBooks.length,
      outOfStockBooks: outOfStockBooks.length,
      totalRedirects: redirects.length,
      lastScanTime: global.lastScanTime || 'Never',
      systemStatus: global.cronJobsActive ? 'Active' : 'Inactive'
    };
  } catch (error) {
    logger.error(`Error getting system stats: ${error.message}`);
    throw error;
  }
}

// Get activity data for charts
async function getActivityData() {
  // This would be expanded to get historical data for charts
  return {
    // Sample data structure - would be populated from real data in production
    inventory: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      data: [12, 15, 18, 14, 20]
    },
    redirects: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      data: [25, 20, 22, 18, 16]
    }
  };
}

module.exports = {
  getDashboardHome,
  // ... other dashboard methods
};
```

### Used Books Management Page

```javascript
// src/controllers/booksController.js
const productService = require('../services/productService');
const inventoryService = require('../services/inventoryService');
const usedBookManager = require('../services/usedBookManager');
const logger = require('../utils/logger');

// Get all used books with pagination
async function getUsedBooks(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const searchTerm = req.query.search || '';
    const filter = req.query.filter || 'all'; // 'all', 'published', 'unpublished', 'in-stock', 'out-of-stock'
    
    // Get books from Shopify
    const usedBooks = await productService.getAllUsedBooks(page, limit, searchTerm, filter);
    
    // Get total count for pagination
    const totalCount = await productService.getUsedBooksCount(searchTerm, filter);
    
    // Calculate pagination values
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    res.render('dashboard/books', {
      title: 'Used Books Management',
      books: usedBooks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      searchTerm,
      filter,
      user: req.user
    });
  } catch (error) {
    logger.error(`Error getting used books: ${error.message}`);
    req.flash('error', 'Failed to load used books');
    res.render('dashboard/books', {
      title: 'Used Books Management',
      books: [],
      pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
      searchTerm: '',
      filter: 'all',
      user: req.user
    });
  }
}

// Other controller methods for book management...

module.exports = {
  getUsedBooks,
  // Other methods...
};
```

## Cloud Automation Implementation

### Railway Configuration (railway.json)

Update the railway.json file with more detailed configuration:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5,
    "autoscaling": {
      "min": 1,
      "max": 3,
      "targetMemoryPercent": 80,
      "targetCpuPercent": 80,
      "scaleDownStabilizationWindowSeconds": 300,
      "scaleUpStabilizationWindowSeconds": 60
    },
    "envVarGroups": [
      {
        "name": "shopify-credentials",
        "envVars": [
          {"name": "SHOPIFY_API_KEY", "value": "FROM_RAILWAY"},
          {"name": "SHOPIFY_API_SECRET", "value": "FROM_RAILWAY"},
          {"name": "SHOPIFY_ACCESS_TOKEN", "value": "FROM_RAILWAY"},
          {"name": "SHOP_URL", "value": "FROM_RAILWAY"},
          {"name": "WEBHOOK_SECRET", "value": "FROM_RAILWAY"}
        ]
      },
      {
        "name": "notification-settings",
        "envVars": [
          {"name": "EMAIL_ENABLED", "value": "true"},
          {"name": "SENDGRID_API_KEY", "value": "FROM_RAILWAY"},
          {"name": "EMAIL_FROM", "value": "FROM_RAILWAY"},
          {"name": "EMAIL_TO", "value": "FROM_RAILWAY"}
        ]
      },
      {
        "name": "app-settings",
        "envVars": [
          {"name": "NODE_ENV", "value": "production"},
          {"name": "LOG_LEVEL", "value": "info"},
          {"name": "AUTH_JWT_SECRET", "value": "FROM_RAILWAY"}
        ]
      }
    ]
  }
}
```

### GitHub Actions Workflow

Create a GitHub Actions workflow for continuous integration and deployment:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, production ]
  pull_request:
    branches: [ main, production ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '14'
      - name: Install dependencies
        run: npm ci
      - name: Lint code
        run: npm run lint
      - name: Run tests
        run: npm test

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Railway CLI
        run: npm i -g @railway/cli
      - name: Deploy to Railway staging
        run: railway up --service used-books-automation-staging
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/production'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Railway CLI
        run: npm i -g @railway/cli
      - name: Deploy to Railway production
        run: railway up --service used-books-automation
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Enhanced Health Check API

Implement a more robust health check endpoint:

```javascript
// src/routes/health.js
const express = require('express');
const router = express.Router();
const shopifyClient = require('../utils/shopifyClient');
const logger = require('../utils/logger');

// Health check route
router.get('/', async (req, res) => {
  try {
    // Basic system checks
    const systemStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      cronJobsActive: global.cronJobsActive || false,
      lastScanTime: global.lastScanTime || 'Never',
      checks: {
        shopify: { status: 'pending' },
        cron: { status: 'pending' },
        memory: { status: 'pending' }
      }
    };

    // Check Shopify API connectivity
    try {
      const shopResponse = await shopifyClient.get('shop.json');
      systemStatus.checks.shopify = {
        status: 'ok',
        shop: shopResponse.body.shop.name,
        plan: shopResponse.body.shop.plan_name
      };
    } catch (error) {
      systemStatus.checks.shopify = {
        status: 'error',
        message: error.message
      };
      systemStatus.status = 'degraded';
    }

    // Check scheduled jobs
    systemStatus.checks.cron = {
      status: global.cronJobsActive ? 'ok' : 'inactive',
      lastScanTime: global.lastScanTime || 'Never'
    };

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryLimit = 512 * 1024 * 1024; // 512MB (example)
    const memoryUsagePercent = (memoryUsage.rss / memoryLimit) * 100;
    
    systemStatus.checks.memory = {
      status: memoryUsagePercent < 80 ? 'ok' : 'warning',
      usage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        percent: Math.round(memoryUsagePercent) + '%'
      }
    };

    // If any check has error status, mark the whole system as degraded
    if (Object.values(systemStatus.checks).some(check => check.status === 'error')) {
      systemStatus.status = 'degraded';
    }

    res.status(systemStatus.status === 'ok' ? 200 : 503)
      .json(systemStatus);
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
```

### Enhanced Logging Configuration

Improve the logging configuration for better cloud monitoring:

```javascript
// src/utils/logger.js
const winston = require('winston');
const path = require('path');

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to Winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define which transports to use based on environment
const transports = [
  // Always log errors to separate file
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
  }),
  // Log everything to combined file
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
  }),
];

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.simple()
      ),
    })
  );
} else {
  // In production, still log to console but in JSON format for easier parsing
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.json()
      ),
    })
  );
}

// Create and export the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
});

module.exports = logger;
```

### Graceful Shutdown Implementation

Implement a graceful shutdown process for better container orchestration:

```javascript
// src/index.js
const app = require('./app');
const config = require('../config/environment');
const logger = require('./utils/logger');
const { startScheduledJobs } = require('./services/cronService');

// Keep track of server and job references
let server;
let scheduledJobs;

// Start the server
function startServer() {
  const PORT = config.app.port;
  
  server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    
    // Start scheduled jobs
    scheduledJobs = startScheduledJobs();
    
    logger.info('Application startup complete');
  });
}

// Implement graceful shutdown
function gracefulShutdown(signal) {
  return async () => {
    logger.info(`${signal} received, starting graceful shutdown`);
    
    // First stop accepting new connections
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
      });
    }
    
    // Then stop scheduled jobs
    if (scheduledJobs) {
      if (scheduledJobs.inventoryJob) {
        scheduledJobs.inventoryJob.stop();
        logger.info('Inventory job stopped');
      }
      
      if (scheduledJobs.backupJob) {
        scheduledJobs.backupJob.stop();
        logger.info('Backup job stopped');
      }
    }
    
    // Any other cleanup like database connections, etc.
    
    logger.info('Graceful shutdown complete');
    process.exit(0);
  };
}

// Register shutdown handlers
process.on('SIGTERM', gracefulShutdown('SIGTERM'));
process.on('SIGINT', gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and promise rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  // Exit with error in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection:', reason);
  // Exit with error in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Start the server
startServer();
```

This technical architecture and code structure provides a comprehensive foundation for implementing both the admin dashboard and cloud automation for your Used Books Automation system.