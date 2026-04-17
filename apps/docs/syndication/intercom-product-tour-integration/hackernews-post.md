## Title: Show product tours before live chat to reduce support tickets

## URL: https://usertourkit.com/blog/intercom-product-tour-integration

## Comment to post immediately after:

We built a small integration between a headless React tour library and Intercom's JavaScript API. The idea: show contextual product tours before the chat widget appears, so users get self-serve guidance before reaching for support.

Intercom's built-in product tours ($99-$199/month add-on) lack lifecycle callbacks entirely. Their community forum has an unanswered request for `onTourComplete` from over a year ago. Without callbacks, you can't coordinate tours with anything else in your app. The integration uses Tour Kit's `onComplete`/`onSkip` to fire `trackEvent` into Intercom's user timeline, then uses a 20-line React hook to toggle the Messenger launcher visibility.

Intercom's own data shows proactive onboarding reduces support contact rates by ~80%. The irony is their product can't actually deliver that pattern well. Their tours don't work on mobile (the JS API silently does nothing), have no iframe support, and add ~210 KB gzipped to your bundle.

Limitation worth noting: Tour Kit requires React 18+ and has no visual builder. If non-developers need to create tours, this pattern doesn't fit.
