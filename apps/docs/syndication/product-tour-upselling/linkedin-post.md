Expansion revenue is now 40-50% of new ARR at the median SaaS company. Acquiring a new customer costs 5x more than expanding an existing one.

Yet most engineering teams ship their upsell strategy as a modal with a pricing table and a timer trigger.

I spent time studying how 15 SaaS products handle upgrades in-app — signing up for free plans and documenting the exact flows. The difference between what works and what gets dismissed is stark.

What gets dismissed:
- Upgrade modals on day 3 of signup
- Pricing tables shown before the user understands what they'd be paying for
- The same prompt every time a user encounters a locked feature

What converts:
- Triggering at 80% of plan limits, not 100% (by 100%, the user is frustrated)
- Showing the premium feature in context before the upgrade CTA
- Milestone-based triggers: when a user completes 100 tasks, surface the advanced task management features
- Personalized usage data on downgrade pages ("You used X 47 times this month")

The valuation case for investing in this: companies with 120%+ NRR command 30-50% higher multiples than peers at 100% NRR, even with identical growth rates. A 10-point NRR improvement drives a 20-30% valuation increase.

For engineering managers thinking about where to invest onboarding engineering time: the first-day signup flow is already well-covered in most products. The underinvested area is the behavioral upsell layer — usage thresholds, adoption scoring, frequency caps, and attribution. That's where expansion revenue actually gets built.

I wrote up the full implementation guide for React teams, including the five patterns we observed, NRR benchmarks, and the code for wiring adoption scores to upsell tour triggers.

https://usertourkit.com/blog/product-tour-upselling

#saas #productengineering #react #growth #nrr
