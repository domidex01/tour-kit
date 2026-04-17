## Thread (6 tweets)

**1/** Most product tour libraries stop at "tour finished." The data dies in localStorage. Your sales team never knows which trial users actually engaged.

We wired Tour Kit's onComplete callback to HubSpot's CRM. Here's the pattern:

**2/** The flow: Tour completes → API route fires → PATCH to HubSpot Contacts API → custom property updates → workflow enrolls the contact automatically.

One API call. Under 10 seconds end-to-end. Zero polling.

**3/** The gotcha nobody mentions: HubSpot's search API has a 1-2 second indexing delay after contact creation.

If a user signs up and immediately finishes a tour, the search returns nothing. Fix: store the HubSpot contact ID at signup, skip the search entirely.

**4/** HubSpot's Webhooks API is free tier. You don't need the $890/month Professional plan for this.

Professional is only needed for Workflow Extensions and Custom Code Actions. Filter-based workflow enrollment on Starter covers most use cases.

**5/** The reverse integration angle nobody talks about: HubSpot can POST webhooks TO your app.

Deal stalls for 14 days? HubSpot fires a webhook. Your app queues a re-engagement tour next time the user logs in. Bidirectional CRM-aware onboarding.

**6/** Full integration guide with TypeScript code — HubSpot SDK setup, analytics plugin, Next.js API route, and lifecycle stage mapping:

https://usertourkit.com/blog/tour-kit-hubspot-crm-workflows
