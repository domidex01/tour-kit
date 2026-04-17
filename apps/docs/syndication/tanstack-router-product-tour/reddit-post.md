## Subreddit: r/reactjs

**Title:** I wrote a type-safe router adapter for multi-page product tours with TanStack Router

**Body:**

I've been working on Tour Kit, a headless product tour library for React, and ran into a problem: most tour libraries (including mine, initially) treat routing as an afterthought. You pass route strings to tour steps, and if you typo one, you get a runtime 404 when the tour navigates.

TanStack Router's type system actually solves this. The route tree is a TypeScript type, so you can constrain tour step routes to `RoutePaths<RegisteredRouter['routeTree']>`. Renamed a route? `tsc` catches every tour step that references the old path.

The adapter itself is ~40 lines — it implements four methods (`getCurrentRoute`, `navigate`, `matchRoute`, `onRouteChange`) using `useRouterState` and `useNavigate`. The nice bonus is `beforeLoad` for gating tour visibility on auth state, and typed search params for persisting tour progress in the URL.

Combined bundle: Tour Kit core (<8KB gzip) + TanStack Router (~12KB) = under 20KB. For reference, React Joyride alone is 37KB.

Full writeup with all the code: https://usertourkit.com/blog/tanstack-router-product-tour

Curious if anyone else has tried integrating product tours with TanStack Router's type system — any gotchas I missed?
