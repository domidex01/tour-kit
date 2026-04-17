## Subreddit: r/reactjs

**Title:** The average onboarding checklist completion rate is 19.2% — here's why and how to build a better one in React

**Body:**

I've been researching onboarding checklist patterns and found some surprising data. Userpilot published benchmarks across 188 SaaS companies — the average completion rate is 19.2%, with a median of just 10.1%. FinTech does best at 24.5%. MarTech is worst at 12.5%.

The biggest factor isn't design polish, it's task count. Companies with $1-5M revenue average 27.1% completion (they keep checklists to 3-5 tasks). Scale to $10-50M and it drops to 15% because every PM adds their feature. Miller's Law says working memory holds 5-7 items — go past that and completion falls off a cliff.

Three things that actually help: keep it to 4-7 tasks (pre-credit ones the user already finished), make it collapsible instead of modal (123% higher completion when users trigger it voluntarily), and connect checklist items to contextual tours (21% more likely to complete the tour).

One thing most implementations miss entirely: accessibility. The W3C spec says progress indicators need `role="progressbar"` with `aria-valuenow`, task items need keyboard focus management, and completions should announce to screen readers. I couldn't find a single competitor article that mentions any of this.

I wrote up the full breakdown with a working React component (40 lines, headless, typed, accessible): https://usertourkit.com/blog/what-is-onboarding-checklist

Curious if anyone here has real-world data on what completion rates look like at their company?
