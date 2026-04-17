## Thread (6 tweets)

**1/** z-index: 9999 doesn't fix your tooltip. Here's why, and what actually does.

**2/** CSS stacking contexts trap descendant elements. Properties like transform, opacity < 1, and filter create them silently. Once inside, no z-index value can escape. Not even position: fixed works.

React's createPortal moves your tooltip to document.body while keeping it in the React tree. Context, refs, events all work normally.

**3/** The gotcha nobody warns you about: portal events bubble up the REACT tree, not the DOM tree.

Clicking "Next Step" in a portaled tooltip also triggers onClick on the component that called createPortal. Fix: e.stopPropagation() inside the portal.

GitHub issue #11387 has been open since 2017 asking for a better solution.

**4/** Screen readers lose the connection between trigger and portaled tooltip. You need:

- aria-describedby on the trigger (only when portal is mounted)
- role="tooltip" on the portaled content
- useId() for stable IDs (not Math.random)

axe-core can't catch this. Manual NVDA/VoiceOver testing required.

**5/** Four portal target strategies:

document.body - simple, escapes everything
#tour-root div - isolated z-index layer
FloatingPortal - preserves tab order
CSS popover attribute - no JS needed (Chrome 114+)

Each has tradeoffs. Full comparison table in the article.

**6/** Full deep-dive with code examples, performance benchmarks, SSR/Next.js caveats, and the CSS top-layer alternative:

https://usertourkit.com/blog/portal-rendering-product-tours-createportal
