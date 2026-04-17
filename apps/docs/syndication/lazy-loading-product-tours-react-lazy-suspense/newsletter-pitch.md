## Subject: Lazy loading product tours with React.lazy (deep-dive with a11y angle)

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a deep-dive on lazy loading product tour libraries with React.lazy and Suspense. Tour libraries are ideal code-splitting candidates (30-50KB, never used on first render, conditional by nature), but the pattern has nuances that generic tutorials miss: the Next.js SSR caveat, Error Boundaries for stale chunks after deploys, and WCAG 2.2 focus management for dynamically loaded UI.

Real-world data: code splitting reduced a production app's TTI from 3.5s to 1.9s and Lighthouse from 52 to 89.

Link: https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense

Thanks,
Domi
