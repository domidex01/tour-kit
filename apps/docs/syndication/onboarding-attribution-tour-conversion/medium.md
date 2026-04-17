# Onboarding Attribution: Which Tour Actually Drove the Conversion?

## Most SaaS teams can't answer this question. Here's how to fix that.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-attribution-tour-conversion)*

Your onboarding flow has five tours. A user completes three of them, skips two, then upgrades to paid on day nine. Which tour gets credit?

If you said "the last one they saw," you're using last-touch attribution, and you're probably wrong about what's working. If you said "all of them equally," you're using linear attribution, and you're definitely wrong.

As of April 2026, 95% of SaaS companies misattribute revenue by relying on single-touch models. And that stat is about marketing channels. Inside the product, where tours, checklists, and tooltips compete for credit, attribution is practically nonexistent.

## The problem with single-touch attribution in onboarding

Consider a five-tour onboarding sequence where 60% of users who complete all five tours convert to paid. With last-touch, the fifth tour gets full credit, even if Tour 2 (the "aha moment" tour) is where users actually decided to stay.

Remove Tour 2 and conversion drops to 15%. But your attribution model would never tell you that.

Companies switching from single-touch to multi-touch attribution see a 20-30% improvement in marketing ROI. The same principle applies inside the product.

## Six attribution models, applied to onboarding

**First-touch** gives 100% credit to the first tour. Good for understanding what starts activation.

**Last-touch** gives 100% credit to the last tour before conversion. Good for understanding what closes.

**Linear** splits credit equally. Simple but rarely accurate.

**Time-decay** gives more credit to recent touchpoints. Works well for short trial cycles.

**U-shaped** gives 40% to the first touchpoint, 40% to the last, and distributes 20% across everything in between. This is the model most SaaS teams should start with.

**Data-driven** uses ML to weight touchpoints based on actual conversion correlation. Requires 1,000+ conversions per month.

## The holdout group test

Before worrying about which tour gets credit, prove that tours matter at all. Set aside 10-20% of new users who never see onboarding tours. Compare their trial-to-paid conversion rate.

If the holdout group converts at nearly the same rate, your tours aren't driving conversion. They're just present during it.

## Where to start

If you have fewer than 500 conversions per month, start with U-shaped attribution. It captures the two most important signals without requiring the data volume that algorithmic models need.

For teams just starting out: implement first-touch and last-touch side by side. When they disagree about which tour is most valuable, that's where multi-touch models add clarity.

**Full article with TypeScript code examples and implementation guide:** [usertourkit.com/blog/onboarding-attribution-tour-conversion](https://usertourkit.com/blog/onboarding-attribution-tour-conversion)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, The Startup*
