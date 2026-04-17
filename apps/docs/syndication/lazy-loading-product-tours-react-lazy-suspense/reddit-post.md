## Subreddit: r/reactjs

**Title:** TIL: Product tour libraries are one of the cleanest React.lazy candidates (and almost nobody does it)

**Body:**

I've been working on performance for a React app and realized something obvious in retrospect: the product tour library was adding ~35KB to every single page load, even though tours only fire for new users or feature releases. Most sessions never trigger a tour at all.

Wrapping it in React.lazy + Suspense was trivial (about 10 lines of wrapper code), and it removed the tour entirely from the initial bundle. The key insight is that tours are *interaction-triggered*, not route-triggered, so the split boundary is really clean.

A few things I learned that aren't in the typical code-splitting tutorials:

- **Prefetch with `webpackPrefetch: true`** and the tour chunk downloads during idle time. When the user actually triggers the tour, it's already cached. Went from ~180ms delay to ~20ms in my testing.
- **React.lazy doesn't work with SSR**, so in Next.js App Router you need `next/dynamic` with `{ ssr: false }` instead. Same code-splitting benefit, different API.
- **Error Boundaries are non-optional.** After a deploy, old chunk URLs go stale. Without a boundary, the tour silently fails and you'll never know.
- **Screen readers don't announce lazy-loaded content.** You need `aria-live="polite"` + manual focus management when the tour mounts. WCAG 2.2 SC 2.4.3 applies here.

One gotcha: don't over-split. Individual tour steps as separate chunks means too many HTTP requests. The whole tour system should be one chunk.

I wrote up the full pattern with TypeScript code examples, the Next.js workaround, Error Boundary implementation, and accessibility setup: https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense

Curious if anyone else has done this with their tour/onboarding setup? Any patterns I missed?
