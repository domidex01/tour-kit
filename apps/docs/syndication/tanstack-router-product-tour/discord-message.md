## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up how to build type-safe multi-page product tours with TanStack Router. The key trick is constraining tour step routes with `RoutePaths<RegisteredRouter['routeTree']>` so a typo'd route is a compile error, not a runtime 404. Adapter is ~40 lines.

https://usertourkit.com/blog/tanstack-router-product-tour

Anyone else using TanStack Router for apps with product tours? Curious if there are edge cases I missed with dynamic routes.
