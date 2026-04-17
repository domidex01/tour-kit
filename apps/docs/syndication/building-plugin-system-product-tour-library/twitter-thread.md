## Thread (6 tweets)

**1/** Most product tour libraries handle analytics through callbacks. React Joyride has a `callback` prop. Shepherd.js uses `.on('complete')`. None of them tree-shake, batch, or isolate errors.

I built a typed plugin system instead. Here's how it works:

**2/** The interface is tiny: 5 methods, only `track` required. A custom plugin fits in 25 lines of TypeScript.

But the real engineering is in what the tracker does BEFORE events reach plugins: timestamps, session IDs, duration calculation, and per-plugin try/catch wrapping.

**3/** Event batching matters more than you'd think. A 10-step tour generates ~22 events. The queue batches them (10 events or 5s), but critical events like `tour_completed` bypass the queue entirely.

Early bug: dispatching the critical event before flushing made dashboards show tours "completing" before the last step.

**4/** Tree-shaking via dynamic import() means the PostHog SDK (45KB gzipped) only loads if you register the PostHog plugin. A PostHog-only setup ships 2.3KB of analytics code.

React Joyride ships 37KB regardless.

**5/** 4 mistakes I've seen developers make:
- Synchronous-only track methods (breaks async SDKs)
- Missing SSR guards (crashes Next.js builds)
- Duplicate SDK initialization (global state conflicts)
- Forgetting destroy() (leaks timers under StrictMode)

**6/** Full writeup with source code, PostHog plugin internals, and a comparison table across 4 tour libraries:

https://usertourkit.com/blog/building-plugin-system-product-tour-library
