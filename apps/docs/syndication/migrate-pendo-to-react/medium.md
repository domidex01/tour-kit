# How to replace Pendo product tours with your own React code

## A step-by-step guide to exporting Pendo guides and rebuilding them as components you own

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-pendo-to-react)*

You're paying Pendo $40K-$80K a year for product tours. Your React app has grown. The guides take 54KB of third-party JavaScript on every page, your SPA throws errors after navigation, and your design team gave up trying to match your Tailwind tokens inside Pendo's theme editor.

This isn't a "Pendo is bad" article. Pendo handles analytics, session replay, and NPS surveys across web and mobile. But if your primary use case is in-app guides and you have a React codebase, owning that code eliminates a six-figure annual dependency.

## Why React teams leave Pendo

As of April 2026, mid-market Pendo customers pay $40K-$80K annually with 5-20% renewal increases. The technical pain points compound:

**SPA routing friction.** Pendo uses DOM mutation observers. React's virtual DOM and client-side routing cause "page mismatch" errors where guides target elements that have already unmounted.

**54KB third-party script** on every page. An open-source alternative like Tour Kit ships at under 8KB gzipped.

**Design system conflicts.** Pendo's theme editor constrains you to their CSS variables. Teams using Tailwind end up overriding every tooltip.

**Accessibility gaps.** Pendo claims WCAG 2.2 AA alignment but admits they're still working toward full compliance.

**Data lock-in.** Full data export requires the $100K+/year Ultimate tier.

## The migration process

The migration is incremental. You install the new library alongside Pendo, rebuild one guide at a time, and only remove the Pendo snippet after everything is tested.

**Step 1:** Export your Pendo guide configurations via their REST API. Each guide's steps contain CSS selectors, content HTML, and targeting rules that map to your new components.

**Step 2:** Install Tour Kit alongside Pendo. Both tools target DOM elements independently and don't interfere.

**Step 3:** Rebuild your simplest guide first. Pendo's HTML content strings become React JSX. Their CSS selectors become component props.

**Step 4:** Convert Pendo's visual targeting rules to React conditionals. "Signed up within 7 days" becomes a date comparison in your auth hook.

**Step 5:** Migrate badges (hotspots) to hint components.

**Step 6:** Disable Pendo guides, monitor for one sprint, then remove the snippet.

## What you gain and lose

The tradeoffs are real. You lose Pendo's visual guide builder, mobile SDK, built-in analytics, and session replay. Non-technical PMs who create guides independently will need developer involvement.

You gain full rendering control, your design system's CSS, automatic WCAG 2.1 AA accessibility, data ownership, and $40K-$80K/year back in your budget.

The key question: does your engineering team own guide creation? If yes, the SaaS cost no longer makes sense.

## The numbers

A mid-market Pendo contract runs $40K-$80K per year with renewal increases. An open-source React library costs $0 (MIT). Even accounting for 40 hours of developer time at $150/hour ($6,000), the migration pays for itself within the first quarter.

---

Full article with working TypeScript code, API export commands, comparison tables, and troubleshooting: [usertourkit.com/blog/migrate-pendo-to-react](https://usertourkit.com/blog/migrate-pendo-to-react)

*Suggest submitting to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium.*
