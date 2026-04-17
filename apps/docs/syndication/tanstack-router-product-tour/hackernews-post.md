## Title: Type-safe multi-page product tours with TanStack Router

## URL: https://usertourkit.com/blog/tanstack-router-product-tour

## Comment to post immediately after:

I built Tour Kit, a headless product tour library for React, and one recurring problem is broken routes in multi-page tours. You typo a route string in your tour config, and the first time you find out is when a user hits a 404 mid-onboarding.

TanStack Router's type system fixes this cleanly. The route tree is a TypeScript type, so you can constrain tour step routes with `RoutePaths<RegisteredRouter['routeTree']>`. A renamed route breaks the build instead of breaking production.

The adapter is about 40 lines using `useRouterState` and `useNavigate`. The article covers the adapter, typed route context for onboarding state, `beforeLoad` for gating tour visibility, and Zod-validated search params for tour progress.

One limitation worth noting: Tour Kit doesn't have a visual builder — you're writing tour configs in TypeScript. For teams already using TanStack Router, that fits the same code-first philosophy.
