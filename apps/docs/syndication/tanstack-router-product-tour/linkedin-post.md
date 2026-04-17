Here's a bug that's hard to catch: a typo'd route in your product tour config.

Your onboarding flow navigates users through /dashboard → /dashboard/settings → /dashboard/projects/new. But someone types '/dashbord' in the tour step config. No error at build time. The first person to notice is a user who lands on a 404 mid-onboarding.

TanStack Router's type system prevents this entirely. The route tree is a TypeScript type, so tour step routes can be constrained to only valid paths. A renamed or typo'd route breaks the build, not the user experience.

I wrote up the full integration pattern — a ~40-line adapter connecting Tour Kit (a headless React tour library) to TanStack Router. The combined bundle: under 20KB gzipped.

The article covers the adapter, typed route context for onboarding state, beforeLoad guards for tour visibility, and Zod-validated search params for tour progress.

Full guide: https://usertourkit.com/blog/tanstack-router-product-tour

#react #typescript #tanstack #webdevelopment #opensource #productdevelopment
