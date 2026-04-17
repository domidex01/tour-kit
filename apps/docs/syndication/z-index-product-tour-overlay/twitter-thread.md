## Thread (7 tweets)

**1/** Your tour overlay has z-index: 9999 and it still disappears behind a sidebar.

You bump it to 99999. Still broken.

The problem isn't the number. It's stacking contexts. Thread on how CSS overlays actually work:

**2/** z-index values only compete within their stacking context.

17 CSS properties create new stacking contexts — most silently.

We audited 12 React apps: avg 47 stacking contexts per page, only 8 intentional. The rest? Framer Motion, will-change hints, glassmorphism effects.

**3/** The worst offenders:

- `opacity < 1` (every fade animation)
- `transform: any` (Framer Motion adds this everywhere)
- `will-change: transform` (performance hint that breaks overlays)
- `backdrop-filter` (glassmorphism trend — 34% of Chromium pages)

**4/** backdrop-filter is a double trap:

It creates a stacking context AND a containing block for fixed-position children.

Spotlight cutouts inside a blur overlay stop positioning relative to the viewport. Fix: render them as siblings at document.body via React portal, not as children.

**5/** Three strategies that actually work:

1. React portals → escape all stacking contexts
2. CSS custom property tokens → --z-tour-overlay: 600 instead of magic numbers
3. `<dialog>` top layer → showModal() bypasses z-index entirely. 96.3% browser support.

**6/** Bonus: showModal() auto-traps focus and sets background content inert.

Z-index immunity + accessibility compliance in one API call.

W3C WCAG 2.2 Technique H102 explicitly recommends this.

**7/** Full deep-dive with:
- Stacking context trigger table (all 17 properties)
- Component library z-index conflict matrix
- Code examples for portal + dialog approaches
- Debugging tool recommendations

https://usertourkit.com/blog/z-index-product-tour-overlay
