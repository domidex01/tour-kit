Here's a pattern I haven't seen documented anywhere: using tRPC to serve product tour configurations from the server instead of hardcoding them in React components.

The problem is real. Your PM wants to change step 3's copy. That means a code change, PR review, build, and deploy. For a tooltip.

The solution: define a Zod schema for tour steps, serve them through a tRPC router, and cache with TanStack Query. Total glue code: about 40 lines of TypeScript.

Results from our testing: 3-8ms cold queries for a 12-step config, under 1ms on cached reads. Tour content updates reach users within 5 minutes, no deploy needed.

The key insight: tRPC's `.output()` validator catches malformed step data at the server boundary. Invalid placement value? 400 error on the server, not a broken tooltip in production.

Full walkthrough with code: https://usertourkit.com/blog/trpc-product-tour-config

#react #typescript #trpc #webdevelopment #opensource
