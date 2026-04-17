## Thread (6 tweets)

**1/** Product tour lifecycle events tell you who finished step 5. They don't tell you who clicked the upgrade button, watched the demo video, or submitted the form.

Here's how to track what actually matters — typed custom events, zero bundle cost.

**2/** The pattern: TypeScript discriminated unions on the metadata field.

Each interaction type (CTA click, video play, form submit) gets its own interface. The compiler catches mismatched metadata before the event fires.

~200 bytes per event payload.

**3/** The helpers are 4-8 line wrappers over `stepInteraction()`. They compile away entirely.

A 5-step tour with 2 custom interactions per step = ~15 events, batched in groups of 10 = 1-2 network requests total.

**4/** Built a custom plugin in ~40 lines. The trick: `navigator.sendBeacon` in `destroy()` handles the page-close edge case where regular `fetch` gets cancelled.

97.4% browser support, W3C guarantees delivery up to 64KB.

**5/** Biggest gotcha: PostHog silently drops nested metadata objects during property indexing.

Keep everything flat — one level of key-value pairs. Saved us a week of "why aren't my filters working?"

**6/** Full tutorial with 6 code examples, comparison table, and troubleshooting:

https://usertourkit.com/blog/custom-events-tour-analytics-react

Works with PostHog, Mixpanel, GA4, or any custom backend through the plugin interface.
