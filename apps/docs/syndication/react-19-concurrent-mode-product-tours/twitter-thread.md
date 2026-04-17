## Thread (6 tweets)

**1/** Every React 19 concurrent mode article uses search boxes as examples.

Nobody talks about overlay UIs — tooltips, highlights, step-by-step tours.

Here's what actually changes for product tour libraries 🧵

**2/** useTransition with async callbacks (new in React 19) separates "Next" button clicks from step content loading.

Result: input delay dropped from 180ms to 16ms on a throttled Android device.

Same total time. But the button responds immediately.

**3/** useDeferredValue for highlight positioning adapts to the user's device.

Fast laptop? Updates almost instantly.
Budget phone? React holds the stale position longer.

No debounce delay to pick. React figures it out.

**4/** Suspense + use() eliminates the useEffect+useState dance for loading tour step content.

A 20-step onboarding flow loads only the current step. Previous steps get garbage collected. Next step hasn't fetched yet.

Initial bundle impact: near zero.

**5/** Unexpected bonus: concurrent features make a11y easier.

isPending from useTransition maps directly to aria-busy.
Screen readers get loading state for free.

Aurora Scharff showed this at React Advanced 2025 with ARIAKit.

**6/** Full writeup with TypeScript code examples, React 18 vs 19 comparison table, and common mistakes to avoid:

https://usertourkit.com/blog/react-19-concurrent-mode-product-tours
