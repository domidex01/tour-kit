## Subreddit: r/reactjs

**Title:** I tested React Compiler with product tour libraries. Here's what I found about overlay UIs and automatic memoization.

**Body:**

I've been building a headless product tour library (Tour Kit) and wanted to understand how React Compiler v1.0 interacts with overlay-style UIs. Product tours are an interesting test case because they combine step-driven re-renders, DOM-ref positioning, portal-based overlays, and callback prop stability.

The short version: headless libraries where hooks handle logic and consumers write JSX compile cleanly. Non-headless React libraries that ship pre-built tooltip components carry more risk because their internals also need to be compiler-safe. Framework-agnostic libraries (Driver.js, Shepherd.js) are completely unaffected since the compiler only touches React code.

Three specific patterns to watch for:

1. **Ref reads during render** - The compiler skips any component that reads `ref.current` during render. Tour libraries that calculate tooltip position in the render function (instead of `useLayoutEffect`) won't get compiled. No error, just silently skipped.

2. **Memoized callback identity** - If your tour library's `useEffect` depends on a callback prop reference, the compiler will stabilize that reference, and the effect may not re-run when you expect.

3. **Context value stability** - Tour providers that create a new `{ step, next, skip }` object each render defeat the compiler's memoization even though the individual values haven't changed.

Performance-wise, the INP improvements are real. Wakelet saw 275ms drop to 240ms. But independent testing (Nadia Makarevich, developerway.com) found the compiler only auto-fixes about 15-20% of re-render cases. You still need to understand rendering patterns.

I wrote up the full analysis with code examples and a comparison of how different library architectures handle the compiler: https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization

Curious if anyone else has tested the compiler with overlay-heavy UIs. What edge cases did you hit?
