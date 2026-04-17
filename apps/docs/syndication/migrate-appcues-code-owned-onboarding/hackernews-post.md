## Title: Migrating from Appcues to code-owned onboarding in React

## URL: https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding

## Comment to post immediately after:

I built Tour Kit, a headless React library for product tours and onboarding. The most common question from potential users: "I already pay for Appcues, how do I switch?"

Appcues Growth runs $879/month at 2,500 MAUs. The migration takes 4-6 hours for a typical 5-10 flow setup. The approach is incremental: install both systems side-by-side, rebuild the highest-traffic flow first, compare completion rates, then remove the old SDK.

The guide includes an API mapping table (Appcues concept -> Tour Kit equivalent), working TypeScript code examples, analytics wiring, and a troubleshooting section for the three issues that come up most often.

The biggest honest tradeoff: Appcues has a visual builder for non-technical team members. Tour Kit is code-first. If your PM creates onboarding flows without developers, that workflow changes. We acknowledge this prominently in the article.

Tour Kit's core is under 8KB gzipped, MIT-licensed, with zero runtime dependencies. Happy to discuss the technical approach or answer questions about the migration process.
