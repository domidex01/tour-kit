# React Compiler and Product Tours: What Automatic Memoization Actually Does

## How the new compiler affects overlay UIs, and what library architecture has to do with it

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization)*

React Compiler hit stable v1.0 in October 2025. It analyzes your components at build time and inserts memoization automatically, eliminating most manual useMemo and useCallback calls. Meta's Quest Store saw interactions speed up 2.5x after enabling it.

But what does automatic memoization mean for product tour libraries? Tours sit in an unusual spot in the component tree. They depend on step-driven re-renders, portal-based overlays, DOM-ref positioning, and callback prop stability. All of those interact with the compiler in specific ways that generic "React Compiler is amazing" articles don't cover.

## Four patterns that make tours sensitive to the compiler

Product tours combine four patterns that interact with automatic memoization in non-obvious ways:

**Step-driven re-renders.** When currentStep changes from 2 to 3, every component receiving that value must re-render. The compiler respects state changes as memoization boundaries, so this should work correctly. But if a library wraps step data in an object reconstructed each render, the compiler might memoize the wrong thing.

**DOM-ref positioning.** Tour libraries read ref.current.getBoundingClientRect() to position tooltips. The compiler's new refs lint rule warns about reading refs during render. Libraries that calculate position inside the render function instead of useLayoutEffect will get skipped by the compiler.

**Portal-based overlays.** ReactDOM.createPortal renders outside the normal tree, and compiler memoization doesn't cross portal boundaries. These are safe.

**Callback stability.** The compiler memoizes callbacks passed as props. Most of the time that's desirable. But some libraries depend on callbacks being a new reference each render to trigger effects.

## The performance data

The gains are real but concentrated in interaction speed:

- Meta Quest Store: 2.5x faster interactions
- Sanity Studio: 20-30% render time reduction (87% of components compiled)
- Wakelet: 15% INP improvement (275ms to 240ms)

But here's the nuance. Developer Nadia Makarevich tested the compiler on three real apps and found it fixed only 15-20% of re-render cases automatically. The compiler amplifies well-structured code. It doesn't rescue bad architecture.

## Three architecture types, three different outcomes

**Framework-agnostic libraries** like Driver.js and Shepherd.js operate outside React's render cycle. The compiler doesn't touch them. No gains, no breakage.

**Non-headless React libraries** like React Joyride ship pre-built components that must also be compiler-safe. As of April 2026, most haven't been audited. They carry the highest risk.

**Headless React libraries** separate logic from rendering. Hooks handle state. The consumer writes the JSX. The consumer's component tree gets compiled cleanly. This is the architecture best positioned for a compiler-first world.

## What to actually test before enabling

Three compatibility checks to run:

1. Step through your tour with React DevTools profiler. Verify every step transition triggers expected re-renders (tests memoized callback identity).

2. Check if your tour library reads refs during render. If so, those components won't be compiled. Move position calculations to useLayoutEffect.

3. Verify context values are stable. If your tour provider creates a new object each render, consumers will still re-render regardless of the compiler.

## The honest take

React Compiler is production-ready. It shipped stable in October 2025. Expo and Next.js both treat it as a first-class feature. The performance improvements for interaction speed are real.

But it fixes about 20% of re-render problems automatically. The other 80% still require you to understand rendering patterns, lift state correctly, and structure your component tree well.

For product tours specifically, headless architecture is the safest path. Logic in hooks, rendering in consumer code, no magic side effects.

[Full article with code examples, setup instructions, and comparison table](https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization)

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
