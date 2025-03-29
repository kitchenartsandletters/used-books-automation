# Used Books Automation

This application automates the management of used book listings on Shopify, handling inventory changes, product visibility, and redirects.

## Features

- Automatic inventory monitoring for used books
- Publishing/unpublishing based on inventory levels
- 302 redirects for out-of-stock items
- Webhook integration for real-time updates
- Scheduled checks as a fallback

## Setup

1. Clone the repository
2. Create `.env` file with required credentials
3. Install dependencies: `npm install`
4. Run the application: `npm start`

## API Endpoints

- `POST /api/check-product`: Manually check a specific product
- `POST /api/scan-all`: Scan all used book products

## Webhook

- `POST /webhooks/inventory-levels`: Receives inventory level update events from Shopify

## Deployment

This application is configured for deployment on Railway.

## License

MIT

Execution Timeline

Phase 1 (Environment Setup): Day 1
Phase 2 (Shopify API Integration): Days 1-2
Phase 3 (Core Business Logic): Days 2-3
Phase 4 (Webhooks and API Endpoints): Day 3
Phase 5 (Express Server Setup): Day 4
Phase 6 (Scheduled Jobs): Day 4
Phase 7 (Deployment): Day 5
Phase 8 (Testing): Days 5-6