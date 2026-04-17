## Subreddit: r/reactjs

**Title:** I analyzed benchmark data from 15M product tour interactions and built a measurement framework — here's what the data shows

**Body:**

I've been building product tours in React and got frustrated that most analytics stop at "completion rate." A 70% completion rate sounds great until you realize activation rate didn't move. So I put together a two-layer measurement framework.

**The benchmarks that surprised me** (from Chameleon's analysis of 15M interactions):

- 3-step tours complete at 72%. Add a fourth step and you drop to 45%. By seven steps you're at 16%.
- Self-serve tours (user clicks a launcher) complete at 67% — that's 123% higher than auto-triggered tours
- Adding a progress bar gives +12% completion and -20% dismissal. Cheap win.

**The framework splits into two layers:**

Layer 1 is tour-level: completion rate, step drop-off, trigger-to-start rate, time per step. These tell you how users interact with the tour.

Layer 2 is product-level: activation rate, time-to-value, feature adoption, day-7/14/30 retention. These tell you if the tour actually changed behavior.

Most teams only measure Layer 1. The gap between "user completed the tour" and "user actually changed their behavior" is where the real signal lives.

**One thing I wish I'd done earlier:** instrument before building. Define what "success" means at the product level, then design tour steps around what you need to measure. Not the other way around.

I wrote up the full framework with formulas, TypeScript code for routing events to PostHog/Mixpanel, and a comparison of analytics capabilities across different tools: https://usertourkit.com/blog/product-tour-analytics-framework

Would love to hear how others are measuring tour effectiveness. Are you tracking beyond completion rate?
