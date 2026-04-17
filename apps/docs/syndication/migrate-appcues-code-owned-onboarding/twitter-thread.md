## Thread (6 tweets)

**1/** Appcues Growth costs $879/month at 2,500 MAUs. We wrote a guide for teams ready to replace it with a React library that costs $0 per user.

Here's the migration playbook:

**2/** Step 1: Audit your Appcues flows. Most teams discover 30-40% of their flows haven't triggered in months. Don't migrate dead content.

**3/** Step 2-3: Install Tour Kit alongside Appcues (8KB, zero deps). Rebuild your highest-traffic flow first. Steps become TypeScript objects you can code-review:

```ts
const steps = [
  { target: '#sidebar', title: 'Navigate', content: '...' },
  { target: '#create-btn', title: 'Create', content: '...' },
];
```

**4/** Step 4-5: Wire analytics to PostHog/Mixpanel/Amplitude. Run both systems in parallel for 1-2 weeks. Compare completion rates before committing.

**5/** The honest tradeoff: you lose the visual builder. PMs who create flows without devs today will need developer involvement. We acknowledge this upfront because pretending it doesn't matter would be dishonest.

**6/** Full guide with API mapping table, code examples, and troubleshooting:

https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding
