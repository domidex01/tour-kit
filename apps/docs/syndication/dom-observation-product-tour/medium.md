# The DOM observation problem: why product tour tooltips break

## How ResizeObserver, MutationObserver, and IntersectionObserver each solve a different positioning challenge

*Originally published at [usertourkit.com](https://usertourkit.com/blog/dom-observation-product-tour)*

Product tour tooltips break when the DOM changes underneath them. A target element resizes, a sidebar collapses, a lazy-loaded image pushes content down. Your carefully positioned tooltip now points at nothing.

The browser gives you three observer APIs to handle this. None of them cover the full picture on their own. Understanding which observer solves which problem is the difference between a tour that works on a demo page and one that survives real user sessions.

## The core problem: no position observer exists

As of April 2026, the W3C has no `PositionObserver` or `ClientRectObserver` spec. A WICG proposal exists but hasn't progressed. Tour libraries must combine multiple observer APIs with event listeners to approximate position tracking.

Floating UI, the positioning engine used by most modern tooltip libraries, runs four observation strategies simultaneously. Position updates take roughly 1ms.

## Which observer does what

**ResizeObserver** detects element size changes. It fires before paint, after layout. Ideal for tooltip repositioning when a target resizes. Requires manual `disconnect()` or it leaks memory.

**MutationObserver** detects DOM tree changes: elements added, removed, or having their attributes changed. It solves the "target doesn't exist yet" problem. Garbage collected automatically — no disconnect needed for memory safety.

**IntersectionObserver** detects element visibility relative to the viewport. It answers: "Should I show this step right now, or is the target scrolled out of view?" Also requires manual `disconnect()`.

Jake Archibald from the Chrome team confirmed: "ResizeObserver & IntersectionObserver need to be manually disconnected, else they leak memory through their callback. MutationObserver and event listeners don't have this issue."

A study of 500 repositories found 787 instances of missing observer disconnects, leaking roughly 8 KB per observation cycle.

## The cleanup contract

Memory leaks compound. A tour with 10 steps that doesn't clean up properly leaks roughly 80 KB per session. Over a 30-minute session with 5 tour activations, that's 400 KB of leaked DOM references.

The rules:
- When a step deactivates: disconnect ResizeObserver and IntersectionObserver on the current target
- When the tour closes: disconnect all active observers, remove all event listeners
- When a target element is removed: you must `unobserve()` before the element is removed, or the observer retains a reference to the detached node

## CSS-first vs observer-first

Not every tour needs observers. Sentry Engineering built their product tour using CSS-only: z-index layering, pseudo-elements for spotlight overlays. Their key insight: "We are not re-parenting children ever! This is critical to avoiding layout shift."

The CSS-first approach works when targets are static. The observer-first approach is necessary when targets resize, may not exist when the tour starts, or when the page layout shifts during the tour. Most real-world SaaS products need observers.

## Key takeaways

1. No single browser API tracks position changes — you need all three observers plus event listeners
2. ResizeObserver and IntersectionObserver leak memory without explicit `disconnect()`. MutationObserver doesn't.
3. The `ResizeObserver loop limit exceeded` error is benign — filter it from error monitoring
4. Scope MutationObserver narrowly to avoid the firehose problem
5. Tour Kit handles all observer lifecycle internally — you just define steps

Full article with code examples: [usertourkit.com/blog/dom-observation-product-tour](https://usertourkit.com/blog/dom-observation-product-tour)

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
