---
title: "Micro-frontends and product tours: shared state across federated modules"
slug: "micro-frontends-product-tours-shared-state"
canonical: https://usertourkit.com/blog/micro-frontends-product-tours-shared-state
tags: react, javascript, web-development, micro-frontends
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/micro-frontends-product-tours-shared-state)*

# Micro-frontends and product tours: shared state across federated modules

Product tours assume they own the page. They expect a single React tree, a single state container, and a single DOM they can query from root to leaf. Micro-frontends break every one of those assumptions. Your shell app loads a header from team A, a dashboard from team B, and a settings panel from team C. Each has its own React instance, its own bundler, its own deploy pipeline.

This article covers three coordination patterns we tested for sharing tour state across federated modules: CustomEvent bus, shared singleton via Module Federation, and Tour Kit with a coordination wrapper.

We tested React Joyride, Shepherd.js, and Driver.js in a Module Federation setup. None of them handle cross-module tours out of the box. React Joyride's context can't span React root boundaries. Shepherd.js partially works if elements share the same DOM. Driver.js came closest with global DOM queries but has no state management or accessibility features.

## The three patterns

**Pattern 1: CustomEvent bus** — Zero dependencies, works across frameworks. Each module dispatches and listens for custom events on `window`. Simple but no type safety.

**Pattern 2: Shared singleton via Module Federation** — Put a Zustand store in MF's `shared` scope. Real shared state, but version mismatches break it silently.

**Pattern 3: Tour Kit coordination wrapper** — Run Tour Kit's headless hooks independently in each module, coordinate via events. Gets you accessibility features (focus trapping, keyboard nav) within each boundary.

| Factor | CustomEvent bus | Shared singleton | Tour Kit + coordinator |
|---|---|---|---|
| Setup complexity | Low (copy one file) | Medium (MF config + store) | Medium (hook + events) |
| Accessibility | DIY | DIY | Built-in |
| Version coupling | None | High | Low |
| Bundle cost | ~0.5KB | ~3KB | ~8KB per module |

## Key takeaways

- CustomEvent bus is the most practical starting point for polyglot stacks
- Shared singletons give type-safe state but create deploy coupling
- Tour Kit's headless hooks provide accessibility without rebuilding from scratch
- localStorage persistence works across micro-frontends on the same origin

Full article with complete TypeScript code examples: [usertourkit.com/blog/micro-frontends-product-tours-shared-state](https://usertourkit.com/blog/micro-frontends-product-tours-shared-state)
