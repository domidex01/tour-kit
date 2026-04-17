## Thread (6 tweets)

**1/** Most product tour libraries treat routing as an afterthought. You pass route strings, and if you typo one, your user lands on a 404 mid-onboarding.

TanStack Router's type system fixes this. Here's how 🧵

**2/** The problem: typical tour config has no route validation.

route: '/dashbord' — typo, but no error until production.

TanStack Router's route tree is a TypeScript type. Constrain step routes with RoutePaths<RegisteredRouter['routeTree']>, and that typo becomes a compile error.

**3/** The adapter is ~40 lines. It implements four methods using useRouterState and useNavigate.

Plus you get beforeLoad for gating tours on auth state, and typed search params for persisting tour progress in the URL.

**4/** Bundle overhead: Tour Kit core (<8KB) + TanStack Router (~12KB) = under 20KB gzipped.

React Joyride alone ships at 37KB.

**5/** Three patterns that extend the basic integration:
- Zod-validated search params for tour state
- Automatic code splitting per tour step
- Route-aware analytics (see which page transition caused drop-offs)

**6/** Full writeup with all the code — adapter, typed steps, beforeLoad guards, and advanced patterns:

https://usertourkit.com/blog/tanstack-router-product-tour
