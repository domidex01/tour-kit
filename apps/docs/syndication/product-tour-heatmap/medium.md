# How to Build a Product Tour Heatmap That Shows Where Users Actually Click

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-heatmap)*

**Your tour analytics dashboard says 61% of users complete the onboarding flow. But where exactly did the other 39% bail?**

Funnel charts tell you *what* step users dropped off at. A heatmap tells you *where* on the screen they clicked, dismissed, or completed each step. That spatial context is the difference between "step 3 has high drop-off" and "users keep clicking outside the popover boundary on step 3."

According to Chameleon's analysis of 15 million tour interactions, roughly 40% of modals get dismissed on sight. That number is useless without knowing where those dismissals happen.

## What we built

A Canvas-based heatmap overlay that tracks three interaction types during a product tour:

- **Clicks** — where users interact with tour elements
- **Dismissals** — where and how users abandon steps (close button vs. outside click vs. ESC key)
- **Completions** — which elements get the "done" click

The implementation uses simpleheat (700 bytes, Canvas-based) for rendering and a plain TypeScript module for event collection. Total overhead: under 0.3KB in production, with the visualization lazy-loaded on demand.

## The key insight: dismissal methods aren't equal

Not all dismissals carry the same signal. A close-button click is intentional exit. An outside click might mean the user didn't realize they were in a tour. An ESC key press often means frustration. Tracking these separately gives you three distinct signals instead of one.

## Performance numbers

The event collector runs at under 0.01ms per event — it's just an array push. The heatmap renderer handles 1,000 points in ~2ms on an M1 MacBook. Tour Kit's core is under 8KB gzipped, and the heatmap adds 0.3KB to production.

## What the heatmap tells you (and what it doesn't)

It answers spatial questions: which UI zone draws the most clicks during step 2, whether dismissals cluster near the close button or outside the popover boundary.

It doesn't tell you *why*. For that, combine heatmap data with qualitative signals — a one-question survey triggered immediately after dismissal captures context while it's fresh.

Full tutorial with TypeScript code, step-level filtering, accessible data table fallback, and troubleshooting: [usertourkit.com/blog/product-tour-heatmap](https://usertourkit.com/blog/product-tour-heatmap)

---

*Suggest submitting to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium.*
