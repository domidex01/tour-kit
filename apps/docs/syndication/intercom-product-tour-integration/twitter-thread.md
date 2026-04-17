## Thread (6 tweets)

**1/** Intercom's product tours add-on costs $99-$199/month and has zero lifecycle callbacks. No onComplete, no onSkip, no way to coordinate tours with anything else in your app. We built a 20-line React hook to fix that.

**2/** The pattern: show contextual product tours BEFORE the chat widget. Users get self-serve guidance first. Intercom's own data says proactive onboarding reduces support contacts by ~80%.

**3/** The integration fires `trackEvent` into Intercom's user timeline on tour completion. You can then target auto-messages based on who finished the tour vs who skipped it. No tours add-on needed.

**4/** The gotcha nobody warns you about: calling `Intercom('update', { hide_default_launcher: true })` before Intercom finishes booting gets overwritten by boot defaults. A 500ms delay on initial load is the quick fix.

**5/** Intercom tours also silently fail on mobile. The `startTour` API does nothing on mobile web. Tour Kit renders the same tour everywhere at <8 KB gzipped vs Intercom's ~210 KB Messenger bundle.

**6/** Full writeup with working TypeScript code, the comparison table, and the 20-line bridge hook: https://usertourkit.com/blog/intercom-product-tour-integration
