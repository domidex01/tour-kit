## Thread (6 tweets)

**1/** Most React product tours feel static — tooltip appears, click next, another tooltip pops up. No spatial connection between steps. Here's how to fix that with Motion (Framer Motion) in under 5KB initial payload.

**2/** The secret weapon: LazyMotion. Product tours are user-triggered, not page-load critical. Split the animation engine (4.6KB) from the features (15KB) and lazy-load when the tour starts. Full Motion bundle is 34KB — don't pay that upfront.

**3/** AnimatePresence handles the enter/exit lifecycle. Key insight: set key={currentStep.id} so React treats each step as a new element. Without it, the same DOM node gets reused and you see no transition. mode="wait" prevents tooltip overlap during transitions.

**4/** layoutId is the real magic. Put it on your spotlight overlay. When the target changes, Motion interpolates position AND size between steps. Your spotlight physically slides across the page instead of teleporting. Spring config: stiffness 200, damping 28.

**5/** Accessibility in one prop: MotionConfig reducedMotion="user". Strips transforms (x, y, scale, layout) for users who prefer reduced motion. Opacity stays. No conditional code needed. React Spring requires manual useReducedMotion() checks per animation.

**6/** Full tutorial with 5 components, spring configs, and troubleshooting: https://usertourkit.com/blog/product-tour-framer-motion-animations

Built with Tour Kit (our headless tour library) + Motion v12. Works with React 18 and 19.
