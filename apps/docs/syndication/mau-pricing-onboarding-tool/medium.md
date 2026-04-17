# Why onboarding SaaS tools charge per MAU (and why that's a problem)

### The pricing model that punishes product growth

*Originally published at [usertourkit.com](https://usertourkit.com/blog/mau-pricing-onboarding-tool)*

Every major onboarding SaaS product (Appcues, Pendo, Userpilot, Chameleon, UserGuiding) bills by monthly active users. More people use your product, you pay more for onboarding. Sounds fair. But follow the math through two years of growth and you'll find a pricing structure that punishes you for succeeding.

I built Tour Kit as an open-source alternative, so I'm biased. Take what follows with appropriate skepticism. Every cost figure is sourced from vendor pricing pages or Vendr's transaction database.

## What the numbers actually look like

At 2,000 MAUs, prices range from $69/month (UserGuiding) to ~$600/month (Pendo). At 10,000 MAUs, even the cheapest option is $299/month. At 50,000+ MAUs, you're in "custom" territory, negotiating against a vendor who already has your data locked in.

Pendo's real costs are steeper than most expect. Vendr's data from 530 real enterprise purchases shows a median annual contract of $48,500, with deals reaching $147,264/year. One customer reported $120,000/year with a mandatory three-year commitment.

## The core misalignment

Per-MAU pricing means the vendor profits when users log in. Whether those users convert, retain, or generate revenue for you is irrelevant to the bill.

Baremetrics put it bluntly: "Per user pricing kills your growth and sets you up for long term failure, because it's rarely where value is ascribed to your product."

A real example from SSOJet: a company grows from 3,000 to 30,000 MAUs over 18 months. Their onboarding tool bill jumps 10x. Revenue only doubled. The tool vendor captured proportionally more of the new revenue than the customer kept.

## The freemium trap

If you run a freemium product, per-MAU pricing creates a structural contradiction. Freemium maximizes monthly active users by design. Under MAU pricing, maximizing free users also maximizes your onboarding tool bill for users who may never pay you.

50,000 MAUs with a 5% paid conversion rate means you're paying to "onboard" 47,500 users who generate zero revenue.

## The fair counterpoint

Per-MAU pricing exists for real reasons. Infrastructure costs scale with user count. The model is simple. At $10M ARR, a $50K/year tool is 0.5% of revenue.

It breaks for products with non-linear growth, freemium tiers, seasonal spikes, or viral acquisition. Which describes most modern SaaS products.

## The alternative

Open-source headless libraries make onboarding a fixed cost, not a variable one. Engineering time to implement a basic product tour: 1 to 3 days. At $150/hour fully loaded, that's $1,800 to $3,600 one-time. Compare that to $48,500/year median for Pendo.

The tradeoff: you write more code. No visual builder. No drag-and-drop. You need React developers.

But the question for growing SaaS teams is simple: **does the vendor win when I win, or does the vendor win when my users log in?**

*Full article with pricing comparison table, growth projections, and FAQ: [usertourkit.com/blog/mau-pricing-onboarding-tool](https://usertourkit.com/blog/mau-pricing-onboarding-tool)*

*Suggested Medium publications: JavaScript in Plain English, Better Programming, The Startup*
