## Subreddit: r/reactjs

**Title:** The createPortal gotchas I hit building a product tour library (event bubbling, screen readers, SSR)

**Body:**

I spent a lot of time figuring out portal rendering while building a product tour library, and wanted to share what I learned because most tutorials skip the hard parts.

The obvious reason to use `createPortal` for tour tooltips is escaping stacking contexts. What caught me off guard was the event bubbling behavior: clicks inside a portaled tooltip bubble up the *React* tree, not the DOM tree. So clicking "Next Step" in a tooltip also fires `onClick` handlers on the component that owns the portal. GitHub issue #11387 has been open since 2017 asking for a way to control this, still unresolved. Fix: `e.stopPropagation()` inside the portal content.

The accessibility gap is worse. Portaling a tooltip to `document.body` means screen readers lose the semantic connection between the trigger element and the tooltip. You need `aria-describedby` on the trigger (only set when the portal is mounted), `role="tooltip"` on the portaled content, and `useId()` for stable IDs. Automated tools like axe-core can't catch this. You need manual NVDA/VoiceOver testing.

Performance-wise, a single portal is fine (under 2ms). Pre-rendering 50+ portals simultaneously causes measurable lag. Conditional rendering based on the active step instead of CSS visibility fixes this.

One thing I didn't expect: `document.body` isn't always the best portal target. For complex SPAs with modal systems and toast layers, a dedicated `#tour-root` div prevents z-index conflicts. And for library code, Floating UI's `FloatingPortal` with `preserveTabOrder={true}` handles keyboard navigation order correctly.

Also worth noting: the CSS `popover` attribute (Chrome 114+, Firefox 125+, Safari 17+) renders in the browser's top layer without createPortal, but React integration is still awkward for multi-step interactive content.

Full article with code examples and a comparison table of portal target strategies: https://usertourkit.com/blog/portal-rendering-product-tours-createportal

Happy to answer questions about any of this.
