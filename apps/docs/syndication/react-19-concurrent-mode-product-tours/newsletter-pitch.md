## Subject: React 19 concurrent mode + overlay UIs (product tours, tooltips)

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a technical deep-dive on how React 19's concurrent rendering features (useTransition, useDeferredValue, Suspense, use()) specifically affect overlay UIs like product tours. Most concurrent mode content uses search boxes as examples — this covers tooltip positioning, highlight calculations, and async step loading with concrete benchmarks (180ms to 16ms input delay on step transitions).

Includes TypeScript code examples, a React 18 vs 19 comparison table, and accessibility patterns using isPending + aria-busy.

Link: https://usertourkit.com/blog/react-19-concurrent-mode-product-tours

Thanks,
Domi
