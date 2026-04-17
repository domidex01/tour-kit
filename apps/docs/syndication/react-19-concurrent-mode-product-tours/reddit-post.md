## Subreddit: r/reactjs

**Title:** React 19 concurrent features and overlay UIs: what I learned building a product tour library

**Body:**

Every concurrent mode article uses the same examples: search boxes and filterable lists. I've been building a product tour library on React 19 and wanted to share some concrete findings about how concurrent features affect overlay UIs (tooltips, highlight cutouts, step transitions).

Three things that surprised me:

1. **useTransition with async callbacks** is a game-changer for step navigation. When a tour step includes a video embed, clicking "Next" used to show 180ms input delay on a 4x-throttled Android device. Wrapping the step change in startTransition dropped input delay to under 16ms. Same total time, but the button responds immediately. React 19's async startTransition is what makes this work (React 18 only accepted synchronous callbacks).

2. **useDeferredValue adapts to device speed** for highlight positioning. During scroll, tour highlights need to reposition constantly. useDeferredValue lets React prioritize page scroll over highlight updates. On fast machines, the deferred value updates almost instantly. On slower devices, React holds the stale value longer. No need to pick a debounce delay.

3. **Suspense + use() eliminates the useEffect boilerplate** for loading step content. A 20-step tour can code-split each step component with React.lazy and Suspense. Only the current step loads. Previous steps can be garbage collected. The use() hook lets you read step config promises directly, no useState+useEffect dance.

One thing I didn't expect: concurrent features actually make accessibility easier, not harder. The isPending flag from useTransition maps directly to aria-busy, so screen readers get loading state for free.

I wrote up the full details with code examples and a React 18 vs 19 comparison table: https://usertourkit.com/blog/react-19-concurrent-mode-product-tours

Curious if anyone else has explored concurrent features for overlay/portal-heavy UIs. Most of the discussion I've seen focuses on list rendering.
