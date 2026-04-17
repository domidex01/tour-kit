# The Real Cost of Appcues for a 10,000 MAU SaaS

## Every line item, hidden fee, and the build-vs-buy math most pricing pages won't show you

*Originally published at [usertourkit.com](https://usertourkit.com/blog/real-cost-appcues-10000-mau-saas)*

You hit 10,000 monthly active users. Your PM wants to ship an onboarding flow by next quarter. Someone on the team Googles "product tour tool" and Appcues shows up first.

The pricing page says $249/month. Reasonable. You click around, run the numbers, and realize that price is for 2,500 MAU on a feature-stripped plan. At your scale, the real number starts at $18,000/year and can climb past $30,000 once you account for seat caps, premium support, and the features you actually need.

I built Tour Kit as an open-source alternative, so take everything here with appropriate skepticism. But every number comes from public sources: Appcues' own pricing page, Vendr contract data (127 real purchases), and G2/Capterra reviews.

---

## The problem: pricing doesn't scale the way you'd expect

Appcues publishes three tiers, all priced per MAU, but the entry prices are misleading at scale. A 10,000 MAU SaaS pays dramatically more than 4x the base-tier price because Appcues uses non-linear scaling: doubling your MAU more than doubles your cost.

As of April 2026, Growth plan pricing at 2,500 MAU is $879/month, but at 5,000 MAU it jumps to $1,150+ — a 31% increase for 2x the users (Userorbit, 2026).

**The realistic Year 1 cost at 10K MAU:**

- Growth plan (list price): $18,000–$24,000/year
- Unlimited Seats add-on: $2,400/year
- Premium Support (15%): $2,700–$3,600/year
- Year 2 escalator (5%): +$1,155–$1,500
- Implementation services: $0–$10,000 (one-time)
- **Total Year 1 (realistic): $23,100–$40,000**

Vendr's marketplace data across 127 real Appcues purchases shows a median annual contract of $15,000 with mid-market companies (5K–25K MAU) paying $12,000–$40,000/year. The average negotiated discount is 21% off list price.

## The feature gates that inflate your bill

The Essentials plan at $249/month exists mainly as a pricing anchor. At 10,000 MAU it scales to roughly $599/month ($7,188/year), but that price locks out A/B testing, checklists, Salesforce integration, custom CSS, and caps your audience segments at five.

Any team serious about improving onboarding conversion is forced into the Growth tier. That 253% price jump from Essentials to Growth isn't a premium for advanced features — it's the price of a usable product (Userpilot, 2026).

And if your SaaS serves multiple languages? Localization is gated entirely to Enterprise. No Growth-tier option exists.

## The costs that aren't on the pricing page

Three hidden costs catch teams off guard after they sign.

**MAU inflation from SDK placement.** Install the Appcues SDK on your marketing site or any unauthenticated page, and every visitor counts against your MAU quota. There's no per-user overage fee — Appcues force-upgrades you to the next MAU tier for the remaining months on your contract.

**Seats at scale.** Growth plan caps you at 10 seats. At 10,000 MAU, your product org likely has more than 10 people who touch onboarding. The Unlimited Seats add-on costs $2,400/year.

**Analytics that need a supplement.** Multiple reviewers report Appcues' built-in analytics can't do proper funnel analysis. So teams run Appcues alongside Mixpanel or Amplitude, adding $6,000–$24,000/year in analytics tooling.

## When Appcues is worth the money

A product-led growth team that needs to ship onboarding flows in two weeks, doesn't have frontend engineering bandwidth, and is growing fast enough that the annual cost is a rounding error on revenue? Appcues is a reasonable choice. The visual builder genuinely speeds up iteration for non-technical PMs.

Appcues' build-vs-buy argument has a kernel of truth. Their cost calculator estimates $33,800 minimum in team time for building onboarding from scratch. An independent estimate pegs it higher: roughly $60,000.

But those estimates assume building a full onboarding platform from zero. Not integrating a library.

## The math changes with a library

The build-vs-buy framing is a false dichotomy. Your actual options are three, not two: buy a SaaS platform, build from scratch, or integrate an open-source library.

**3-year cost comparison:**

- Appcues Growth (10K MAU): $56,700–$75,600
- Open-source library + engineering time: $33,000

Over three years, the library approach saves $23,700–$42,600. Year 2 is where the gap widens, because SaaS renews at escalating rates while maintenance time typically decreases.

## What to do if you're evaluating right now

**If you're about to sign:** Negotiate hard at quarter-end. Vendr data shows a 21% average discount. Ask specifically about MAU counting on unauthenticated pages and whether localization is included. Get the answers in writing.

**If you're on Appcues and rethinking it:** Budget 2–4 days for a typical 10-step tour migration to a code-owned solution.

**If you're starting fresh:** Try a headless open-source approach before committing to a SaaS contract. No MAU pricing. No vendor lock-in.

---

*Full article with all data tables, code examples, and source links: [usertourkit.com/blog/real-cost-appcues-10000-mau-saas](https://usertourkit.com/blog/real-cost-appcues-10000-mau-saas)*

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, The Startup
