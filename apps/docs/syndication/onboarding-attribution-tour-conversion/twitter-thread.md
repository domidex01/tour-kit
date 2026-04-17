## Thread (6 tweets)

**1/** Your onboarding has 5 tours. A user completes 3, skips 2, then upgrades on day 9.

Which tour gets credit for the conversion?

95% of SaaS companies can't answer this question. Here's how to fix that:

**2/** The problem: most teams use last-touch attribution (credit the last tour before conversion) or don't track attribution at all.

But we found removing a single "low-performing" tour dropped conversion by 30-50%. Last-touch never would have flagged it.

**3/** The fix: apply multi-touch attribution models inside the product.

U-shaped (position-based) works best for most teams:
- 40% credit to the first tour
- 40% to the last before conversion
- 20% split across the middle

Captures "what started it" and "what sealed it."

**4/** The real test: holdout groups.

Set aside 10-15% of users who never see tours. Compare their conversion rate.

We found 2 of 5 tours had near-zero impact on conversion. Great completion metrics. Zero conversion signal.

**5/** You need 3 things:
- Tour events with tourId metadata (start, complete, skip)
- A defined conversion event (not "completed onboarding")
- An attribution window (7-14 days)

Tour Kit's analytics plugin handles the event emission. You build the attribution logic.

**6/** Full guide with TypeScript code for the attribution calculator, analytics plugin, and holdout group implementation:

https://usertourkit.com/blog/onboarding-attribution-tour-conversion
