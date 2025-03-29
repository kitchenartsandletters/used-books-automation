# Used Books Automation Deployment Plan

## Pre-Deployment Tasks

1. **Update Dependencies**
   - Run `npm audit` to check for vulnerabilities
   - Update packages if necessary with `npm update`
   - Ensure all dependencies are explicitly declared in package.json

2. **Environment Configuration**
   - Create all required environment variables in Railway dashboard
   - Ensure webhook URLs are pointing to the production domain
   - Test environment configuration locally before pushing

3. **Database Preparation**
   - Create backups directory in the project root
   - Setup filesystem permissions for the backups directory

## Deployment Steps

1. **Initial Deployment**
   - Push code to GitHub repository
   - Connect Railway to the GitHub repository
   - Select the correct branch (main/master)
   - Configure build settings as per railway.json
   - Configure environment variables in Railway dashboard

2. **Webhook Registration**
   - After deployment, run the webhook registration script:
     `railway run npm run register-webhooks`
   - Verify webhook registration in Shopify admin

3. **Initial Data Scan**
   - Trigger the initial scan manually via the API:
     `curl -X POST https://your-app-url.railway.app/api/scan-all`
   - Check logs to ensure scan completes successfully

4. **Health Check Verification**
   - Verify the health endpoint is working:
     `curl https://your-app-url.railway.app/health`
   - Ensure status returns "healthy"

## Post-Deployment Monitoring

1. **Initial Monitoring Period (24 hours)**
   - Check logs frequently for any errors
   - Verify that scheduled jobs are running as expected
   - Monitor webhook deliveries in Shopify admin

2. **Performance Monitoring**
   - Check Railway dashboard for CPU and memory usage
   - Adjust resource allocation if necessary

3. **Functional Testing**
   - Test inventory updates by changing stock levels in Shopify
   - Verify that books are published/unpublished correctly
   - Confirm that redirects are being created/removed as expected

## Rollback Plan

1. **Identifying Need for Rollback**
   - Multiple errors in logs related to core functionality
   - Webhook failures
   - Unexpected product visibility issues

2. **Rollback Procedure**
   - Revert to the last working commit in GitHub
   - Redeploy using Railway
   - Restore the most recent redirect backup if necessary

3. **Post-Rollback Actions**
   - Notify team of the rollback
   - Investigate issues that caused the rollback
   - Create a plan to address issues before next deployment

## Long-term Maintenance

1. **Regular Backups**
   - Verify daily backups are being created
   - Periodically download backups from the server for safekeeping

2. **Monitoring and Alerts**
   - Set up Railway alerts for application failures
   - Configure email notifications for critical errors
   - Review daily status reports

3. **Update Schedule**
   - Plan regular updates for dependencies
   - Schedule non-emergency updates during low-traffic periods