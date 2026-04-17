How do you design a plugin system that tree-shakes, batches events, and never crashes production?

I wrote up the engineering behind Tour Kit's analytics plugin architecture. The interface is 5 typed methods (only one required) and supports 17 event types across tour, step, hint, and feature adoption domains.

Key decisions:
- Event batching reduces ~22 network requests per tour to 2-3 flushes, with critical events like tour_completed bypassing the queue
- Per-plugin try/catch isolation ensures a broken Mixpanel plugin never crashes the tour or blocks PostHog
- Dynamic import() means vendor SDKs only load when their plugin is registered (2.3KB vs 37KB monolithic bundles)

The article includes real TypeScript source code, a comparison table against React Joyride/Shepherd/Driver.js, and 4 common mistakes I've seen developers make when building custom plugins.

Full deep-dive: https://usertourkit.com/blog/building-plugin-system-product-tour-library

#react #typescript #javascript #pluginarchitecture #opensource #webdevelopment
