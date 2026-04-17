## Thread (6 tweets)

**1/** ~40% of product tour modals get dismissed on sight (Chameleon, 15M interactions). But funnel charts only tell you *which* step — not *where* on the screen users bailed. So I built a heatmap for it.

**2/** The setup: a plain TypeScript event collector (<0.3KB) records coordinates + interaction type + active step ID. No React dependency in the hot path — just an array push per event at <0.01ms overhead.

**3/** Key insight: not all dismissals are equal. Close-button clicks = intentional exit. Outside clicks = might not know they're in a tour. ESC key = frustration. Track them separately and you get three signals instead of one.

**4/** For rendering, simpleheat (700 bytes) beats heatmap.js (~3KB). Takes [x, y, intensity] arrays and draws to Canvas. Lazy-loaded so it adds zero bytes to your production bundle.

**5/** The real power is step-level filtering. "Where did users click during step 2?" is a completely different question from "where did users click during the tour?" Filter by step + interaction type to find exactly which UI zones cause confusion.

**6/** Full tutorial with TypeScript code, benchmarks, troubleshooting, and accessible data table fallback: https://usertourkit.com/blog/product-tour-heatmap
