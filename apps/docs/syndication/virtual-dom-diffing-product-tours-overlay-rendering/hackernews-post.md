## Title: Virtual DOM diffing and product tours: why overlay rendering strategy matters

## URL: https://usertourkit.com/blog/virtual-dom-diffing-product-tours-overlay-rendering

## Comment to post immediately after:

I've been building a React product tour library and spent significant time understanding how the reconciler interacts with overlay rendering. This article covers the three main strategies (inline, portal, DOM injection) and why the choice matters more than most developers realize.

Key findings from benchmarking: type-preserving prop updates average 1.8ms per tour step transition, while full unmount/remount cycles average 12.4ms on a Moto G Power. The difference is visible as stutters during fast step navigation.

The most underdocumented problem: script-injected tour tools (Appcues, Pendo, WalkMe) that use MutationObserver to inject overlays outside React's fiber tree. This creates a real DOM / virtual DOM divergence that causes 1-frame position jumps on every React re-render of the target area. We measured this consistently in React 19 Strict Mode.

Looking forward to CSS Anchor Positioning API making JavaScript-based overlay positioning obsolete for many use cases. Chrome 125+ ships it, but Safari support is still pending as of April 2026.
