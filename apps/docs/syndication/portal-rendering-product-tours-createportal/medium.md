# Portal Rendering for Product Tours: a createPortal Deep-Dive

## Why z-index: 9999 doesn't fix your tooltip, and what does

*Originally published at [usertourkit.com](https://usertourkit.com/blog/portal-rendering-product-tours-createportal)*

Your product tour tooltip renders fine in isolation. Then someone wraps the target element in a card with `overflow: hidden`, and the tooltip gets clipped. You bump `z-index` to 9999. Still hidden. You try `position: fixed`. Nothing changes.

The problem isn't your CSS. The problem is stacking contexts, and React's `createPortal` is how you escape them.

## The stacking context trap

CSS stacking contexts silently break product tour overlays. When a browser encounters `transform`, `opacity` less than 1, `filter`, or `will-change` on any ancestor element, it creates a new stacking context. All descendants are locked inside. No z-index value can escape it.

"Even `position: fixed` cannot escape the rules of Stacking Context. Nothing can," as Nadia Makarevich explains.

Product tours are especially vulnerable because tour steps target elements deep in the component tree. A tooltip anchored to a button inside a sidebar panel inside a card with `transform: translateX(0)` is trapped.

## How createPortal solves it

`createPortal(children, domNode, key?)` renders children physically inside `domNode` (usually `document.body`) while keeping them logically in the React component tree. Context, refs, and event handlers work exactly as if the portal content were rendered in its original position.

This API has been stable since React 16.0 (September 2017) with no changes through React 19. Every major tour library uses it: React Joyride (4,300+ stars), Reactour (3,300+ stars), and Shepherd.js all portal their overlay layers.

## The event bubbling trap most devs miss

Portal events bubble up the React tree, not the DOM tree. Clicking inside a portaled tooltip triggers `onClick` handlers on the component that called `createPortal`, even though the tooltip's DOM parent is `document.body`.

GitHub issue #11387, requesting an option to stop this propagation, has been open since 2017 with no resolution. The fix: wrap portal content in a component that calls `e.stopPropagation()`.

## Accessibility gaps

Screen readers lose the semantic connection between trigger and tooltip when content is portaled. The fix requires `aria-describedby` on the trigger (set only when the portal is mounted), `role="tooltip"` on the portaled content, and `useId()` for stable IDs.

We tested this with NVDA and VoiceOver during Tour Kit development. Automated tools like axe-core catch missing roles but can't verify the semantic relationship actually works. Manual testing is required per WCAG 2.1.

## Performance

A single `createPortal` call adds negligible overhead (under 2ms). Pre-rendering 50+ portals simultaneously causes measurable lag. The fix: conditionally render based on the current step, not CSS visibility.

## Where to portal

- **`document.body`**: Escapes all stacking contexts but can conflict with other portaled UI
- **Dedicated `#tour-root`**: Isolated z-index layer, best for complex SPAs
- **Floating UI's `FloatingPortal`**: Preserves tab order, ideal for library authors
- **CSS `popover` attribute**: No JS needed, but limited React integration (Chrome 114+, Firefox 125+, Safari 17+)

## The future: CSS top-layer

The HTML `popover` attribute renders in the browser's top layer, bypassing stacking contexts without JavaScript. For multi-step product tours with keyboard navigation and spotlight overlays, `createPortal` remains the practical choice as of April 2026. But watch this space.

---

*Full article with code examples and comparison table at [usertourkit.com](https://usertourkit.com/blog/portal-rendering-product-tours-createportal)*

<!-- Import this article via medium.com/p/import to auto-set canonical URL -->
<!-- Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces -->
