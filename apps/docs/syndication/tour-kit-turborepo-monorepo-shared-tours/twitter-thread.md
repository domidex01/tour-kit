## Thread (6 tweets)

**1/** Copy-pasting product tour definitions across 3 apps in a monorepo? That's how you get onboarding drift.

Here's how to share tours from a single internal package instead. 🧵

**2/** The setup: a `packages/tours` workspace with plain TypeScript tour definitions. No JSX, no styles. Just step data.

Each app imports what it needs and renders with its own design system. Define once, render everywhere.

**3/** The tree shaking win:

Without `sideEffects: false` → both apps bundle 8.1KB
With it → dashboard: 6.2KB, marketing: 3.8KB

53% less tour code for the app that only uses one of two tours.

**4/** Target elements with `data-tour` attributes instead of CSS classes.

Classes change during style refactors. Data attributes survive design system updates across apps.

**5/** Gotcha: tour completion state in localStorage is scoped per origin.

If your apps run on `dashboard.acme.com` and `marketing.acme.com`, you need a custom storage adapter to share state.

**6/** Full 7-step tutorial with TypeScript code, Turborepo config, and troubleshooting:

https://usertourkit.com/blog/tour-kit-turborepo-monorepo-shared-tours
