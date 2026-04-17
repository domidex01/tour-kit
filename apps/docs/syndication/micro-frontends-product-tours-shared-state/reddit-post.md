## Subreddit: r/reactjs

**Title:** I tested 3 product tour libraries inside Module Federation and none of them worked across remotes. Here's what I found.

**Body:**

I'm building a product tour library (Tour Kit) and wanted to understand how existing libraries handle micro-frontend architectures. The short answer: they don't.

I set up a Module Federation host with two React remotes and tried React Joyride, Shepherd.js, and Driver.js:

- **React Joyride 2.9**: JoyrideProvider context can't span separate `createRoot()` boundaries. `querySelector` returned null for elements inside remote modules.
- **Shepherd.js 14.x**: Partially works if elements are in the same DOM tree, but state is per-instance.
- **Driver.js 1.x**: Actually works for targeting elements (uses global DOM queries), but has no state management, persistence, or accessibility features.

After that, I tested three coordination patterns:

1. **CustomEvent bus** (~0.5KB) — Each module dispatches/listens for events on `window`. Works across any framework. No type safety though.
2. **Shared Zustand singleton** (~3KB) — Put a vanilla store in MF's `shared` scope. Real shared state, but we hit a nasty 2-day bug from zustand version mismatches between remotes.
3. **Tour Kit headless hooks + event coordination** (~8KB per module) — Run independent Tour Kit instances per module, coordinate via events. Gets you focus trapping and keyboard nav within each boundary.

The biggest surprise: `focus()` works across module boundaries (it's a DOM concept, not React). But focus *trapping* breaks because trap libraries monitor a container element and lose track when focus moves to a different React root.

Our workaround: deactivate the focus trap in the current module, move focus at the DOM level, then let the receiving module activate its own trap.

Honestly, none of these patterns are clean. If your onboarding flow can stay within a single module, keep it there.

Full article with all the TypeScript code and comparison tables: https://usertourkit.com/blog/micro-frontends-product-tours-shared-state
