## Title: Designing a plugin system for a product tour library

## URL: https://usertourkit.com/blog/building-plugin-system-product-tour-library

## Comment to post immediately after:

I built Tour Kit, a headless product tour library for React, and one of the more interesting engineering problems was designing the analytics plugin system.

The interface is 5 methods (only `track` required) and 17 typed event types. The tricky parts were: (1) event batching that reduces ~22 network requests per tour down to 2-3 flushes while ensuring critical events like `tour_completed` bypass the queue immediately, (2) per-plugin error isolation so a broken analytics integration never crashes the tour, and (3) tree-shaking via dynamic `import()` so vendor SDKs only load when their plugin is registered.

The article walks through real TypeScript source code, including the PostHog plugin internals, the event queue implementation, and a comparison of how React Joyride, Shepherd.js, and Driver.js handle the same problem (mostly through callbacks and event emitters without lifecycle management or batching).

Worth noting: Tour Kit doesn't have a visual builder and requires React developers. The plugin system's tree-shaking only works because the library controls the pipeline end-to-end.
