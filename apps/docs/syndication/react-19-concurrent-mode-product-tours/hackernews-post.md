## Title: React 19 concurrent mode and overlay UIs: what changes for product tours

## URL: https://usertourkit.com/blog/react-19-concurrent-mode-product-tours

## Comment to post immediately after:

I've been building a headless product tour library for React and wanted to write up what I learned about how concurrent rendering affects overlay UIs specifically. Most concurrent mode articles use search boxes and lists as examples, but tooltip positioning, highlight cutouts, and step transitions have different performance characteristics.

Key findings from testing on a 4x-throttled Android device with a 12-step tour:

- useTransition dropped input delay on step navigation from 180ms to under 16ms (total time unchanged, but perceived responsiveness is dramatically different)
- useDeferredValue for highlight positioning adapts to device speed without picking a debounce delay
- Suspense + use() eliminates the useEffect+useState boilerplate for loading step content from APIs

React 19 making concurrent rendering the default (no opt-in) is what makes this practical. In React 18 you could do all of this, but it required wrapping every interaction in startTransition manually.

One observation that surprised me: the isPending flag from useTransition maps cleanly to aria-busy for screen readers, so concurrent features actually simplify accessible loading states.

The article includes TypeScript code examples for each pattern and a React 18 vs 19 feature comparison table.
