# Used Books Automation

This application automates the management of used book listings on Shopify, handling inventory changes, product visibility, SEO management, and redirects.

## Features

- **Inventory Management:** Automatically monitors inventory levels for used books
- **Dynamic Publishing:** Publishes and unpublishes used books based on stock status
- **Redirect Management:** Creates and removes 302 redirects for out-of-stock used books to their new book counterparts
- **SEO Optimization:** Sets canonical URLs for used books to point to their new book versions
- **Webhook Integration:** Processes real-time inventory updates from Shopify
- **Scheduled Scanning:** Runs full catalog scans every 30 minutes as a backup
- **Email Notifications:** Sends alerts for critical events via SendGrid
- **Backup System:** Creates and manages backups of redirect configurations

## Technical Stack

- Node.js with Express
- Shopify API integration
- SendGrid for email notifications
- Railway for cloud deployment
- Winston for logging
- Node-cron for scheduled tasks

## Prerequisites

- Shopify Partner account with API access
- SendGrid account (for email notifications)
- Railway account (for deployment)
- Node.js v14+ and npm

## Environment Variables

```
# Shopify API Configuration
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_ACCESS_TOKEN=your_access_token
SHOP_URL=your_store.myshopify.com
WEBHOOK_SECRET=your_webhook_secret

# Email Notification Settings
EMAIL_ENABLED=true
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=sender@example.com
EMAIL_TO=recipient@example.com

# Application Settings
PORT=3000
NODE_ENV=production
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/used-books-automation.git
   cd used-books-automation
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the required environment variables.

4. Start the application:
   ```
   npm start
   ```

## API Endpoints

- `POST /api/check-product`: Manually check a specific product
- `POST /api/scan-all`: Scan all used book products
- `GET /health`: System health check endpoint
- `GET /api/redirects`: Get all active redirects
- `POST /webhooks/inventory-levels`: Webhook for inventory updates

## Deployment

This application is configured for deployment on Railway. See the deployment plan document for detailed instructions.

## Scheduled Tasks

- **Inventory Check:** Runs every 30 minutes to check all used books
- **Backup Creation:** Runs daily at 1:00 AM to back up all redirects

## Naming Convention

Used books should follow this naming pattern:
- New book: `book-title`
- Used book: `book-title-used-{condition}`

Supported conditions:
- `like-new`
- `very-good`
- `good`
- `acceptable`

## Current Status

The application is currently deployed in production and handling inventory changes successfully. The next phase of development focuses on implementing an admin dashboard and ensuring continuous cloud operation.

## License

MIT