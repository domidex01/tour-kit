# Tour Kit + Intercom: Show Tours Before Chat, Not After

### How to reduce support tickets by showing contextual product tours before users open the chat widget

*Originally published at [usertourkit.com](https://usertourkit.com/blog/intercom-product-tour-integration)*

Most teams wire up Intercom, bolt on its product tours add-on, and hope for the best. The problem: users who don't understand a feature reach for the chat widget first. Support answers the same "how do I..." questions on repeat.

Intercom's own data shows proactive onboarding can reduce support contact rates by roughly 80%. But Intercom's built-in tours can't coordinate with its own Messenger to make that happen.

This guide wires Tour Kit's headless tour engine into Intercom's JavaScript API. Tours fire at the right moment, completion events flow into Intercom for targeting, and the chat widget only appears after users have seen the relevant guidance.

## The problem with Intercom's built-in tours

Intercom product tours cost $99 to $199 per month as an add-on. At 50,000+ MAU, one G2 reviewer reported the cost would be "over 4,000 EUR." And you get real limitations:

- No mobile web support (silently ignored)
- No lifecycle callbacks (no onComplete, no onSkip)
- ~210 KB gzipped bundle impact
- No checklist support
- No iframe compatibility

The callback gap is the big one. Intercom's own community confirms: "At present there is no JS callback function for Tours, nor is there a way to detect if an end-user is due or about to trigger a Tour."

## The solution: 40 lines of glue code

Tour Kit (an open-source headless React tour library at under 8 KB gzipped) provides the lifecycle callbacks Intercom lacks. The integration is straightforward:

1. Tour Kit fires `onComplete` and `onSkip` callbacks
2. Those callbacks push `trackEvent` calls into Intercom's user timeline
3. A 20-line React hook hides/shows the Intercom launcher based on tour state
4. Intercom uses the custom events for audience targeting

Users see the tour first. When it finishes, the Messenger appears. Users who already got the guidance don't immediately open chat with "how do I...?"

## Building the targeting loop

Once Tour Kit fires `trackEvent` on completion, you close the loop inside Intercom without more code:

- Users who finished the tour never see a "need help?" message
- Users who skipped get a gentler nudge two days later
- Users who never saw the tour get a proactive prompt

This replaces what Intercom's tours add-on does, but with full control over timing, styling, and mobile.

## What you save

The Proactive Support Plus add-on costs $99/month for 500 tour sends, with overages beyond that. Tour Kit's core is MIT-licensed and free. The Pro package is a one-time $99 purchase.

One limitation: Tour Kit requires React 18+ and has no visual builder. If your product team wants drag-and-drop tour creation, this isn't the right fit.

Full article with working code examples: [usertourkit.com/blog/intercom-product-tour-integration](https://usertourkit.com/blog/intercom-product-tour-integration)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, The Startup*
