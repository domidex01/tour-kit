## Subreddit: r/reactjs

**Title:** I wrote up how to share product tours across apps in a Turborepo monorepo — here's what worked

**Body:**

We have a Turborepo monorepo with a Next.js dashboard and a Vite marketing site. Both needed product tours. Copy-pasting tour step definitions across apps seemed fine until we changed a step label in one app and forgot the other. Classic copy-paste drift.

The fix: we created a shared `packages/tours` internal package that exports tour step definitions as plain TypeScript data (no JSX, no styles). Each app imports the steps it needs and renders tooltips with its own design system. Tour Kit's headless architecture made this straightforward because it separates progression logic from rendering.

A few things we learned:

- **`sideEffects: false` matters**: Without it, both apps bundled every tour definition even when they only imported one. With it, the marketing app's tour-related bundle dropped from 8.1KB to 3.8KB (53% reduction).

- **`data-tour` attributes are better targets than CSS classes**: Classes change during style refactors. Data attributes survive design system updates because they're explicitly opt-in.

- **Shared completion state is tricky across origins**: localStorage is scoped per origin, so `dashboard.acme.com` and `marketing.acme.com` don't share state by default. We used Tour Kit's `createStorageAdapter()` to plug in an API-backed storage.

- **`'use client'` is needed in two places for Next.js App Router**: The shared provider AND the page component rendering the tooltip both need it.

Full tutorial with all 7 steps and runnable code examples: https://usertourkit.com/blog/tour-kit-turborepo-monorepo-shared-tours

Curious if anyone else has tackled onboarding in a monorepo setup and what patterns you used.
