## Thread (6 tweets)

**1/** Expansion revenue is now 40-50% of new ARR at the median SaaS company.

Acquiring a new customer costs 5x more than expanding an existing one.

Yet most teams' upsell strategy is a modal with a pricing table and a "please upgrade" button. 🧵

**2/** The problem isn't that users won't upgrade. It's that upgrade modals ask for a decision before showing the value.

An upsell tour shows the premium feature in context first. "You created 40 reports this month — here's what Pro reporting would show you." Then the ask.

**3/** We studied 15 SaaS upsell implementations. The pattern that consistently outperforms:

Trigger at 80% of plan limits, not 100%.

By 100%, users are frustrated. By 80%, they're engaged and haven't hit the wall yet. Miro, Slack, Dropbox all do this.

**4/** Companies with 120%+ NRR command 30-50% higher valuation multiples than peers at 100% NRR — even with identical ARR growth.

A 10-point NRR improvement is worth a 20-30% valuation bump.

That's what behavioral upsell tours are actually optimizing for.

**5/** In React, the trigger is a simple render condition:

```tsx
if (usagePercent < 0.8) return null;
// tour renders here
```

But the more interesting layer is wiring adoption scoring → upsell triggers → expansion revenue attribution. That pipeline is fully measurable.

**6/** Full guide: 5 upsell patterns from 15 SaaS products, NRR benchmarks, React code for usage triggers and adoption scoring, fatigue prevention system, and attribution wiring.

https://usertourkit.com/blog/product-tour-upselling
