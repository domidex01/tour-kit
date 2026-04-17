# Migrating from Shepherd.js to Tour Kit: AGPL to MIT

## How to replace an AGPL tour library with an MIT alternative in your React app

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-shepherd-js-tour-kit)*

Shepherd.js is one of the most popular product tour libraries on npm, with 221K weekly downloads and 13,000+ GitHub stars. It's well maintained and has been around for years.

But if you're building a commercial SaaS product, you may have a problem you don't know about yet.

Shepherd.js switched its core package to AGPL-3.0. If users interact with your app over a network (which describes every SaaS product), the copyleft obligation kicks in. You either open-source your entire frontend or buy a commercial license ($50-$300).

Google completely prohibits AGPL-licensed software internally. Many enterprise legal teams follow the same policy.

Here's the tricky part: `react-shepherd` is published under MIT. But it depends on `shepherd.js` core, which is AGPL-3.0. AGPL obligations cascade through dependencies.

I wrote a step-by-step migration guide for replacing Shepherd.js with Tour Kit, an MIT-licensed, headless React tour library that ships at under 8KB gzipped. The migration covers:

**Step 1:** Install Tour Kit alongside Shepherd (run both simultaneously)

**Step 2:** Convert step definitions from imperative `tour.addStep()` calls to a declarative steps array

**Step 3:** Migrate event callbacks from scattered `when` handlers to consolidated provider-level callbacks

**Step 4:** Handle multi-page tours with built-in localStorage persistence

**Step 5:** Remove Shepherd and its CSS imports

The full guide includes before/after code examples for each step, a concept mapping table, troubleshooting for common migration issues, and an FAQ section.

Read the complete tutorial: [usertourkit.com/blog/migrate-shepherd-js-tour-kit](https://usertourkit.com/blog/migrate-shepherd-js-tour-kit)

---

*Disclosure: I built Tour Kit, so take this with appropriate skepticism. Every data point in the article is verifiable against npm, GitHub, and bundlephobia. Shepherd.js has served the community well for years — this is for teams whose requirements have outgrown what it offers under its current license.*

Suggested Medium publications to submit to:
- JavaScript in Plain English
- Better Programming
- Bits and Pieces
