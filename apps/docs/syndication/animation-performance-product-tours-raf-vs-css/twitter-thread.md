## Thread (6 tweets)

**1/** Your product tour animations work fine in dev. Ship them into a real app with 300 components and they start dropping frames.

I profiled why. The answer isn't "CSS vs rAF" — it's that you need both, working together.

**2/** CSS transitions on `transform` + `opacity` run on the GPU compositor thread. Zero main-thread cost. Even if your host app is mid-React-render, the tooltip fade stays at 60fps.

But CSS can't track scroll position. That's where rAF comes in.

**3/** The two-layer architecture most articles miss:

- rAF reads the anchor element's position
- CSS applies it via `transform: translate()`

One computes. The other renders. They're not competing — they're a pipeline.

**4/** The gotcha that only shows up in production: implicit compositing.

A tooltip animated at z-index 9999 forces every higher-stacked element onto its own GPU layer.

Measured: 3 layers in a demo vs 14 in a production dashboard. Each costs ~307KB of GPU RAM (x9 on mobile).

**5/** Another antipattern: updating CSS variables per frame for spotlight positioning.

One documented case: 1,300+ element style recalculations at 8ms/frame. That's the entire 120fps budget on a single style recalc.

Fix: use `transform` on a positioned element instead.

**6/** Full deep-dive with code examples, a WAAPI section, prefers-reduced-motion guidance, and the complete decision tree:

https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css
