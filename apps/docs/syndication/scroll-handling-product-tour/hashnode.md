---
title: "Scroll handling in product tours: the complete technical guide"
slug: "scroll-handling-product-tour"
canonical: https://usertourkit.com/blog/scroll-handling-product-tour
tags: react, javascript, web-development, accessibility
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/scroll-handling-product-tour)*

# Scroll handling in product tours: the complete technical guide

Most product tour libraries get scroll wrong. React Joyride alone has nine open GitHub issues caused by scroll misbehavior: spotlight misalignment after scrolling, unintended page jumps when scrolling is disabled, and broken horizontal scroll in data tables. Sentry's engineering team built a React product tour and openly skipped scroll handling entirely, leaving off-screen elements unreachable.

This guide covers `scrollIntoView`, `scroll-margin`, Floating UI's `autoUpdate`, Intersection Observer, and the WCAG focus rules that almost everyone ignores.

> Full article with all code examples and comparison tables at [usertourkit.com/blog/scroll-handling-product-tour](https://usertourkit.com/blog/scroll-handling-product-tour)

*(Same body content as Dev.to version — see devto.md for the full article body)*
