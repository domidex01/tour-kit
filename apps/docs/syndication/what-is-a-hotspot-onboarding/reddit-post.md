## Subreddit: r/reactjs

**Title:** TIL the difference between hotspots, tooltips, and beacons in onboarding UX — wrote up the accessibility requirements too

**Body:**

I kept seeing "hotspot" and "beacon" used interchangeably in onboarding docs and finally wrote up what the actual distinctions are. Quick version:

- A **beacon** is the animated dot (the visual indicator)
- A **hotspot** is the full pattern: beacon + the tooltip it reveals on click
- A **tooltip** appears on hover/focus without any indicator

The accessibility angle is where it gets interesting. WCAG 2.1 SC 1.4.13 requires that any content appearing on hover must be: dismissible (Escape key), hoverable (pointer can move over it), and persistent (no timeout hiding). Sarah Higley from Microsoft has a great deep-dive on why timeout-based hiding breaks screen reader flows.

The other thing most articles miss: hotspots on mobile are actually *more* accessible than tooltips because they use click/tap instead of hover (which doesn't exist on touch devices). The WCAG 2.5.8 minimum touch target is 44x44px, which matters for beacon sizing.

Real-world usage patterns: SendGrid for feature discovery, Typeform for contextual first-run onboarding, Plandisc for auto-retiring new feature announcements (30-day lifecycle).

Three practical rules if you're implementing these: cap at 2-3 per view (visual noise), persist dismissals (don't re-show closed hotspots), and respect `prefers-reduced-motion` (swap pulse for static dot).

Full writeup with a comparison table (hotspots vs tooltips vs modals) and a React code example: https://usertourkit.com/blog/what-is-a-hotspot-onboarding

Sources: W3C WAI-ARIA tooltip pattern, Sarah Higley's WCAG 2.1 analysis, UserGuiding, UX Myths
