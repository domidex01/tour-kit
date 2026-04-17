Most product tour overlay bugs aren't CSS problems. They're reconciliation problems.

When a tour library injects overlays outside React's virtual DOM, it creates a mismatch between what React thinks the DOM looks like and what it actually looks like. The next render cycle overwrites the injected nodes. You see flickering.

We benchmarked three overlay rendering strategies in React:
- Portal rendering (createPortal): 1.8ms per step transition, reconciliation-safe
- Full unmount/remount: 12.4ms per transition on mid-range devices
- DOM injection (MutationObserver): fast, but causes 1-frame position jumps on every React re-render

The fix for most tour overlay issues isn't z-index. It's rendering overlays inside React's component tree using portals, so the reconciler diffs them alongside everything else.

Deep-dive with code examples and a comparison table: https://usertourkit.com/blog/virtual-dom-diffing-product-tours-overlay-rendering

#react #javascript #webdevelopment #frontend #opensource
