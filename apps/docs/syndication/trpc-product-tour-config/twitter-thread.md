## Thread (6 tweets)

**1/** Most product tour libraries make you hardcode steps in JSX. Change a comma? Redeploy.

Here's how to serve tour configs from tRPC with end-to-end type safety instead:

**2/** The setup is ~40 lines of TypeScript:

- Zod schema defines step shape (target, title, content, placement)
- tRPC router serves validated configs
- TanStack Query caches on the client
- Tour Kit renders the steps

Zero codegen. Full autocomplete.

**3/** The key trick: `.output(tourConfigSchema)` on the tRPC procedure.

This validates the response BEFORE it leaves the server. Bad placement value? 400 error. Missing title? Caught at the API boundary.

Not at runtime. Not in production.

**4/** Performance on a $7/month Railway instance:

- 12-step config cold query: 3-8ms
- Cached reads: <1ms
- Total payload: ~1.2KB gzipped

Your PM updates tour copy in the DB, users see it in 5 minutes. No deploy.

**5/** The comparison:

tRPC: end-to-end types, auto validation, built-in cache, no codegen
REST: manual types, no validation, manual cache
GraphQL: strong types, but codegen required
Server Actions: good in Next.js, no cache layer

**6/** Full walkthrough with code examples, comparison table, and FAQ:

https://usertourkit.com/blog/trpc-product-tour-config

(Disclosure: I built Tour Kit, but the tRPC pattern works with any tour library that takes a steps array)
