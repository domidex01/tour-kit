## Subreddit: r/reactjs

**Title:** I shipped a headless product tour library 30 days ago. Here are the real month-1 numbers.

**Body:**

I built a headless product tour library for React (Tour Kit) as a solo dev and shipped it a month ago. Most "launch retrospective" posts come from projects that already hit 5K+ stars. I wanted to share what realistic month-1 numbers look like for a library that didn't go viral.

The dashboard at day 30: 183 GitHub stars, 89 npm weekly downloads, 487 unique docs visitors, 9 issues filed, 2 external PRs merged.

A few things surprised me. The articles that drove the most traffic to the docs were comparisons and architecture breakdowns, not tutorials. I expected tutorials to win since 73% of devs say they want quickstart guides first (from a 202-developer survey). But it turns out developers search for comparisons when evaluating, and read tutorials after they've already decided.

The biggest mistake: launching with minimal docs. My first three GitHub issues were all "how do I set this up?" Nobody reads API reference first. They want a 5-minute tutorial that ends with something on screen. I assumed developers would figure it out from the types. They didn't.

The second biggest mistake: demoing a headless library. Screenshots and GIFs sell libraries. A headless library's value is in hooks and logic. My initial demos were just code. No visual payoff. Should have had styled example apps ready on day one.

The metric I'm most interested in tracking: still waiting for the first "I switched from X to Tour Kit" post. Stars and npm downloads are mostly noise (npm counts are dominated by CI). The adoption signals that actually mattered were first issue from a stranger (day 4), first external PR (day 19), and first unprompted mention (day 22).

Full article with all the data and what I'd cut from the launch: https://usertourkit.com/blog/tour-kit-launch-metrics-month-1

Curious if others have published their month-1 numbers. What did your early adoption signals look like?
