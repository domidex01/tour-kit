## Thread (6 tweets)

**1/** Most product tour analytics stop at completion rate. That's a vanity metric. Here's a two-layer framework that connects tour data to actual product outcomes.

Data from 15M tour interactions inside:

**2/** The benchmarks are stark:

- 3 steps → 72% completion
- 4 steps → 45%
- 5 steps → 34%
- 7 steps → 16%

Each step past three costs ~15-20 percentage points. Keep tours under 5 steps or split into sequences.

**3/** Self-serve tours (user clicks a launcher) complete at 67% — 123% higher than auto-triggered tours.

The cheapest analytics win? Add a progress bar: +12% completion, -20% dismissal. Almost free to implement.

**4/** The framework has two layers:

Layer 1: Tour-level (completion, step drop-off, trigger-to-start, time per step)

Layer 2: Product-level (activation rate, time-to-value, feature adoption, day-7 retention)

Most teams only have Layer 1 and can't answer "did this tour change behavior?"

**5/** The counterintuitive move: instrument before you build.

Define what "success" means at the product level first. Then design tour steps around what you need to measure. Not the other way around.

**6/** Full framework with formulas, TypeScript code for routing events to PostHog/Mixpanel/Amplitude, and a comparison of analytics tools:

https://usertourkit.com/blog/product-tour-analytics-framework
