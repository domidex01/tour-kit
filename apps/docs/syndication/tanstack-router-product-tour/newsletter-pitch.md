## Subject: Type-safe product tours with TanStack Router — for React Status / This Week in React

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote up how to build type-safe multi-page product tours by integrating Tour Kit (a headless React tour library, <8KB gzipped) with TanStack Router's type system. The key insight is using `RoutePaths<RegisteredRouter['routeTree']>` to get compile-time validation on tour step routes — so a typo'd route is a build error, not a runtime 404.

TanStack Router hit 2.3M weekly downloads as of April 2026, and this integration pattern uses features (route context, beforeLoad, typed search params) that most tour libraries can't access.

Link: https://usertourkit.com/blog/tanstack-router-product-tour

Thanks,
Domi
