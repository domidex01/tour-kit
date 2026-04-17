# Floating UI vs Popper.js: Which One Should You Use in 2026?

## A practical comparison for anyone building tooltips, tours, or popovers

*Originally published at [usertourkit.com](https://usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning)*

If you're building anything that positions a floating element next to a reference element in 2026, you're choosing between two libraries from the same creator. Popper.js and Floating UI solve the same problem, but one hasn't shipped a release since 2022.

Floating UI replaced Popper.js with a smaller, tree-shakeable architecture. The core package (`@floating-ui/dom`) ships at roughly 3kB gzipped compared to Popper.js's 7kB. It uses a middleware pipeline instead of Popper's modifier system, and every function is async by default to avoid blocking the main thread during DOM measurement.

### What actually changed

The concepts map almost one-to-one between the two libraries:

- `createPopper()` becomes `computePosition()` (now async)
- `preventOverflow` modifier becomes `shift()` middleware
- `flip` and `offset` work the same way with different import paths
- Floating UI returns `{ x, y }` coordinates instead of modifying the DOM directly

That last point is the biggest behavioral shift. Popper.js applied styles to your element automatically. Floating UI gives you the numbers and lets you decide how to render them. This plays much better with React, Vue, and Svelte.

### Why it matters for product tours

Tour libraries depend heavily on positioning. React Joyride v3 migrated to `@floating-ui/react-dom`. Shepherd.js bundles Floating UI internally. Reactour still uses `@popperjs/core`, which creates React 19 compatibility issues in concurrent rendering edge cases.

If you're evaluating tour libraries, check which positioning engine they use. It predicts bundle weight, TypeScript support, and whether you'll hit edge cases with modern React.

### Three mistakes teams make with positioning

1. Forgetting to call the `autoUpdate()` cleanup function on unmount (causes memory leaks)
2. Using `position: absolute` with `left`/`top` instead of `transform: translate()` (triggers layout recalculation)
3. Hardcoding `placement: 'bottom'` without `flip()` middleware (breaks on responsive layouts)

### The verdict

For new projects, Floating UI. For legacy apps not in active development, Popper.js still works fine. The migration is straightforward when you're ready.

Full article with comparison tables, React code examples, and CSS anchor positioning analysis: [usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning](https://usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning)

*Submit to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium*
