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