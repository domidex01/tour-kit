# What 3 Years of Appcues Actually Costs (and the Open-Source Alternative)

### A sourced TCO model at three MAU tiers

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tco-comparison-appcues-tour-kit)*

Most teams evaluate onboarding tools on year-one cost. That's a mistake.

SaaS contracts compound in ways that don't show up until renewal. MAU-based pricing scales non-linearly. Annual increases of 5-15% are standard. And the switching cost of rebuilding proprietary flows keeps you locked in even when the math stops working.

We built Tour Kit, an open-source React library for product tours. Our bias is obvious. But every number below comes from public pricing pages, Vendr contract intelligence, and published engineering rate data.

## The Model

We compared Appcues (Growth plan) against Tour Kit at three MAU tiers over 36 months. Assumptions: US-based senior React developer at $150/hour, 20% annual MAU growth, 10% annual price increases.

**At 5,000 MAU:** Appcues costs $53,940. Tour Kit costs $25,599. Savings: $28,341 (53%).

**At 25,000 MAU:** Appcues costs $114,000. Tour Kit costs $25,599. Savings: $88,401 (78%).

**At 100,000 MAU:** Appcues costs $264,000+. Tour Kit costs $36,099. Savings: $227,901+ (86%).

The key insight: Tour Kit's cost stays flat regardless of user count. It's a client-side library with zero per-MAU fees. Appcues' cost tracks your user growth, which is the thing you're trying to achieve.

## Where Appcues Still Wins

This wouldn't be honest without acknowledging Appcues' strengths:

If your team has zero React developers, a visual builder is your only option. Tour Kit requires someone who writes JSX.

If you need onboarding live by Friday, Appcues wins. A PM can ship a flow in 15 minutes. Tour Kit takes 2-4 weeks to set up.

If you're under 2,500 MAU and plan to stay there, Appcues Essentials costs $8,964 over three years. That's competitive.

## The Break-Even Point

With a senior React developer available, break-even occurs around month 4 for a 10K MAU SaaS. After that point, Tour Kit is permanently cheaper because there are no recurring per-user fees.

## The Bottom Line

If your Appcues contract is under $10,000/year and you have no frontend engineers, stay. If it's above $15,000/year and you have React developers, the 3-year savings fund 2-3 months of engineering time with money left over.

At 25K+ MAU, Appcues costs 4-7x more than Tour Kit over three years. That's not a rounding error. That's a headcount.

*Suggested Medium publications: JavaScript in Plain English, Better Programming, The Startup*
