## Title: The DOM Observation Problem: ResizeObserver, MutationObserver, and Product Tours

## URL: https://usertourkit.com/blog/dom-observation-product-tour

## Comment to post immediately after:

There's no native browser API that tells you "this element's position on screen changed." The W3C has no PositionObserver spec — a WICG proposal for ClientRectObserver exists but hasn't progressed.

This means any UI that needs to track element positions (tooltips, popovers, product tours) has to combine multiple observer APIs. Floating UI runs four strategies simultaneously: ResizeObserver for size changes, IntersectionObserver for layout shifts, plus scroll and resize event listeners. Updates take ~1ms.

The part I found most interesting during research: ResizeObserver and IntersectionObserver leak memory without explicit disconnect(), but MutationObserver doesn't — it's garbage collected automatically. Jake Archibald confirmed this asymmetry. A study of 500 repositories found 787 instances of missing disconnects, leaking ~8 KB per cycle.

Sentry took a different approach entirely — their product tour uses zero observer APIs, relying on CSS z-index layering and react-popper instead. It's a valid tradeoff for static UIs but breaks for dynamic SaaS dashboards.

I wrote this up mapping each observer to the specific positioning problem it solves, with cleanup patterns for React.
