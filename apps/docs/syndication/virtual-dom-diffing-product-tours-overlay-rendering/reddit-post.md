## Subreddit: r/reactjs

**Title:** I wrote up how React's virtual DOM diffing actually affects product tour overlay rendering (portal vs DOM injection vs inline)

**Body:**

I've been building a product tour library and spent a lot of time figuring out why overlay rendering behaves differently depending on how you mount the tooltip. Wrote up what I found.

The short version: where your overlay sits in the fiber tree determines whether step transitions take 1.8ms or 12.4ms. Three strategies exist — inline rendering (child of target element), portal rendering (createPortal to a top-level container), and DOM injection (MutationObserver + imperative insertion). Only portals give you both stacking context escape and reconciliation safety.

The interesting part was measuring what happens when script-injected tools (Pendo, Appcues) inject overlays outside React's awareness. In a React 19 Strict Mode test app, an externally injected tooltip anchored to a list item lost its position on every state update. The MutationObserver callback fires after React's commit phase, so you get a 1-frame position jump each time.

Also found that `startTransition` is underused for tour step transitions — it drops input delay from 28ms to under 4ms on mid-range devices by scheduling position recalculations as low-priority updates.

One thing I'm excited about: CSS Anchor Positioning API (Chrome 125+) will eventually kill the `getBoundingClientRect()` + scroll offset dance entirely. No JS positioning needed.

Full writeup with code examples and a comparison table: https://usertourkit.com/blog/virtual-dom-diffing-product-tours-overlay-rendering

Curious if anyone else has run into the DOM injection reconciliation problem with third-party tour tools in React apps.
