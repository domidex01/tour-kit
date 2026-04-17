## Thread (6 tweets)

**1/** "Hotspot," "beacon," and "tooltip" get used interchangeably in onboarding UX.

They're three different things. Here's the breakdown (with WCAG accessibility requirements most implementations miss): 🧵

**2/** A beacon = the animated pulsing dot (visual only)

A hotspot = beacon + the tooltip it reveals on click

A tooltip = appears on hover/focus, no visual indicator

The key difference: hotspots are opt-in. Zero cognitive load until the user clicks.

**3/** WCAG 2.1 SC 1.4.13 requires 3 things for hover/focus content:

✅ Dismissible (Escape key)
✅ Hoverable (pointer can move over tooltip)
✅ Persistent (no timeout hiding)

Most hotspot implementations get this wrong. Sarah Higley's analysis is the best reference.

**4/** Plot twist: hotspots are actually MORE accessible on mobile than tooltips.

Tooltips need hover → doesn't exist on touch devices.
Hotspots need click/tap → works everywhere.

Just size the beacon at 44x44px minimum (WCAG 2.5.8 touch target).

**5/** 3 rules for using hotspots well:

• Cap at 2-3 per view (visual noise)
• Persist dismissals (don't re-show)
• Respect prefers-reduced-motion (static dot instead of pulse)

UX Myths: less than 20% of page copy gets read. Opt-in > forced.

**6/** Full breakdown with comparison table, real-world examples, and React code:

https://usertourkit.com/blog/what-is-a-hotspot-onboarding

Sources: W3C WAI-ARIA, Sarah Higley, UserGuiding, UX Myths, Whatfix
