## Subreddit: r/reactjs

**Title:** I compared Floating UI and Popper.js for tooltip/tour positioning in 2026 — here's what I found

**Body:**

I've been working with both positioning libraries while building a product tour engine, and I wanted to share what I learned for anyone choosing between them.

The short version: Popper.js (`@popperjs/core`) hasn't shipped a meaningful update since 2022. Floating UI (`@floating-ui/dom`) took over as the maintained successor from the same creator. The core difference is architectural — Floating UI uses tree-shakeable middleware functions instead of Popper's monolithic modifier system, which gets the bundle from ~7kB to ~3kB gzipped.

A few things that surprised me during testing:

- React 19's concurrent rendering can conflict with Popper.js's direct DOM manipulation. We hit this specifically with `useTransition` during tour step animations.
- Floating UI's async `computePosition()` prevents layout thrashing in multi-step tours. Popper.js's sync approach can cause visible jank when repositioning quickly.
- CSS Anchor Positioning (Chrome 125+) handles simple static tooltips well, but Safari hasn't shipped it yet and there's no programmatic control for dynamic repositioning. Not ready to replace JS positioning for tours.

For the migration path: `createPopper()` becomes `computePosition()`, `preventOverflow` becomes `shift()`, and the big change is that Floating UI returns `{ x, y }` instead of touching the DOM directly. The concepts map 1:1.

I also mapped out which tour libraries use which engine — React Joyride v3 moved to Floating UI, Shepherd.js bundles it internally, and Reactour still uses Popper.js.

Full write-up with code examples and migration table: https://usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning

Happy to answer questions about the positioning internals or the React 19 edge cases.
