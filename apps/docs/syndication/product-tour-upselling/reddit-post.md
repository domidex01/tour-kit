## Subreddit: r/SaaS

**Title:** We studied 15 SaaS upsell implementations. Here's what actually converts.

**Body:**

I've been digging into how growth-stage SaaS products handle upselling and wanted to share what I found after signing up for free plans at 15 products and documenting their exact upgrade flows.

The context: expansion revenue is now 40-50% of new ARR at the median SaaS company (up from ~30% in 2021), and acquiring a new customer costs 5x more than expanding an existing one. So the "upsell problem" is actually the most efficient growth lever most teams have — they're just doing it badly.

**What doesn't work:**

- A modal that fires on day 3 with a pricing table
- Locking features with no preview or context
- Showing the same upgrade prompt every time someone visits a page
- Treating the entire free user base as a homogeneous upsell target

**Five patterns that consistently outperform:**

**1. Feature gating with guided preview.** Instead of showing a locked icon, show a 2-3 step tour of the premium feature before the gate appears. Grammarly does this: 3 free daily uses, then an inline prompt. Users who've experienced the feature convert at much higher rates.

**2. Usage threshold triggers at 80-90%.** Miro and Slack both surface upgrade prompts before users hit the hard limit. By 100%, users are frustrated. By 80%, they're receptive and haven't yet encountered the wall as a blocker.

**3. Milestone celebrations.** Asana detects power user behavior and surfaces advanced features with in-app video content. The timing matters: the user is already engaged and winning. That's when they're most open to "here's more."

**4. Contextual discovery during workflow.** Harvest places premium feature tooltips between commonly-used free features, so users encounter them while doing something they already care about. Not as interruptions.

**5. Usage data in downgrade prevention.** Canva shows "You used background removal 47 times this month" when users visit the billing page. Personalized usage data is far more persuasive than generic benefit lists.

**What I wish more teams thought about:**

Upsell fatigue is real. If you're showing upgrade prompts too often, you're training users to ignore them. Systematic rules help: one upsell tour per feature per 14 days, 30-day cooldown after any dismissal, permanent dismiss option always available.

Also: measure attribution. If you can't connect specific upsell touchpoints to specific MRR, you can't improve the funnel. Most teams run upsell campaigns without any ability to know which one actually closed the deal.

I wrote up the full breakdown including the React implementation patterns: https://usertourkit.com/blog/product-tour-upselling

What upsell patterns have you seen work (or fail badly) in your products?

---

## Alternate for r/reactjs

**Title:** Building usage-triggered upsell tours in React (adoption scoring → upgrade CTA)

**Body:**

Sharing some React patterns for upsell-aware product tours — specifically, how to wire behavioral triggers (usage thresholds, adoption scores) to in-app guided experiences that introduce premium features at the right moment.

The core pattern is gating a tour render on a usage percentage:

```tsx
function UsageUpsellTour({ usagePercent }: { usagePercent: number }) {
  if (usagePercent < 0.8) return null;
  return (
    <TourProvider steps={upsellSteps}>
      <ReportsDashboard />
    </TourProvider>
  );
}
```

The tour only renders when the user is at 80%+ of their plan limit. Not a random pop-up — it fires in response to their own behavior.

The more interesting layer is combining feature adoption scoring with tour triggers:

```tsx
function useUpsellTrigger(featureGroup: string, threshold: number) {
  const { score, features } = useAdoptionScore(featureGroup);
  const { startTour } = useTour();

  if (score >= threshold && !features.includes('premium-explored')) {
    startTour('premium-feature-tour');
  }
}
```

This pipeline — adoption scoring feeds into upsell triggers, which feed into expansion revenue, which feeds into NRR — is measurable end-to-end. You can attribute specific tours to specific upgrades.

Also covered: frequency caps, cooldown periods after dismissal, plan-aware tour content for different tier users, and attribution wiring into Mixpanel/PostHog.

Full write-up with all the code: https://usertourkit.com/blog/product-tour-upselling

Has anyone else built behavioral-triggered upsell flows in React? Curious what patterns have worked.
