---
title: "Why most product tour libraries break in strict mode"
slug: "why-product-tour-libraries-break-strict-mode"
canonical: https://usertourkit.com/blog/why-product-tour-libraries-break-strict-mode
tags: react, javascript, web-development, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/why-product-tour-libraries-break-strict-mode)*

# Why most product tour libraries break in strict mode

You add a product tour library to your React app. Works fine in production. Then you enable `<React.StrictMode>` and everything falls apart: overlays flash twice, tooltips render in the wrong position, keyboard listeners fire double, scroll locks freeze the page permanently. You search the library's GitHub issues and find the same advice repeated in every thread: "just remove StrictMode."

That advice is wrong. And the real problem runs deeper than most developers realize.

React Strict Mode is a development-only wrapper that stress-tests your components by double-invoking renders, effects, and state initializers. Most product tour libraries were built on patterns that cannot survive this double invocation — and the failures expose architectural decisions that cause real problems in production too.

We built [Tour Kit](https://usertourkit.com) with Strict Mode compatibility as a design constraint from day one. Here's what we learned about why other libraries break, what React actually does under the hood, and how to audit your tour library before it bites you.

## The 7 patterns that break under Strict Mode

Product tour libraries combine imperative DOM manipulation with global state, event listener management, scroll locking, and positioning calculations — all triggered from `useEffect` hooks that often lack cleanup. Here are the seven patterns that fail:

| Pattern | What breaks | Symptom |
|---|---|---|
| Singleton tour instance (`new Tour()` in effect) | Two tour objects created | Tour jumps to step 0 randomly |
| DOM overlay injection without cleanup | Two overlay divs appended | Overlay flickers or double opacity |
| `useEffect` without return for init | Tour initializes twice | First step vanishes |
| Ref-guarded event listeners | Listeners added twice (React #24670) | Keyboard shortcuts fire twice |
| Global scroll lock | Set twice, wrong cleanup order | Page stays locked |
| Module-level step index | Index resets, side effects persist | Wrong step number |
| Popper.js without `.destroy()` | Two positioning instances | Tooltip jitters |

## The ref bug nobody talks about

React's GitHub issue #24670 documents a bug where Strict Mode's simulated unmount does **not** clear `ref.current`. Tagged "Needs Investigation" since April 2024, it remains unresolved. Code that guards listener attachment with `if (ref.current)` adds listeners twice because the ref was never nulled.

This affects every tour library that uses refs to track target DOM elements for tooltip anchoring.

## 5-point audit checklist

Run these checks against any tour library with Strict Mode enabled:

1. **Overlay count** — Are there duplicate overlay divs in the DOM?
2. **Event listener leak** — Do keyboard/scroll listeners persist after tour closes?
3. **Scroll lock release** — Can you scroll after closing a tour that locks scrolling?
4. **Step counter integrity** — Does the tour survive a Vite hot reload?
5. **Console noise** — Any `findDOMNode` warnings or duplicate effect logs?

Full article with code examples and detailed library-by-library analysis: [usertourkit.com/blog/why-product-tour-libraries-break-strict-mode](https://usertourkit.com/blog/why-product-tour-libraries-break-strict-mode)
