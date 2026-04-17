---
title: "Web components vs React components for product tours"
slug: "web-components-vs-react-product-tour"
canonical: https://usertourkit.com/blog/web-components-vs-react-product-tour
tags: react, javascript, web-development, web-components
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/web-components-vs-react-product-tour)*

# Web components vs React components for product tours

The pitch sounds great on paper: build your product tour as a set of web components, and it works in React, Vue, Angular, Svelte, and plain HTML. No framework lock-in. Ship once, use everywhere. GitHub does it with their `<tool-tip>` element. Salesforce built their entire Lightning design system on web components.

But product tours aren't buttons or tooltips. They need overlays that cover the entire viewport, spotlight cutouts that track moving elements, focus traps that prevent keyboard escape, and persistent state across sessions. When we tried building a positioning engine as a custom element, shadow DOM turned a straightforward overlay into a battle with style encapsulation, event retargeting, and z-index isolation.

This article breaks down where web components work, where they break for product tours, and why we chose React. I built Tour Kit as a solo developer, so take the architectural opinions with that context.

## The shadow DOM problem

Shadow DOM makes web components self-contained. It also makes them painful for product tours.

**Overlay positioning**: Each shadow root creates its own stacking context. An overlay inside a shadow root can't reliably sit above elements in other shadow roots.

**Style piercing**: The `/deep/` and `::shadow` combinators are gone. Styling a tour tooltip inside a shadow root with Tailwind classes requires a separate Tailwind build scoped to that root.

**Focus trapping**: WCAG 2.1 AA requires modal overlays to trap focus. Shadow DOM hides elements from `document.querySelectorAll`. Closed shadow roots are completely inaccessible.

**Event retargeting**: Click events crossing shadow boundaries lose their original target. Analytics tracking which button was clicked requires `event.composedPath()` in every listener.

## React handles tour complexity better

React's Context API and hooks coordinate the 5+ subsystems a product tour needs: step state machine, positioning engine, spotlight renderer, focus trap, and persistence layer. All share state in a single render cycle.

With web components, replicating this requires CustomEvent dispatching, property drilling, or Lit's `@lit/context` — none as ergonomic as `useContext`.

## Bundle size comparison

| Approach | Base library (gzipped) | Tour logic | Total |
|---|---|---|---|
| Vanilla custom elements | 0KB | ~15-25KB | ~15-25KB |
| Lit-based | ~17KB | ~15-25KB | ~32-42KB |
| React + Tour Kit | 0KB (React already loaded) | ~20KB | ~20KB incremental |

If you already ship React, Tour Kit adds 20KB. A Lit-based tour adds 17KB of Lit *plus* tour logic on top of React.

## When web components make sense

- **Existing WC design systems** (Salesforce Lightning, Adobe Spectrum) — hints/beacons that match the architecture
- **Third-party embed widgets** — shadow DOM protects your tour styles from the host page's CSS
- **Simple standalone tooltips** — no step coordination needed

Web components work for isolated pieces. They struggle when pieces need to coordinate.

## Key takeaways

1. Shadow DOM encapsulation actively fights the cross-cutting concerns product tours need
2. React's hooks + context + concurrent features make tour orchestration straightforward
3. Framework-agnostic core logic + framework-specific rendering is the pragmatic middle ground
4. Web components shine for leaf components, not orchestration layers

Full article with code examples and benchmark data: [usertourkit.com/blog/web-components-vs-react-product-tour](https://usertourkit.com/blog/web-components-vs-react-product-tour)
