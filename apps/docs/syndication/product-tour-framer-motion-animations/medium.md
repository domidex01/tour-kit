# How to add smooth animations to your React product tour

## Spring physics, morphing spotlights, and automatic reduced-motion support in under 5KB

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-framer-motion-animations)*

Most React product tours feel static. A tooltip appears, you click next, another tooltip pops up somewhere else. No entrance animation, no exit, no spatial connection between steps. Users notice.

Motion (formerly Framer Motion) fixes this with three key primitives. AnimatePresence handles enter/exit transitions. layoutId morphs a spotlight highlight from one element to the next. And spring physics make tooltip arrivals feel natural.

As of April 2026, Motion pulls 3.6 million weekly npm downloads and scores 10/10 on DX in LogRocket's animation benchmark.

## The key insight: LazyMotion

Product tours don't run on every page load. Loading the full Motion bundle (34KB) upfront is wasteful. LazyMotion splits the animation engine from the rendering components, giving you a 4.6KB initial payload. The rest loads asynchronously when the tour starts.

## What you'll build

A 5-step animated product tour with:
- Spring-physics tooltip transitions (enter and exit)
- A spotlight that morphs smoothly between target elements
- Automatic prefers-reduced-motion support

The full tutorial walks through each component step by step, with TypeScript code examples you can copy directly.

## The accessibility win

About 30% of iOS users enable reduced motion. Motion handles this with a single MotionConfig prop: `reducedMotion="user"`. Transform animations disappear. Opacity transitions stay. Zero extra code.

React Spring requires you to manually check useReducedMotion() for each animation. In a 20-step onboarding flow, that's a maintenance problem.

---

**Read the full tutorial with all code examples:** [Build a product tour with Framer Motion animations](https://usertourkit.com/blog/product-tour-framer-motion-animations)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
