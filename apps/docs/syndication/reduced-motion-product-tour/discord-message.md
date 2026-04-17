## Channel: #articles or #a11y in Reactiflux

**Message:**

Wrote up how to add reduced motion support to React product tours — the cumulative motion problem (14+ animation events in a typical tour flow) is worse than single-component animations but almost no one covers it. Includes an SSR-safe hook, CSS fallbacks for first paint, an in-tour toggle, and Playwright tests.

https://usertourkit.com/blog/reduced-motion-product-tour

Would love feedback on the SSR initialization approach (defaulting to false vs true for the hook). There's a tradeoff between flash-of-reduced-motion and flash-of-full-animation.
