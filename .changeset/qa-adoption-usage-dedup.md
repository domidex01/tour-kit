---
'@tour-kit/adoption': patch
---

One click now counts as one usage. A `<FeatureButton>` whose DOM node also
matches its feature's `trigger` CSS selector was double-counted: the
capture-phase selector listener and the button's own onClick `trackUsage()`
both fired for the same native event. Tracking paths now claim the native
event per feature (`claimUsageEvent`) — the selector listener claims first
(capture phase), and the manual button path skips events already counted.
