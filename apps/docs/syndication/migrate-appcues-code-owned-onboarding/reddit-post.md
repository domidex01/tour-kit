## Subreddit: r/reactjs

**Title:** We wrote a migration guide for teams moving from Appcues to code-owned onboarding

**Body:**

We've been building Tour Kit, a headless product tour library for React, and one question we keep getting is: "I already use Appcues, how do I switch?"

So we wrote it up. The short version:

1. Audit your existing Appcues flows. Most teams find 30-40% of them are dead and shouldn't be migrated at all.
2. Install Tour Kit alongside Appcues (both systems coexist). The core is under 8KB gzipped.
3. Rebuild your highest-traffic flow first using TypeScript step arrays and your own JSX for the tooltip UI.
4. Wire tour events to your existing analytics (PostHog, Mixpanel, etc.) instead of Appcues' built-in dashboard.
5. Run both in parallel for 1-2 weeks, comparing completion rates.
6. Remove the Appcues SDK.

Budget about 4-6 hours for 5-10 flows. Simple tooltips take 15-20 minutes each, complex conditional flows take 45-60 minutes.

The biggest tradeoff: Appcues has a visual builder for non-technical team members. Tour Kit doesn't. If your PM creates flows without developers today, that workflow changes.

We tried to be honest about what you lose (visual builder, hosted analytics dashboard, pre-built templates) alongside what you gain (zero per-user cost, version-controlled flows, design system integration, React 19 support).

Full guide with code examples, an API mapping table, and troubleshooting: https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding

Happy to answer questions about the migration process.

---

## Subreddit: r/SaaS

**Title:** We calculated the cost of replacing Appcues with an open-source React library

**Body:**

Appcues Growth costs $879/month for 2,500 MAUs on annual billing. At 5,000 MAUs it climbs to $1,150+/month. For a B2B SaaS with 10,000 users, that's over $15,000/year just for product tours.

We built Tour Kit, a headless React library for onboarding flows, and wrote a step-by-step migration guide for teams leaving Appcues. The core packages are MIT-licensed (free), and the Pro features cost $99 one-time.

The migration takes about 4-6 hours for 5-10 flows. You install both systems side-by-side, rebuild flows one at a time using TypeScript, compare metrics, then remove Appcues.

The honest tradeoff: you lose the visual no-code builder. Non-technical team members need a developer to create or edit flows. For some teams that's a dealbreaker. For teams with React developers already building the product, it's a non-issue.

Full guide: https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding
