## Thread (6 tweets)

**1/** Most "React hooks best practices" articles target app developers. What changes when you're designing hook APIs for a library that other teams consume? I built 12 hooks across 10 packages and learned some things the hard way.

**2/** Return value shape is the #1 API decision. We mixed arrays and objects across hooks — consumers couldn't keep track. Standardized on objects for anything with 3+ fields. Our main hook useTour() returns 18 fields grouped as: state, actions, utilities.

**3/** Accessibility must be baked into hooks, not bolted on. Our useFocusTrap() handles focus restoration automatically. We watched developers ship tour cards that trapped focus but dropped it on <body> when the tour ended. WCAG 2.1 SC 2.4.3 violation.

**4/** Library hooks MUST memoize returns. We measured a 340ms TTI regression when useTour() returned a fresh object every render. App hooks can sometimes skip this. Library hooks can't — you don't control what consumers do with your return values.

**5/** The headless pattern = hooks own logic, components own rendering. @tour-kit/core is all .ts hooks (zero JSX). @tour-kit/react is thin wrappers. Hooks return raw DOMRect values, not styled tooltips.

**6/** Full article with source code from the actual library, a return-value decision tree, and the focus trap that taught us about accessibility-first hook design:

https://usertourkit.com/blog/custom-hooks-api-design-react
