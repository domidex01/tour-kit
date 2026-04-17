## Channel: #articles in Reactiflux

**Message:**

Wrote up what happens when you enable React Compiler with product tour / overlay UI libraries. Turns out tours hit some interesting edge cases around ref reads during render, memoized callback identity, and context value stability. Includes production perf data from Meta, Sanity Studio, and Wakelet.

https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization

Would be curious if anyone else has tested the compiler with portal-heavy UIs.
