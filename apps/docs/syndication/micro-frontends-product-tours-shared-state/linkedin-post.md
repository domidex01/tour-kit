Product tour libraries assume your app is one React tree.

Micro-frontends are multiple React trees.

That mismatch breaks every product tour library I tested (React Joyride, Shepherd.js, Driver.js) when you try to run an onboarding flow across Module Federation remotes.

I wrote up the three coordination patterns that actually work:

1. CustomEvent bus — 0.5KB, works across any framework, zero shared dependencies
2. Shared Zustand singleton via Module Federation — type-safe shared state, but version mismatches between teams break it silently
3. Headless tour hooks with event coordination — preserves accessibility (focus trapping, keyboard nav) within each module boundary

The most interesting finding: focus() calls work across React root boundaries (it's a DOM concept), but focus trapping breaks because trap libraries lose track of the focus target.

With Module Federation hitting 3.2M weekly npm downloads, more teams are going to face this problem.

Full article with TypeScript implementations: https://usertourkit.com/blog/micro-frontends-product-tours-shared-state

#react #microfrontends #javascript #webdevelopment #productdevelopment #opensource
