## Subreddit: r/reactjs

**Title:** I wrote up how to serve product tour steps from a tRPC backend instead of hardcoding them in JSX

**Body:**

Most tour libraries (React Joyride, Shepherd, etc.) expect you to define steps as static arrays in your components. That works until someone needs to update step copy and it requires a full deploy cycle.

I've been working on an approach where tour step configurations live on the server, served through a tRPC router with Zod validation. The flow is:

1. Define a Zod schema for tour steps (target selector, title, content, placement)
2. Create a tRPC procedure that returns validated configs from your database
3. Call `trpc.tour.getConfig.useQuery()` on the client
4. Pass the typed steps array directly to the tour hook

tRPC's TypeScript inference means the client gets full autocomplete on step fields without any codegen. TanStack Query handles caching so you're not hitting the API on every render. We measured 3-8ms cold queries for a 12-step config, under 1ms on cached reads.

The interesting part is the `.output(tourConfigSchema)` validator on the tRPC procedure. It catches malformed step data on the server before it reaches the client. If someone adds a step with `placement: "center"` (not in the enum), it fails at the API boundary instead of breaking the tour UI.

Wrote it up with full code examples and a comparison table (tRPC vs REST vs GraphQL vs Server Actions for serving tour config): https://usertourkit.com/blog/trpc-product-tour-config

Disclosure: I built the tour library (Tour Kit) mentioned in the article. The tRPC integration pattern works with any tour library that accepts a steps array, though.

Curious if anyone else has done something similar or if you're using a different approach for server-managed tour configs.
