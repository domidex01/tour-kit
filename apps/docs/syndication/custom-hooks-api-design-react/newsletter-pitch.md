## Subject: Custom hooks API design from a library author's perspective

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a deep-dive on designing React hook APIs from a library author's perspective — covering return value shapes, accessibility patterns baked into hooks, and the mistakes I made building a 10-package headless tour library. It includes real source code showing how hooks like `useTour()` (18 return fields) and `useFocusTrap()` are structured, with a decision tree for when to use objects vs. arrays vs. prop-getters.

One data point that might interest your readers: we measured a 340ms TTI regression when a library hook returned unstable references, and hooks-based components produce 59.55% smaller bundles than class equivalents.

Link: https://usertourkit.com/blog/custom-hooks-api-design-react

Thanks,
Domi
