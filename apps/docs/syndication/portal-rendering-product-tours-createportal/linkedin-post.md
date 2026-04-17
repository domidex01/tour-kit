Ever wondered why z-index: 9999 doesn't fix your React tooltip? It's not a CSS bug.

CSS stacking contexts silently trap descendant elements. Once a parent has transform, opacity, or filter, no z-index value can escape. React's createPortal is the standard fix, but most tutorials skip the hard parts.

Three things I learned building portal rendering for a product tour library:

1. Events bubble up the React tree, not the DOM tree. Clicking inside a portaled tooltip triggers handlers on the portal owner. GitHub issue #11387 has been open since 2017.

2. Screen readers lose the semantic connection between trigger and portaled content. You need aria-describedby, role="tooltip", and useId() wired together carefully. Automated tools can't catch this.

3. The CSS popover attribute (supported in all modern browsers) renders in the browser's top layer without JavaScript. For simple overlays, createPortal may not be needed much longer.

Full deep-dive with code examples and a portal target comparison table: https://usertourkit.com/blog/portal-rendering-product-tours-createportal

#react #javascript #webdevelopment #accessibility #frontend
