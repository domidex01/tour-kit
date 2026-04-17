React Compiler v1.0 shipped stable in October 2025. Most coverage focuses on "goodbye useMemo." But what happens to overlay UIs?

I tested product tour libraries under automatic memoization because they combine four patterns the compiler handles differently: step-driven re-renders, DOM-ref positioning, portal overlays, and callback prop stability.

Key finding: the compiler's new refs rule silently skips any component that reads ref.current during render. Tour libraries that calculate tooltip position in the render function just don't get compiled. No error, no warning. Moving reads to useLayoutEffect fixes it.

Production performance data is real: Meta Quest Store saw 2.5x faster interactions, Wakelet saw INP drop from 275ms to 240ms. But independent testing by Nadia Makarevich found it only auto-fixes 15-20% of re-render cases. Architecture still matters more than the compiler.

Full analysis with code examples: https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization

#react #reactcompiler #javascript #webdevelopment #opensource #performanceoptimization
