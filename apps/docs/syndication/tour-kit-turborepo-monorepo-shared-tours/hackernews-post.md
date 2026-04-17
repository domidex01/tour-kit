## Title: Sharing product tours across apps in a Turborepo monorepo

## URL: https://usertourkit.com/blog/tour-kit-turborepo-monorepo-shared-tours

## Comment to post immediately after:

This is a step-by-step tutorial for setting up a shared internal package that contains product tour definitions consumed by multiple React apps in a Turborepo + pnpm workspace.

The core idea: tour step definitions are plain TypeScript data (no JSX), so they can live in a shared package. Each consuming app renders the tour UI with its own design system. Tour Kit's headless architecture makes this possible by separating progression logic from rendering.

Some specifics from the writeup:

- Without `sideEffects: false` in the shared package, both apps bundled every tour definition (8.1KB each). With it, the app that only used one of two tours dropped to 3.8KB — a 53% reduction.

- `data-tour` attributes as element targets survive cross-app design system changes better than CSS classes.

- Shared tour completion state across different origins (dashboard.acme.com vs marketing.acme.com) requires a custom storage adapter since localStorage is origin-scoped.

I wrote Tour Kit, so take the library recommendation accordingly. But the shared-package-with-headless-rendering pattern works with any headless tour library.
