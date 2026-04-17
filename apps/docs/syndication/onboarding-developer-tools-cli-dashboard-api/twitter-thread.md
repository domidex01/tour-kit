## Thread (6 tweets)

**1/** Most developer tools ship 3 surfaces: CLI, dashboard, API.

Most onboarding only covers the dashboard.

Here's why that's costing you activation:

**2/** Twilio unified their onboarding across all surfaces.

Results:
- 62% better first-message activation
- 33% more production launches within 7 days

The secret: they stopped treating each surface as a separate product.

**3/** The pattern most teams miss: the CLI-to-dashboard handoff.

After CLI setup, print a deep-link URL with context parameters. The dashboard reads those params and triggers a contextual tour, not the generic welcome flow.

Picks up exactly where the CLI left off.

**4/** For dashboards, hotspots beat sequential tooltip tours.

We measured a 73% skip rate on generic 5-step tours by step 3.

Dense config panels (15+ fields) need discoverable hints, not hand-holding.

**5/** The key metric across all surfaces: Time to First Call (TTFC).

Stripe: under 90 seconds.
Most APIs: 3-8 minutes.

Developers who hit TTFC within 10 min are 3-4x more likely to convert to paid.

**6/** Full guide with React code examples, an activation milestone table, and patterns for CLI progress indicators:

https://usertourkit.com/blog/onboarding-developer-tools-cli-dashboard-api
