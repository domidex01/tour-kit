## Thread (6 tweets)

**1/** The average product tour completion rate is 61%.

But that number hides a brutal step-count cliff.

I analyzed the only large-scale public dataset (15M interactions) — here's what actually matters: 🧵

**2/** The step-count cliff:

- 4 steps → 74% completion
- 5 steps → 34% completion

That's not gradual decline. Adding one step cuts your completion rate in half.

Keep tours under 5 steps. Always.

**3/** How the tour starts matters as much as length:

- Self-serve (help menu) → 123% higher than baseline
- User-initiated → ~67%
- Contextual (on-page) → 69.56%
- Time-delayed auto-play → 31%

When users choose to learn, they finish. When you interrupt them, they dismiss.

**4/** The checklist gap nobody talks about:

Checklist completion: 19.2% average
Tour completion: 61% average

But checklist-TRIGGERED tours are 21% more likely to be completed.

Connect the two. Checklist = motivation. Tour = execution.

**5/** The caveats:

- This data is from 2019 (Chameleon). No comparable recent dataset exists
- Skewed toward SaaS companies
- 70% of users skip linear tours entirely

Your baseline should be your own first measurement, not an industry average.

**6/** Full breakdown with React code examples for step-level analytics tracking, plus a tool comparison table:

https://usertourkit.com/blog/product-tour-completion-rate-benchmarks

Code shows how to instrument PostHog/Mixpanel callbacks and compute completion rates from raw events.
