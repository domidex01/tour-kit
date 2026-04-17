## Subject: React Compiler and product tour libraries: compatibility analysis with performance data

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a deep-dive on how React Compiler v1.0's automatic memoization interacts with product tour and overlay UI libraries. The article covers three specific compatibility patterns (ref reads during render, memoized callback identity, context value stability) with code examples showing what breaks and how to fix it.

Includes production performance data from Meta Quest Store (2.5x interaction speedup), Sanity Studio (20-30% render time reduction), and Wakelet (15% INP improvement), plus independent testing results from Nadia Makarevich showing the compiler only auto-fixes 15-20% of re-render cases.

Link: https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization

Thanks,
Domi
