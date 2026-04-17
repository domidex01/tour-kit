## Subreddit: r/reactjs

**Title:** I wired product tour completion events to HubSpot CRM workflows — here's the integration pattern

**Body:**

Been working on connecting in-app product tour events to HubSpot's CRM so our sales team gets real-time signals when trial users actually engage with the product.

The pattern is straightforward: Tour Kit (headless product tour library) fires an `onComplete` callback, a Next.js API route catches it, and a single PATCH to HubSpot's Contacts API v3 updates a custom property. HubSpot's workflow engine picks up the property change and handles the rest — lifecycle stage promotion, follow-up email, Slack ping to the assigned rep.

The interesting part: HubSpot's Webhooks API is available on the free CRM tier, so you don't need the $890/month Professional plan for this. The whole thing runs on one API call per tour completion with zero polling.

Three gotchas we hit: (1) HubSpot's search API has a 1-2 second indexing delay after contact creation, so if someone signs up and immediately finishes a tour, the search misses them. We store the HubSpot contact ID at signup instead. (2) Private App tokens replaced API keys in Nov 2022 — don't use the legacy auth. (3) Webhooks are bidirectional — HubSpot can also POST to your app when a deal stage changes, which opens up re-engagement tour triggers.

Full writeup with all the TypeScript code: https://usertourkit.com/blog/tour-kit-hubspot-crm-workflows

---

## Subreddit: r/hubspot

**Title:** Code-first approach to triggering HubSpot workflows from in-app product tour events (React + TypeScript)

**Body:**

Sharing an integration pattern we built for connecting product tour completion events to HubSpot CRM workflows.

Instead of using a no-code tour tool like Chameleon ($$$, per-MAU pricing), we used Tour Kit (open-source React library) and wired its `onComplete` callback directly to HubSpot's Contacts API. When a user finishes a product tour, a single PATCH request updates a custom contact property. A HubSpot workflow enrolled on that property change handles lifecycle stage promotion and follow-up automation.

Works on HubSpot's free CRM tier — the Webhooks API and Contacts API are both available without Professional. Only need Professional for Workflow Extensions or Custom Code Actions.

The lifecycle stage mapping that worked for us:
- Tour started but not finished → Subscriber (send nudge email)
- Completed onboarding tour → Lead (assign to sales rep)
- Used key feature after tour → MQL (create deal)
- Clicked upgrade CTA in tour → SQL (priority routing)

Full integration guide with code: https://usertourkit.com/blog/tour-kit-hubspot-crm-workflows
