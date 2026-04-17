---
title: "How to build a product tour heatmap (clicks, dismissals, completions)"
slug: "product-tour-heatmap"
canonical: https://usertourkit.com/blog/product-tour-heatmap
tags: react, javascript, web-development, analytics
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-heatmap)*

# How to build a product tour heatmap (clicks, dismissals, completions)

Your tour analytics dashboard says 61% of users complete the onboarding flow. But where exactly did the other 39% bail — the close button on step 3, an outside click during step 2, the ESC key before step 1 even rendered? Funnel charts give you the *what*. A product tour heatmap gives you the *where*.

According to Chameleon's analysis of 15 million tour interactions, roughly 40% of modals get dismissed on sight ([Chameleon Benchmark Report, 2025](https://www.chameleon.io/benchmark-report)). That statistic is useless without spatial context.

Full article with all 4 implementation steps, benchmarks, troubleshooting, and accessibility patterns: [usertourkit.com/blog/product-tour-heatmap](https://usertourkit.com/blog/product-tour-heatmap)

> Note: This is a summary version. The full tutorial includes complete TypeScript code for the event collector, Canvas renderer, step-level filtering dashboard, and accessible data table fallback.

## Key takeaways

- The event collector adds <0.3KB to production. The heatmap visualization lazy-loads at ~1.2KB.
- simpleheat (700 bytes) beats heatmap.js (~3KB) for tour-specific use cases.
- Track dismissal methods separately: close-button, outside-click, and ESC key carry different signals.
- Always include a data table fallback — Canvas elements are opaque to screen readers.
- Average tour completion rate is 61% (Chameleon, 15M interactions). Top 1% tours never exceed 5 steps.
