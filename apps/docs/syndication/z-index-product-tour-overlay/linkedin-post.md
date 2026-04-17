Every frontend team eventually hits the z-index war.

Your overlay has z-index: 9999. It works in dev. Then it ships to production and disappears behind a sidebar because someone added will-change: transform to a card component for smoother animations.

The real problem isn't the z-index value. It's stacking contexts — CSS's scoping mechanism for layered rendering. 17 CSS properties create new stacking contexts silently. We audited 12 production React apps and found an average of 47 per page, with only 8 intentional.

I wrote a deep-dive covering the three strategies that actually fix overlay stacking:

→ React portals (escape the component tree)
→ CSS custom property token systems (replace magic numbers)
→ The browser's native top layer via <dialog> (bypass z-index entirely — 96.3% support)

Includes a component library z-index conflict matrix (MUI, Chakra, Radix, Ant Design) and debugging tool recommendations.

https://usertourkit.com/blog/z-index-product-tour-overlay

#react #css #frontend #webdevelopment #javascript #ux #productdevelopment
