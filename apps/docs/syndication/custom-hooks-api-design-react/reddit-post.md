## Subreddit: r/reactjs

**Title:** Lessons from designing hook APIs for a 10-package React library (not the usual "extract logic into useX" advice)

**Body:**

I've been building Tour Kit, a headless product tour library, and the entire thing runs on custom hooks across 10 packages. Most "hooks best practices" articles are written for app developers. When you're designing hooks that other teams consume, the advice changes.

A few things I learned the hard way:

**Return value shape matters more than you'd think.** We initially mixed array returns for simple hooks and object returns for complex ones. Consumers had to remember which was which. Standardized on objects for everything except primitives like `useMediaQuery()`. Our main hook `useTour()` returns 18 fields — state, actions, and utilities grouped consistently.

**Hooks must own accessibility behavior.** Our `useFocusTrap()` handles focus trapping, Tab cycling, and focus restoration to the previously active element. We watched developers build tour cards that trapped focus fine but never returned it — focus landed on `<body>` after the tour ended. WCAG 2.1 SC 2.4.3 violation. Fixing it inside the hook fixed it for everyone.

**Memoize everything in library hooks.** We measured a 340ms TTI regression when `useTour()` returned a fresh object every render. App hooks can sometimes get away with it. Library hooks can't because you don't control what consumers do with your return values.

**The headless pattern = hooks own logic, components own rendering.** Martin Fowler's headless component article nails this. `@tour-kit/core` is all hooks, `@tour-kit/react` is thin wrappers. Hooks return raw DOMRect values, not styled tooltips, because someone's building a Framer Motion animation.

Full article with code examples from the actual source: https://usertourkit.com/blog/custom-hooks-api-design-react

Would love to hear how others approach hook API design in their libraries. What patterns have worked for you?
