# Stop Hardcoding Product Tour Steps in Your React Components

## Serve tour configuration from a type-safe tRPC backend instead

*Originally published at [usertourkit.com](https://usertourkit.com/blog/trpc-product-tour-config)*

Most product tour libraries expect you to hardcode steps in your React components. That works until your product manager asks you to change step 3's copy and you realize it requires a full redeploy.

tRPC gives you a way to serve tour configurations from the server with end-to-end type safety. Your frontend always knows the exact shape of every step before it renders. No codegen, no manual type annotations.

## The problem with hardcoded tour steps

When tour steps live in your JSX, changing copy means changing code. Changing code means a PR, a review, a build, and a deploy. For a product tour that should take 30 seconds to update, that's a lot of ceremony.

## The tRPC solution

tRPC removes the translation layer between backend and frontend types. As of April 2026, tRPC has over 35,000 GitHub stars and 700,000+ weekly npm downloads. The approach is simple:

1. Define a Zod schema for your tour step structure on the server
2. Create a tRPC router that serves validated tour configs
3. Call the tRPC procedure from your React component
4. Pass the result to Tour Kit's `useTour` hook

The whole setup is about 40 lines of glue code. The Zod schema validates step data before it leaves the server. TanStack Query caches the result on the client. TypeScript infers the types end-to-end.

## Why this matters

We tested a 12-step tour config served from Postgres. Cold query: 3-8ms. Cached reads: under 1ms. Total payload: about 1.2KB gzipped. Your product manager updates the tour copy in the database, and users see the change within 5 minutes.

The comparison tells the story:

- **tRPC + Zod**: End-to-end type safety, automatic validation, TanStack Query caching, zero codegen
- **REST + fetch**: Manual types that drift, manual validation, manual caching
- **GraphQL**: Strong types but requires codegen step
- **Server Actions**: Good within Next.js but no built-in cache layer

As Bitovi's engineering team put it: "The amount that tRPC has improved the quality of code, the speed of delivery, and the happiness of developers is hard to comprehend."

## The honest trade-offs

Tour Kit is our project, so take the integration claims with appropriate skepticism. Tour Kit doesn't include a visual tour builder, and it requires React 18+. You're writing TypeScript, not dragging steps in a UI. For teams where product managers configure tours directly without developer involvement, a SaaS tool is probably a better fit.

But if your engineers own the tour configuration and want type safety from database to tooltip, the tRPC + Tour Kit combination fills a gap that no other tutorial covers.

Full article with code examples, comparison table, and FAQ: [usertourkit.com/blog/trpc-product-tour-config](https://usertourkit.com/blog/trpc-product-tour-config)

---

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
