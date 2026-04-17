## Subreddit: r/reactjs

**Title:** I wrote a guide on adding Motion (Framer Motion) animations to product tours — LazyMotion, layoutId spotlights, and reduced-motion support

**Body:**

I spent a couple weeks building animated product tours for a React app and wrote up the patterns that actually worked. The core idea: use `AnimatePresence` for tooltip enter/exit, `layoutId` to morph a spotlight between target elements, and `MotionConfig reducedMotion="user"` to automatically respect prefers-reduced-motion.

The biggest win was using `LazyMotion` to defer the animation bundle. Product tours are triggered by user action, not on page load, so there's no reason to ship 34KB upfront. With `LazyMotion` + the `m` component, the initial cost is 4.6KB. The `domAnimation` feature pack (15KB) loads async when the tour first triggers.

One gotcha worth sharing: `layoutId` animations only interpolate when a previous element with the same ID existed in the tree. On the first tour step, the spotlight just appears — no morph. The fix is rendering an invisible zero-size spotlight at viewport center before the tour starts so step 1 morphs from center to target.

The reduced-motion approach is the cleanest I've found. Setting `reducedMotion="user"` on `MotionConfig` strips out all transform animations (x, y, scale, layout) while keeping opacity. Your tour still fades in and out, but nothing slides or bounces. One prop, no conditional logic. React Spring requires manual `useReducedMotion()` checks per animation.

Full article with all the code (5 components, spring configs, troubleshooting): https://usertourkit.com/blog/product-tour-framer-motion-animations

Uses Tour Kit for the tour logic, which is a library I work on. The animation patterns work with any tour setup though.
