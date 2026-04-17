## Thread (6 tweets)

**1/** React Compiler v1.0 is stable and everyone's talking about "goodbye useMemo." But nobody's asking what happens to overlay UIs like product tours under automatic memoization. We tested it. Here's what we found:

**2/** Product tours hit 4 patterns that interact with the compiler differently than normal components:
- Step-driven re-renders
- DOM-ref positioning (ref reads in render!)
- Portal-based overlays
- Callback prop stability

Each one behaves differently under auto-memoization.

**3/** The big gotcha: the compiler's new `refs` rule silently SKIPS any component that reads `ref.current` during render. Tour libraries that calculate tooltip position in the render function? They just don't get compiled. No error. No warning.

Fix: move position reads to useLayoutEffect.

**4/** Real performance numbers:
- Meta Quest Store: 2.5x faster interactions
- Sanity Studio: 20-30% faster renders (87% compiled)
- Wakelet: INP dropped from 275ms to 240ms

But honest take: independent testing found it only auto-fixes ~15-20% of re-render cases.

**5/** Architecture matters more than the compiler:
- Framework-agnostic (Driver.js): unaffected
- Non-headless React (Joyride): highest risk, untested
- Headless React (Tour Kit): best positioned, hooks compile cleanly

The compiler amplifies good patterns. It doesn't fix bad ones.

**6/** Full breakdown with code examples, setup guide, and compatibility comparison:

https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization
