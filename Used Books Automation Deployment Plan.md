# Used Books Automation - Railway Deployment Plan

## Pre-Deployment Tasks

1. **Environment Variables Setup**
   - Create all required environment variables in Railway dashboard:
     - `SHOPIFY_API_KEY` - Your Shopify API key
     - `SHOPIFY_API_SECRET` - Your Shopify API secret
     - `SHOPIFY_ACCESS_TOKEN` - Your Shopify access token
     - `SHOP_URL` - Your Shopify store URL (without https://)
     - `WEBHOOK_SECRET` - Secret for webhook validation
     - `PORT` - Port for the application (Railway will set this automatically)
     - `NODE_ENV` - Set to "production"
     - `EMAIL_ENABLED` - Set to "true" to enable email notifications
     - `SENDGRID_API_KEY` - Your SendGrid API key
     - `EMAIL_FROM` - Verified sender email address in SendGrid
     - `EMAIL_TO` - Email address where notifications should be sent

2. **SendGrid Configuration**
   - Ensure your SendGrid account is properly set up:
     - Verify your sender email or domain in SendGrid
     - Confirm API key has proper permissions (at minimum: "Mail Send" permission)
     - Test sending a test email before deployment

3. **Repository Preparation**
   - Ensure all code is committed to the repository
   - Add @sendgrid/mail dependency to package.json
   - Create a "production" branch if needed

4. **Dependencies Check**
   - Run `npm audit` to check for vulnerabilities
   - Update any outdated dependencies
   - Make sure all dependencies are listed in package.json

## Deployment Steps

1. **Initial Deployment**
   - Connect your GitHub repository to Railway
   - Select the appropriate branch (main/production)
   - Choose Node.js environment
   - Set up deployment settings:
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Health Check Path: `/health`

2. **First-Time Setup**
   - After initial deployment:
     - Wait for the build to complete
     - Verify the application is running by checking the health endpoint
     - Register webhooks by running the webhook registration script:
       ```
       railway run npm run register-webhooks
       ```

3. **Email Notification Testing**
   - Test the email notification system:
     ```
     railway run curl http://localhost:$PORT/api/test-email
     ```
   - Verify that a test email is received at the configured address

4. **Initial Data Scan**
   - Run the first scan to process all used books:
     ```
     railway run npm run scan-all
     ```
   - Check logs to ensure the scan completes successfully
   - Verify email notifications are sent for any critical issues

## Post-Deployment Verification

1. **Dashboard Access**
   - Verify dashboard is accessible at `/dashboard`

2. **Webhook Testing**
   - Test webhook by updating inventory for a used book in Shopify
   - Verify webhook is received and processed correctly

3. **Backup System**
   - Verify backup directory is created
   - Run a manual backup to test:
     ```
     railway run node -e "require('./src/utils/backupService').backupRedirects()"
     ```
   - Verify backup completion email is received

4. **SEO Management**
   - Verify canonical URL is set for used book products
   - Check metafields in Shopify admin

## Monitoring and Maintenance

1. **Logs and Alerts**
   - Set up Railway log alerts for important events
   - Check logs regularly in the Railway dashboard
   - Configure email notification preferences:
     - Adjust which events trigger email notifications
     - Set up additional recipients if needed

2. **Performance Monitoring**
   - Monitor application performance in Railway metrics
   - Check for high CPU or memory usage
   - Set up alerts for performance issues

3. **Regular Backups**
   - Verify daily backups are being created
   - Check that backup notification emails are being sent
   - Periodically download backups from Railway

4. **Email Delivery Monitoring**
   - Monitor email delivery rates in SendGrid dashboard
   - Check for bounced or failed emails
   - Review SendGrid activity logs periodically

5. **Updates and Maintenance**
   - Plan regular updates for dependencies
   - Schedule maintenance during off-peak hours
   - Test email notifications after any system updates

## Rollback Plan

1. **Identifying Issues**
   - Monitor logs for unexpected errors
   - Check dashboard for system status
   - Review email notifications for critical alerts

2. **Quick Rollback**
   - Use Railway's rollback feature to revert to previous deployment
   - Or deploy a previous known-good commit
   - Send notification email about the rollback

3. **Data Recovery**
   - Restore redirects from the most recent backup if needed
   - Verify restoration with email notification

This updated deployment plan now includes all the necessary steps for configuring and testing the SendGrid email notification system as part of your Used Books Automation deployment.