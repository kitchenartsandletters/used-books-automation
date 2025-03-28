# Inventory Detection, Canonical Tagging, and 302 Redirects Automation

Below is an outline for an end-to‑end solution that covers inventory detection, canonical tagging, and 302 redirects, along with additional considerations.
⸻

## 1. Inventory Change Detection

### A. Webhook-Based Approach

•	**Setup:**
	•	Subscribe to Shopify’s InventoryLevel update webhook.
	•	Your webhook endpoint (hosted on a cloud service) will receive real‑time notifications when inventory levels change for any product.

•	**Deployment Options:**
	•	Cloud Hosting (e.g., Railway, Heroku, AWS Lambda):
Deploy a small Node.js (or other language) app that receives the webhook, processes the payload, and updates the product status.
	
•	**Flow:**
	1.	Webhook triggers when a used book’s inventory changes.
	2.	Your endpoint verifies the request (using a shared secret).
	3.	If inventory is 0, trigger unpublishing and redirect creation; if inventory is above 0, trigger republishing and remove any existing redirect.

## B. Scheduled Script (Cron) Approach

•	**Setup:**
	•	Create a script that periodically (e.g., every 15–30 minutes) queries your used book products via the Shopify Admin API.
	•	Compare current inventory levels for each product.

•	**Deployment Options:**
	•	GitHub Actions:
Use a scheduled GitHub Actions workflow (cron job) to run the script.

•	**Cloud Hosting:**
Alternatively, host the script on Railway (or a similar service) which supports scheduled tasks.

•	**Flow:**

	1.	The script runs on schedule, checks inventory for each used book product, and calls the Shopify API to update the product’s published status and manage redirects.

**Consideration:**
	•	Webhook vs. Cron:
Webhooks provide real‑time responses and are more efficient, while a scheduled script is simpler to set up if you’re comfortable with a slight delay. For most used book scenarios (with low inventory volatility), either approach will work well.

⸻

## 2. Automate Canonical Tagging on Used Book Pages

•	**Objective:**
Ensure that used book pages (when live) pass SEO juice to the corresponding new book page.

•	**Implementation Options:**
	•	**Liquid Template Approach:**
Modify your theme’s Liquid templates so that when a product handle contains “-used-”, a canonical tag is automatically inserted that points to the new book page (e.g., by stripping the “-used-…” part).
	•	**API-Based Approach:**
Alternatively, update a metafield or SEO setting via the Shopify Admin API using your automation script, though the Liquid approach is often simpler and more dynamic.

•	**Example (Liquid):**

    ```liquid
    {% if product.handle contains '-used-' %}
    {% assign main_handle = product.handle | split: '-used-' | first %}
    <link rel="canonical" href="{{ shop.url }}/products/{{ main_handle }}">
    {% endif %}

⸻

## 3. Create 302 Redirects When Stock Reaches 0 and Remove Them When Stock Is Replenished
	•	When Stock Reaches 0:
	•	Action: Unpublish the used book product (set published_at to null) and use the Shopify Admin API to create a URL redirect.
	•	Redirect Details:
	•	Type: Use a 302 (temporary) redirect because inventory may eventually be replenished.
	•	Path: The original used book URL (e.g., /products/test-book-title-used-very-good).
	•	Target: Typically the corresponding new book page (e.g., /products/test-book-title) or a dedicated “Sold Out” page.
	•	When Stock Is Replenished:
	•	Action: Republish the used book product (update published_at to the current timestamp) and remove the previously created redirect.
	•	Automation:
Integrate this logic into your webhook or scheduled script so that the redirect is created or deleted based on the inventory level change.

⸻

## 4. Additional Considerations
	•	API Rate Limits:
Monitor and handle Shopify’s API rate limits—especially if using scheduled scripts that query many products.
	•	Logging & Error Handling:
Implement robust logging and error handling in your automation script to track successes and failures.
	•	Security:
Secure webhook endpoints with a shared secret and ensure API credentials are stored securely.
	•	Testing:
Test extensively in a development store environment before deploying to production.
	•	User Notifications:
Optionally, set up notifications to alert staff when products are unpublished or republished.
	•	SEO Monitoring:
Use tools like Google Search Console to monitor any impact on indexing, 404 errors, and canonical issues after deploying these changes.
	•	Hosting Decisions:
	•	Railway: A solid choice for hosting a small Node.js app that handles webhooks or scheduled tasks.
	•	GitHub Actions: Can be used effectively for periodic checks if real‑time response is not critical.
	•	Other Cloud Providers: AWS Lambda or similar serverless functions can also be suitable.

⸻

This outline should give you a comprehensive roadmap for automating the management of used book pages—with dynamic unpublishing/republishing, canonical tagging, and 302 redirects—all while keeping SEO and user experience in mind.

Let me know if you need further details on any specific part of this solution!