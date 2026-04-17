## Subreddit: r/reactjs (primary), r/SideProject (secondary)

**Title:** I almost charged $79/month for a 7KB React library. Here's why I went with $99 one-time instead.

**Body:**

I've been building an open-source product tour library for React (Tour Kit). When it came time to price the Pro packages, I spent three weeks drafting a standard SaaS pricing page with monthly tiers before scrapping the whole thing.

The problem: Tour Kit is a React library. It ships in your bundle, runs locally, doesn't phone home. There's no server. No dashboard. No infrastructure I need to maintain per-user. Charging monthly for something sitting in `node_modules` felt like charging rent on furniture the buyer already owns.

So I looked at the data. The median dev tool costs ~$32/user/month ($384/year). Meanwhile, 78% of finance decision-makers are increasing scrutiny on recurring costs, and 62% of businesses are actively consolidating SaaS subscriptions. Subscription fatigue is very real in 2026.

I landed on $99 one-time for all Pro packages (surveys, scheduling, adoption tracking, checklists, announcements, media, analytics). The three core packages (@tour-kit/core, @tour-kit/react, @tour-kit/hints) stay MIT-licensed and free forever. The boundary matters: the free tier is functionally complete for building product tours. Pro adds adjacent tools, not gated core features.

What I'd do differently: start at $149 and run launch sales at $99, rather than starting at $99 with no room to discount. Also would set activation limits from day one.

The honest tradeoff: no MRR means I'm always starting from zero. But "pay once, use forever" stops people mid-scroll in a way that subscription #131 never will.

Full writeup with all the data points and pricing research: https://usertourkit.com/blog/why-i-chose-99-one-time-over-300-month-recurring

Happy to answer questions about the pricing decision, open-core boundary design, or using Polar.sh for license key delivery.
