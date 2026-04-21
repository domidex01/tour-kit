---
title: "The two-layer analytics framework for product tours (with benchmarks from 15M interactions)"
published: false
description: "Most teams track tour completion rate and stop there. Here's a measurement framework that connects tour-level metrics to actual product outcomes like activation and retention."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/product-tour-analytics-framework
cover_image: https://usertourkit.com/og-images/product-tour-analytics-framework.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-analytics-framework)*

# Product tour analytics: the complete measurement framework

Most teams ship product tours and never measure whether they worked. They track completion rates at best, miss the downstream impact entirely, and end up guessing which tours to improve.

A measurement framework fixes this by connecting tour-level data (step completion, drop-offs, time-per-step) to product-level outcomes (activation, retention, feature adoption). This guide covers both layers. You'll get benchmark data from 15 million real tour interactions, formulas you can copy, and working code that routes events to your analytics stack.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

Tour Kit's analytics package fires events for every tour interaction: start, step view, step complete, dismiss, and finish. You choose where those events go (PostHog, Mixpanel, Amplitude, or your own endpoint).

## What is a product tour analytics framework?

A product tour analytics framework is a structured approach to measuring onboarding effectiveness across two distinct layers: tour-level metrics that track user interactions within a tour (completion rate, step drop-off, dismiss rate) and product-level metrics that measure behavior changes after the tour (activation rate, time-to-value, feature adoption, retention). Unlike tracking completion rates alone, a two-layer framework reveals whether tours actually change user behavior. As of April 2026, Chameleon's analysis of 15 million product tour interactions found the average tour completion rate sits at 61%, but completion without behavior change is a vanity metric.

The gap between these two layers is where most analytics setups fail. A team sees 70% completion and assumes the tour works. But if activation rate doesn't move, that 70% is meaningless. The framework described here connects both layers so you can trace a tour interaction all the way to a business outcome.

## Why tour analytics matters more than you think

Product tours touch every new user. They're the first impression of your product, and they're measurable in ways that most onboarding content isn't.

Yet analytics capabilities vary wildly across tools. Appcues provides basic completion rates without funnel tracking or path analysis. Userpilot offers trend analysis, funnel visualization, and session recordings. Amplitude treats tours as part of the behavioral analytics workflow itself.

The practical difference? Teams using Appcues often can't answer "which step causes the most drop-offs" without exporting data manually. Teams with deeper analytics can segment by cohort, compare trigger methods, and run A/B tests on tour variants, all from one dashboard.

Here's the business case in numbers: Take (a digital communications platform) saw a 124% increase in activation rates after implementing user data tracking across their onboarding flows. Yotpo improved retention by 50% through completion metric refinement. Litmus achieved a 2,100% increase in feature adoption using behavioral onboarding optimization ([Appcues benchmark report](https://www.appcues.com/blog/user-onboarding-metrics-and-kpis)). These aren't Tour Kit numbers. They're industry results that show what's possible when you actually measure tour impact.

## Benchmarks: what good looks like

Before measuring your own tours, you need a baseline. Chameleon analyzed 15 million product tour interactions across hundreds of SaaS products and published the most comprehensive benchmark data available as of April 2026.

The overall average completion rate is 61%, but that number is nearly useless without context. Tour length, trigger type, and design elements shift completion rates by 50+ percentage points in either direction.

Here are the benchmarks that actually matter for planning:

- 3-step tours: 72% completion (the sweet spot)
- 5-step tours: 34% completion (the median)
- 7-step tours: 16% completion (the danger zone)
- Self-serve/launcher tours: 67% completion, 123% higher than auto-triggered
- Checklist-triggered tours: 21% above average completion
- Progress indicators: +12% completion, -20% dismissal
- Average across all tour types: 61%

These numbers come from real production tours, not controlled experiments. Your mileage will vary based on product complexity and user intent. But if your 4-step tour completes at 30%, you know you're below the baseline and something specific needs fixing.

## Layer 1: tour-level metrics

Tour-level metrics capture how users interact with the tour itself, covering everything from step-by-step progression to dismissal patterns and dwell time. These four metrics form the foundation of your product tour analytics framework, but they're necessary and insufficient on their own: high completion doesn't guarantee behavior change.

### Completion rate

The percentage of users who finish every step. Formula: `Users who finished ÷ Users who started × 100`. The industry average is 61% across all tour types ([Chameleon, 15M interactions](https://www.chameleon.io/blog/product-tour-benchmarks-highlights)).

But averages hide the real story. Tour length is the primary completion rate killer, and the relationship is steep:

| Tour length | Completion rate | Drop per step |
|---|---|---|
| 3 steps | 72% | Baseline |
| 4 steps | 45% | -27 pts |
| 5 steps | 34% | -11 pts |
| 7 steps | 16% | -9 pts/step |

Each step past three costs roughly 15-20 percentage points. A tour "that could go on for an unknown amount of steps increases anxiety and lowers patience" ([Chameleon benchmark analysis](https://www.chameleon.io/blog/product-tour-benchmarks-highlights)). Progress indicators partially offset this: +12% completion and -20% dismissal rate in Chameleon's data.

### Step drop-off rate

Completion rate tells you the overall picture. Step drop-off tells you *where* users leave. Calculate it per step: `Users who saw step N but didn't reach step N+1 ÷ Users who saw step N × 100`.

Userpilot's taxonomy is useful here: a drop-off is either a clarity issue (user didn't understand), a friction issue (too many steps or too much effort), or a motivation issue (user didn't see the value) ([Userpilot, drop-off rate guide](https://userpilot.com/blog/drop-off-rate/)). You can't fix the right problem without knowing which type it is.

Here's how to track step-level events with Tour Kit:

```tsx
// src/analytics/tour-events.ts
import { TourAnalyticsPlugin } from '@tourkit/analytics';

const tourAnalytics: TourAnalyticsPlugin = {
  name: 'posthog-tour-tracker',
  onStepView: (tourId, stepIndex, stepMeta) => {
    posthog.capture('tour_step_viewed', {
      tour_id: tourId,
      step_index: stepIndex,
      step_title: stepMeta.title,
      timestamp: Date.now(),
    });
  },
  onStepComplete: (tourId, stepIndex) => {
    posthog.capture('tour_step_completed', {
      tour_id: tourId,
      step_index: stepIndex,
    });
  },
  onTourDismiss: (tourId, stepIndex) => {
    posthog.capture('tour_dismissed', {
      tour_id: tourId,
      dismissed_at_step: stepIndex,
    });
  },
  onTourComplete: (tourId) => {
    posthog.capture('tour_completed', { tour_id: tourId });
  },
};
```

This sends every interaction to PostHog. Swap the `posthog.capture` call for Mixpanel's `mixpanel.track` or Amplitude's `amplitude.track` if you use those instead. The key: *you* own the data. It lives in your analytics stack, not behind a vendor login.

### Trigger-to-start rate

Self-serve tours (user-triggered via launcher or checklist) complete at 67%, which is 123% higher than auto-triggered tours ([Chameleon benchmarks](https://www.chameleon.io/blog/product-tour-benchmarks-highlights)). Checklist-triggered tours run 21% above average. And 60% of users who complete a checklist tour continue taking additional tours in the same session.

The metric most teams miss is *trigger-to-start rate*: of users who saw the tour trigger (tooltip, launcher button, checklist item), how many actually started? A low trigger-to-start rate means your targeting or timing is off. You're showing tours to users who don't want them.

### Time per step

Average time spent on each step reveals whether users are reading or clicking through. Steps with abnormally short dwell times (under 2 seconds) suggest users aren't engaging with the content. Steps with abnormally long dwell times (over 30 seconds) suggest confusion. Both signal that a specific step needs redesign.

## Layer 2: product-level metrics

Product-level metrics answer the question tour-level data can't: did the tour actually change user behavior in a way that matters to the business? These metrics sit outside the tour itself, measuring activation rates, feature adoption, time-to-value, and retention across cohorts who completed, dismissed, or never saw the tour. Without this layer, you're optimizing for completion without knowing if completion drives anything.

### Activation rate

Formula: `Users who reached activation milestone ÷ Total onboarding cohort × 100`. Your activation milestone is product-specific. It might be "created first project," "invited a team member," or "sent first message." The tour's job is to get users there faster.

Compare activation rates between users who completed the tour and users who didn't (or who dismissed it). If there's no meaningful difference, the tour isn't driving activation regardless of its completion rate.

### Time-to-value

How long from signup to the user's first "aha moment." Tours should compress this. Measure it as a cohort metric: average time-to-value for users who saw Tour A vs. a control group. A 20% reduction in time-to-value is a strong signal that the tour is doing its job.

### Feature adoption rate

Formula: `Users who used feature ≥ N times ÷ Total cohort × 100`. Feature-specific tours should move this number for the targeted feature. If your "dashboard filters" tour doesn't increase filter usage in the 7 days after completion, the tour needs work.

Tour Kit's adoption package tracks this directly:

```tsx
// src/analytics/adoption-tracking.ts
import { useAdoptionTracking } from '@tourkit/adoption';

function DashboardFilters() {
  const { trackFeatureUse } = useAdoptionTracking('dashboard-filters');

  const handleFilterApply = (filter: FilterConfig) => {
    trackFeatureUse(); // records usage event
    applyFilter(filter);
  };

  return <FilterPanel onApply={handleFilterApply} />;
}
```

### Retention and support ticket proxy

Retention rate at 7, 14, and 30 days post-onboarding, segmented by tour completion status, is the ultimate measure of tour effectiveness. Tours that improve day-7 retention by even 5 percentage points are worth significant investment.

Support ticket volume is an underused proxy metric. Accelo saw a 253% boost in help guide interaction after tour optimization ([Appcues](https://www.appcues.com/blog/user-onboarding-metrics-and-kpis)). The inverse signal is more useful: did support tickets for the toured feature decrease? If your "getting started" tour reduces "how do I start?" tickets by 30%, you have a direct ROI story for engineering time spent on tours.

## Building the framework: instrument before you build

Most teams design a tour, ship it, then think about measurement. Flip this. Design your measurement checkpoints first, then build the UX around what you need to track.

Here's the practical workflow:

1. Define the product-level outcome you want to move (activation rate, feature adoption, retention)
2. Identify the specific user behavior that indicates that outcome (e.g., "created first project within 24 hours")
3. Design tour steps that guide users toward that behavior
4. Instrument every step with events that map to your funnel
5. Set up a dashboard that shows both layers side-by-side

This "analytics-first" approach prevents the most common failure: tours with high completion rates that don't change anything. You'll know whether a tour works within the first cohort (usually 100-200 users) because you defined "works" before you wrote step 1.

## Tools for product tour analytics

| Approach | Analytics depth | Data ownership | Best for |
|---|---|---|---|
| Tour Kit + PostHog/Mixpanel | Full: events, funnels, cohorts, retention | You own everything | Teams with existing analytics stack |
| Userpilot | Advanced: trends, funnels, flows, session recordings | Vendor-controlled | Product teams wanting all-in-one |
| Appcues | Basic: completion rates only | Vendor-controlled | Quick setup, less measurement depth |
| Chameleon | Advanced: step analytics, A/B testing | Vendor-controlled | Teams needing built-in experimentation |

Tour Kit takes a different approach from the vendor tools listed above. Instead of building analytics into the tour platform, it fires standardized events to whatever analytics tool you already use. We built Tour Kit this way because locking analytics inside a tour vendor creates a dependency you don't need, and it means your tour data lives alongside every other product event instead of in a separate silo.

The tradeoff is real, though. Tour Kit's biggest limitation here is the lack of a built-in analytics dashboard or visual builder. If you want everything in one tool with zero setup, Userpilot or Chameleon are more practical. Tour Kit requires you to set up the analytics pipeline yourself and write React code for every tour, which takes more initial work but gives you full control. We're biased (we built Tour Kit), so evaluate based on your team's analytics maturity and engineering capacity.

## Common measurement mistakes

We tested our own analytics setup across multiple Tour Kit demo apps and hit every one of these mistakes before finding the pattern that works. The five errors below account for most cases where teams have analytics in place but still can't explain whether their tours drive results.

**Measuring completion rate in isolation.** A 75% completion rate means nothing if activation rate doesn't move. Always pair tour-level metrics with product-level outcomes.

**Averaging across all users.** New signups behave differently from re-engaged users seeing a feature tour. Segment by cohort: signup week, plan type, trigger method. Polluted averages hide real problems.

**Ignoring dismiss signals.** A dismissed tour isn't a failed tour. If a user dismisses at step 2 and still activates within 24 hours, the tour did enough. Track dismiss-to-activation, not just dismiss rate.

**Skipping the control group.** Without a holdout group that doesn't see the tour, you can't attribute behavior changes to the tour. Even a 10% holdout gives you a baseline to compare against.

**Over-instrumenting.** You don't need 40 events per tour. Track: tour started, each step viewed, step completed (if there's an action), tour completed, tour dismissed (with step index). Six to eight event types cover everything.

## FAQ

### What is a good product tour completion rate?

The industry average is 61% based on Chameleon's analysis of 15 million interactions. Three-step tours hit 72%; seven-step tours drop to 16%. A "good" rate depends on your tour's goal. Mandatory setup wizards should aim for 80%+, while optional feature tours at 50% may be healthy. Compare against your own baseline.

### How do I track product tour analytics with a headless library?

Headless libraries like Tour Kit fire lifecycle events (step view, complete, dismiss) that you route to your existing analytics tool. Configure a plugin with `@tourkit/analytics` that maps each event to a PostHog, Mixpanel, or Amplitude call. Your tour data then lives in the same product analytics framework as every other user event.

### What metrics should I track beyond completion rate?

Track step drop-off rate to find where users leave, trigger-to-start rate to measure targeting quality, time-per-step to detect confusion, and downstream product metrics like activation rate, feature adoption, and day-7 retention. The two-layer product tour analytics framework in this guide maps tour interactions to business outcomes.

### How many steps should a product tour have?

Data from 15 million interactions shows each step past three costs 15-20 percentage points in completion rate. Three-step tours complete at 72%; five-step tours drop to 34%. Keep tours under five steps. Split longer flows into checklist-driven sequences, which maintain a 21% higher completion rate than monolithic tours.

### Does adding progress indicators improve tour completion?

Yes. Progress indicators increase completion rate by 12% and reduce dismissal rate by 20%, according to Chameleon's benchmark data. They reduce the anxiety of "how much longer?" that causes users to bail on longer tours. Tour Kit's step components accept progress props that you can render however fits your design system.

---

*Get started with Tour Kit: [documentation](https://usertourkit.com/) | [GitHub](https://github.com/domidex01/tour-kit) | `npm install @tourkit/core @tourkit/react @tourkit/analytics`*
