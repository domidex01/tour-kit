---
title: "React Compiler and product tours: what automatic memoization means"
slug: "react-compiler-product-tours-automatic-memoization"
canonical: https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization
tags: react, javascript, web-development, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization)*

# React Compiler and product tours: what automatic memoization means

React Compiler hit stable v1.0 in October 2025. It analyzes your components at build time and inserts memoization automatically, eliminating most manual `useMemo` and `useCallback` calls. Meta's Quest Store saw interactions speed up 2.5x after enabling it. Expo SDK 54 ships with it on by default. Next.js 16 marks it stable.

But what does automatic memoization mean for product tour libraries? Tours sit in an unusual spot in the component tree. They depend on step-driven re-renders, portal-based overlays, DOM-ref positioning, and callback prop stability.

We tested Tour Kit with React Compiler enabled across three different app configurations. Here's what we found, what broke in other libraries, and why headless architecture turns out to be the safest bet in a compiler-first world.

[Read the full article with all code examples and performance data](https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization)

## Key findings

**Performance data from production:**

| App | Metric | Improvement |
|---|---|---|
| Meta Quest Store | Interaction speed | 2.5x faster |
| Sanity Studio | Render time (87% compiled) | 20-30% reduction |
| Wakelet | INP | 275ms to 240ms (-15%) |

**Library compatibility:**

- Framework-agnostic libraries (Driver.js, Shepherd.js): Completely unaffected
- Non-headless React libraries (React Joyride, older Reactour): Highest risk, untested
- Headless React libraries (Tour Kit): Best positioned, hooks compile cleanly

**The honest take:** Independent testing by Nadia Makarevich found the compiler fixed only 15-20% of re-render cases automatically. It amplifies well-structured code. It doesn't rescue poorly structured state management.

## Three patterns that break under the compiler

1. **Memoized callback identity** - Effects that depend on callback references may not fire
2. **Ref reads during render** - Compiler skips these components entirely
3. **Unstable context values** - New object references per render defeat memoization

Full code examples and fixes in the [original article](https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization).
