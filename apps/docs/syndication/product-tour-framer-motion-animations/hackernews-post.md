## Title: Animated product tours in React: LazyMotion, layoutId spotlights, and reduced-motion patterns

## URL: https://usertourkit.com/blog/product-tour-framer-motion-animations

## Comment to post immediately after:

This is a tutorial on adding Motion (Framer Motion) animations to React product tours. The three main techniques:

1. AnimatePresence for tooltip enter/exit with spring physics (stiffness: 300, damping: 24, mass: 0.8 for a quick settle without bounce)

2. layoutId to morph a spotlight overlay between target elements — Motion interpolates position and size automatically

3. MotionConfig reducedMotion="user" to strip transforms for users who prefer reduced motion, while keeping opacity transitions

The bundle impact is 4.6KB initial with LazyMotion. The domAnimation feature pack (15KB) lazy-loads when the tour triggers. Compare: React Spring is ~22KB upfront with no lazy option, GSAP is ~78KB.

I built this with Tour Kit (my library), but the animation patterns are framework-agnostic. The article includes a complete useTargetRect hook for tracking element positions on scroll/resize.
