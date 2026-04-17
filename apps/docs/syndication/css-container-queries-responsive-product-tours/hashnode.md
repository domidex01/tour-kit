---
title: "Using CSS container queries for responsive product tours"
slug: "css-container-queries-responsive-product-tours"
canonical: https://usertourkit.com/blog/css-container-queries-responsive-product-tours
tags: react, css, javascript, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/css-container-queries-responsive-product-tours)*

# Using CSS container queries for responsive product tours

Your product tour tooltip looks perfect in the main content area. Then a user opens it inside a narrow sidebar, and the whole thing collapses into a mess of overflowing text and clipped buttons. The fix most tour libraries reach for (a JavaScript `ResizeObserver` listening to the window) misses the point entirely. The viewport didn't change. The container did.

CSS container queries let tour components adapt based on their parent element's size, not the browser window. As of April 2026, container size queries have [96% global browser support](https://caniuse.com/css-container-queries). No polyfill needed.

By the end of this tutorial, you'll have tour step tooltips that automatically switch between compact and expanded layouts depending on where they render: sidebar, modal, main content, or anywhere else.

```bash
npm install @tourkit/core @tourkit/react
```

[Full article with all code examples, comparison table, and Tailwind v4 variant at usertourkit.com](https://usertourkit.com/blog/css-container-queries-responsive-product-tours)
