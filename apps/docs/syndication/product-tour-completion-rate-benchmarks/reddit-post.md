## Subreddit: r/reactjs

**Title:** I analyzed the only large-scale dataset on product tour completion rates — here's what the numbers say (with React analytics code)

**Body:**

I've been digging into product tour completion data for a metrics guide I wrote, and the numbers are more dramatic than I expected.

Chameleon published the only large-scale public dataset — 15 million tour interactions. The headline number is 61% average completion. But the interesting part is the step-count cliff:

- 2-3 steps: 72% completion
- 4 steps: 74% (the peak)
- 5 steps: 34%
- 7+ steps: 16%

That jump from 4 to 5 steps isn't a gradual decline. It's a 54% drop.

The trigger type matters just as much. Self-serve tours (where users choose to start from a help menu) complete 123% more often than auto-triggered ones. Time-delayed auto-play tours sit at 31% — the worst of any trigger type.

The other finding I found interesting: checklist completion averages just 19.2% (Userpilot data), but checklist-triggered tours are 21% more likely to be completed than average tours. Connecting the two seems to be the move.

I wrote up the full analysis with React code examples for instrumenting step-level analytics — tracking which specific step users drop off at, computing completion rates from raw events, and wiring up PostHog/Mixpanel callbacks. The code uses Tour Kit (which I work on, full disclosure) but the event schema pattern works with any tour library.

Full article with code examples and comparison tables: https://usertourkit.com/blog/product-tour-completion-rate-benchmarks

Would be curious if anyone has their own completion rate data to compare against these benchmarks — the Chameleon dataset is from 2019 and I haven't found anything more recent at similar scale.
