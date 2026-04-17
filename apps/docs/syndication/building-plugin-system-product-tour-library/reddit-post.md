## Subreddit: r/reactjs

**Title:** I wrote up how I designed the plugin system for a product tour analytics library

**Body:**

I've been building a product tour library (Tour Kit) and one of the trickier parts was designing the analytics plugin system. Wanted to share the technical decisions and tradeoffs since I haven't seen much written about plugin architecture specifically for tour/onboarding libraries.

The core interface is intentionally small: 5 methods, only `track` is required. A custom plugin fits in 25 lines. The interesting parts:

- **Event batching with critical event bypass.** A 10-step tour generates ~22 events. The queue batches them (default 10 events or 5s), but `tour_completed` and `tour_abandoned` bypass the queue and flush immediately. Got burned early by dispatching the critical event before flushing the queue, which made dashboards show tours "completing" before the last step was viewed.

- **Per-plugin error isolation.** Every `plugin.track()` call is wrapped in try/catch. A broken Mixpanel plugin never crashes the tour or prevents PostHog from receiving events. React Joyride's callback approach doesn't have this; if `onStepChange` throws, the tour breaks.

- **Tree-shaking via dynamic import.** Each plugin uses `import()` for vendor SDKs, so PostHog's 45KB gzipped SDK only loads if you register the PostHog plugin. A PostHog-only setup ships 2.3KB of analytics code vs React Joyride's 37KB monolithic bundle.

- **Factory functions over classes.** Every plugin is a function that returns a typed interface object. Closures handle state. No `new`, no inheritance, better composition.

The 17 event types use a TypeScript union type, so `'tour_compelted'` fails at compile time instead of silently doing nothing at runtime.

Full writeup with source code, comparison table across 4 tour libraries, and 4 common mistakes I've seen developers make: https://usertourkit.com/blog/building-plugin-system-product-tour-library

Curious if anyone else has built plugin systems for React libraries and what patterns worked. The hardest part was getting the event queue ordering right.
