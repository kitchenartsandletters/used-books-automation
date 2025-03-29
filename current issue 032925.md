The current issue is that the Shopify URL configuration is missing or not being accessed correctly. The application is trying to make API calls to Shopify, but it can't construct the proper URL because `config.shopify.shopUrl` is undefined.

This is causing errors throughout the application when trying to scan for used books. To fix this, we need to:

1. Check the environment variables in your `.env` file to ensure `SHOP_URL` is correctly set
2. Verify the `environment.js` configuration file is properly loading and exporting these values
3. Make sure the shopifyClient is correctly importing and using this configuration

Once the shop URL issue is resolved, the application should be able to make successful API calls to Shopify and properly identify used books with the "-used-" pattern in their handles.