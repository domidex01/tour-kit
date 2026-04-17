## Subreddit: r/reactjs

**Title:** I built a 20-line hook to show product tours before the Intercom chat widget

**Body:**

We use Intercom for support chat but got tired of users opening chat to ask "how do I export?" when the feature is right there. Intercom's product tours add-on ($99-$199/month) doesn't have lifecycle callbacks, so you can't coordinate tours with anything else in your app. Their own community forum confirms there's no `onComplete` or `onSkip` event.

We wrote a small integration between Tour Kit (a headless React tour library, <8 KB gzipped) and Intercom's JS API. The core idea: hide the Intercom launcher while a tour is running, show it when the tour finishes, and fire `trackEvent` into Intercom so you can build audience segments based on who saw the tour vs. who skipped it.

The actual hook is about 20 lines. The `trackEvent` calls let you target auto-messages in Intercom without the tours add-on. Users who completed the tour don't get the "need help?" nudge. Users who skipped get a gentler reminder 48 hours later.

One gotcha: if you call `Intercom('update', { hide_default_launcher: true })` before Intercom finishes booting, it gets overwritten by boot defaults. We ended up adding a 500ms delay on initial load.

Full writeup with working code: https://usertourkit.com/blog/intercom-product-tour-integration

Disclosure: I built Tour Kit. The core is MIT/free, happy to answer questions about the integration pattern regardless of which tour library you use.
