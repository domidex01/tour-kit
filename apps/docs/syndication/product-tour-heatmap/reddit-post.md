## Subreddit: r/reactjs

**Title:** I built a Canvas-based heatmap for product tour interactions — here's what dismissal patterns actually look like

**Body:**

Been working on tracking where users click, dismiss, and complete steps during onboarding tours. Funnel charts tell you the drop-off rate, but they don't tell you *where* on the screen users bailed.

Turns out Chameleon analyzed 15 million tour interactions and found ~40% of modals get dismissed on sight. That's a known number. What isn't known is whether those dismissals came from the close button, an outside click, or the ESC key — each carries a different signal.

So I built a heatmap overlay using simpleheat (700 bytes, Canvas-based) that records coordinates per interaction type, per tour step. The event collector is a plain TypeScript module — no React dependency, just an array push per event (<0.01ms overhead). The visualization lazy-loads so it adds zero bytes to production.

The most useful thing turned out to be step-level filtering. "Where did users click during step 2?" is a fundamentally different question from "where did users click during the entire tour?" Filtering by step + interaction type narrows down exactly which UI zones cause confusion.

One gotcha: use `clientX`/`clientY`, not `pageX`/`pageY`. The Canvas overlay is `position: fixed`, so viewport coordinates match. Scroll offset breaks everything.

Full writeup with all the TypeScript code, accessible data table fallback (Canvas is opaque to screen readers), and benchmarks: https://usertourkit.com/blog/product-tour-heatmap

Built with Tour Kit (our headless React tour library), but the collector pattern works with any tour library that exposes step lifecycle callbacks.
