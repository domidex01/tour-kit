---
title: "Tree-shaking product tour libraries: what actually gets removed?"
slug: "tree-shaking-product-tour-libraries"
canonical: https://usertourkit.com/blog/tree-shaking-product-tour-libraries
tags: react, javascript, web-development, performance
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tree-shaking-product-tour-libraries)*

# Tree-shaking product tour libraries: what actually gets removed?

You add a product tour library to your React app, import one hook, and assume the bundler strips out everything you didn't use. Sometimes it does. Often it doesn't. The difference between a 3KB import and a 34KB import comes down to how the library was built, not how smart your bundler is.

We ran Vite's bundle analyzer against five tour libraries, importing a single component from each, and measured what survived tree-shaking. The results were uneven. React Joyride shipped 31KB of code regardless of what we imported. Tour Kit shipped 2.9KB for the same single-hook import. Driver.js landed at 5KB. Shepherd.js brought in 22KB.

We built Tour Kit, so take those numbers with appropriate skepticism. Every measurement below is reproducible using `npx vite-bundle-visualizer`.

| Library | Full bundle (gzipped) | Single-hook import (gzipped) | Tree-shaking savings | sideEffects: false |
|---|---|---|---|---|
| Tour Kit (core + react) | 8.1KB | 2.9KB | 64% | Yes |
| Driver.js 1.x | 5.1KB | 5.0KB | 2% | No |
| Shepherd.js 14.x | 25KB | 22KB | 12% | No |
| React Joyride 2.x | 34KB | 31KB | 9% | No |
| Intro.js 7.x | 29KB | 27KB | 7% | No |

The full article covers why each library behaves differently, how to verify tree-shaking in your own project, and the three most common mistakes that break dead-code elimination.

[Read the full article with code examples](https://usertourkit.com/blog/tree-shaking-product-tour-libraries)
