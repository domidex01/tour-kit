## Title: React Compiler and overlay UIs: what automatic memoization means for product tour libraries

## URL: https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization

## Comment to post immediately after:

React Compiler v1.0 shipped stable in October 2025 and most coverage focuses on generic component performance. I wanted to dig into what happens with overlay-style UIs specifically, because product tours combine several patterns that interact with the compiler in non-obvious ways.

Three findings stood out:

1. The compiler's new `refs` lint rule flags a common tour library pattern: reading `ref.current.getBoundingClientRect()` during render for tooltip positioning. Components doing this get silently skipped (no error, just no memoization). The fix is moving position reads to `useLayoutEffect`.

2. Headless architecture maps cleanly to the compiler's model. Logic in hooks, rendering in consumer code. The consumer's components get compiled and memoized. The library's hooks follow Rules of React and compile cleanly. Sanity Studio demonstrated this at scale: 87% of their 1,411 components compiled, with 20-30% render time reduction.

3. The "automatic memoization eliminates useMemo" narrative is oversimplified. Nadia Makarevich tested on three real apps (150k lines, 30k lines, and a small project) and the compiler fixed only 15-20% of re-render cases. It amplifies well-structured code but doesn't rescue bad state management.

I built Tour Kit (headless tour library for React) and tested it against the compiler. Fair disclosure on that front.
