# Type-safe product tours that don't break when you rename a route

## How TanStack Router's type system prevents a common onboarding bug

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tanstack-router-product-tour)*

Most product tour libraries treat routing as an afterthought. You define steps with route strings, and the library pushes to those routes when it needs to change pages. No type checking. No validation that the route exists.

Here's what that looks like in practice:

```
const steps = [
  { target: '#welcome-banner', route: '/dashbord' },  // typo
  { target: '#settings-btn', route: '/dashboard/setings' },  // another typo
]
```

Both routes have typos. You won't know until a user hits step 2 and lands on a 404.

TanStack Router solves this. Its route tree is a TypeScript type. Constrain your tour step routes to that type, and '/dashbord' becomes a compile error instead of a production bug.

I wrote up the full integration pattern — a ~40-line router adapter that connects Tour Kit (a headless product tour library for React) to TanStack Router's type system. The result:

- Compile-time validation on every route in your tour steps
- Route context for passing onboarding state without prop drilling
- beforeLoad guards that skip tours for users who already completed onboarding
- Type-safe search params for tracking tour progress in the URL

The combined bundle overhead is under 20KB gzipped (Tour Kit core <8KB + TanStack Router ~12KB). That's lighter than React Joyride alone at 37KB.

TanStack Router hit 2.3 million weekly npm downloads as of April 2026. If you're already using it, adding type-safe product tours is about 40 lines of adapter code.

The full article has all the code examples, from the adapter implementation to the typed tour step definitions.

**Read the complete guide:** [usertourkit.com/blog/tanstack-router-product-tour](https://usertourkit.com/blog/tanstack-router-product-tour)

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
