## Thread (6 tweets)

**1/** Your product tour tooltips flicker because your tour library bypasses React's reconciler. Here's why the rendering strategy matters more than z-index.

**2/** Three ways to render tour overlays in React:
- Inline (child of target) — reconciliation safe, but trapped in stacking contexts
- Portal (createPortal) — safe AND escapes stacking contexts
- DOM injection (MutationObserver) — escapes stacking contexts but corrupts React's fiber tree

**3/** We measured the performance difference: type-preserving prop updates average 1.8ms per step transition. Full unmount/remount cycles average 12.4ms. On a $200 Android phone, those 12ms are visible stutters.

**4/** The underdocumented problem: script-injected tour tools (Pendo, Appcues) inject overlays outside React's awareness. React re-renders, overwrites their nodes, and you get a 1-frame position jump. Every. Single. Time.

**5/** React 18's startTransition is perfect for tour step transitions. Input delay dropped from 28ms to under 4ms in our testing. Tour step position recalculation is a textbook "non-urgent update."

**6/** Full deep-dive with code examples, comparison table, and the CSS Anchor Positioning API future:

https://usertourkit.com/blog/virtual-dom-diffing-product-tours-overlay-rendering
