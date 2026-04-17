# Why Most Product Tour Libraries Break in React Strict Mode

## The patterns nobody tests for — and a 5-point audit checklist

*Originally published at [usertourkit.com](https://usertourkit.com/blog/why-product-tour-libraries-break-strict-mode)*

You add a product tour library to your React app. Works fine in production. Then you enable `<React.StrictMode>` and everything falls apart: overlays flash twice, tooltips render in the wrong position, keyboard listeners fire double, scroll locks freeze the page permanently.

The advice you'll find in every GitHub issue thread: "just remove StrictMode." That advice is wrong.

React Strict Mode is a development-only wrapper that double-invokes renders, effects, and state initializers to catch bugs before they reach production. Most product tour libraries were built on patterns that cannot survive this double invocation. The failures they expose aren't just development inconveniences — they're real bugs that surface in production during route changes and component unmounting.

## Why tour libraries are especially vulnerable

Product tour libraries sit at the intersection of every pattern Strict Mode punishes. They combine imperative DOM manipulation with global state, event listener management, scroll locking, and positioning calculations — all from `useEffect` hooks that often lack cleanup.

Seven specific patterns break: singleton tour instances (two objects created), DOM overlay injection without cleanup (two overlays in the DOM), effects without cleanup returns, ref-guarded event listeners (affected by React bug #24670 where refs aren't cleared during simulated unmount), global scroll locks, module-level step indices, and Popper.js instances without `.destroy()`.

React Query's maintainer noted in GitHub issue #24502: "even in react-query, the strict effects fires the fetch twice. We just deduplicate multiple requests." The key difference: React Query was designed with idempotent operations in mind. Tour libraries were not.

## Real-world evidence

We tested the four most popular React tour libraries. React Joyride has documented overlay flickering in GitHub Discussions #805, #872, and #973. Shepherd.js creates duplicate Tour singleton objects. Driver.js injects double overlay elements. Intro.js leaves orphaned instances from its thin React wrapper.

The most telling example comes from Atlassian. After upgrading to React 18, their atlaskit onboarding spotlights started "appearing in the top left of the screen." If Atlassian's own component library couldn't handle the transition, your tour library probably can't either.

## A hidden layer: the ref bug

There's an additional problem even well-maintained libraries hit. React's GitHub issue #24670 documents that Strict Mode's simulated unmount does not clear `ref.current`. This bug has been tagged "Needs Investigation" since April 2024 and remains unresolved.

The result: any library using `if (ref.current) { addListener() }` silently adds duplicate listeners, because the ref persists through the simulated unmount when it shouldn't.

## Why removing StrictMode is the worst fix

Strict Mode prepares your code for Fast Refresh (same mount/unmount/remount semantics), React's upcoming Activity API, and catches real production bugs like leaked subscriptions. Removing it hides the bugs without fixing them.

As React's docs state: "If a component or a library breaks because of occasionally re-running its effects, it won't work with Fast Refresh or other React 18 features well."

## 5-point audit checklist

You can test any tour library in a fresh Vite + React project with Strict Mode enabled:

1. Check overlay count in DevTools (should be 1, not 2)
2. Verify event listeners are cleaned up after tour closes
3. Test that scroll lock releases properly
4. Trigger a hot reload mid-tour — step counter should survive
5. Watch for `findDOMNode` deprecation warnings in console

As of April 2026, no major tour library comparison article tests for Strict Mode compliance. This is a significant gap.

---

Full article with code examples, a library-by-library breakdown, and the complete technical analysis: [usertourkit.com/blog/why-product-tour-libraries-break-strict-mode](https://usertourkit.com/blog/why-product-tour-libraries-break-strict-mode)

*Suggested Medium publications: JavaScript in Plain English, Bits and Pieces, Better Programming*
