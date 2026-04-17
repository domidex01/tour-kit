---
title: "Progressive disclosure in onboarding: stop showing users everything at once"
published: false
description: "Jakob Nielsen's 1995 pattern still solves modern onboarding. Data shows progressive disclosure boosts completion from 53% to 75%. Here's the three-layer framework with React code."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/progressive-disclosure-onboarding
cover_image: https://usertourkit.com/og-images/progressive-disclosure-onboarding.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/progressive-disclosure-onboarding)*

# Progressive disclosure in onboarding: the right amount of information

Jakob Nielsen introduced progressive disclosure in 1995 to solve a tension that hasn't gone away: users want powerful software, but they don't want to learn it all at once. Thirty years later, SaaS onboarding still gets this wrong. Most product tours dump every feature into a linear walkthrough, hope for the best, and then wonder why 47% of users skip the tour entirely ([UserGuiding, 2026](https://userguiding.com/blog/user-onboarding-statistics)).

Progressive disclosure flips that approach. Show the core action first. Surface secondary features when the user reaches them. Reveal advanced capabilities once someone has demonstrated they need them.

Companies using contextual onboarding with this pattern boosted completion rates to 75% and saw a 30% increase in paid conversions ([Userpilot, 2025](https://userpilot.com/blog/progressive-disclosure-examples/)).

This guide covers the theory, the data, the React implementation, and the measurement framework. We built [Tour Kit](https://usertourkit.com/) to implement progressive disclosure as a first-class architecture, so we'll use it for examples. The principles apply to any stack.

```bash
npm install @tourkit/core @tourkit/react @tourkit/hints
```

## What is progressive disclosure in onboarding?

Progressive disclosure in onboarding is a design strategy that reveals interface complexity gradually, matching information delivery to user readiness rather than front-loading every feature at once. Nielsen Norman Group's research confirms the pattern improves 3 of usability's 5 core components: learnability, efficiency of use, and error rate ([NN/g](https://www.nngroup.com/articles/progressive-disclosure/)).

In an onboarding context, this means a new user sees only the single action needed to reach their first success, with additional features surfacing through tooltips, hotspots, and contextual prompts as behavior signals indicate readiness.

## Why progressive disclosure matters

Linear onboarding fundamentally mismatches how people learn new software. Showing every feature at once overloads working memory, which handles roughly 4 items at a time, and produces the 53% average completion rate that Chameleon's 15-million-interaction dataset documents ([Chameleon, 2026](https://www.chameleon.io/blog/product-tour-benchmarks-highlights)). Companies that switch to contextual, behavior-triggered disclosure see completion climb to 75%.

| Approach | Completion rate | Paid conversion impact |
|----------|----------------|----------------------|
| Linear tour (8+ steps) | 53% average | Baseline |
| Progressive disclosure (contextual) | 75% | +30% paid conversions |
| Self-serve launcher | 67% | +20% feature adoption |

*Sources: Chameleon 15M-interaction benchmark, Userpilot*

## The three layers of progressive onboarding

Progressive onboarding works in three distinct layers, each triggered by different user behavior signals rather than arbitrary timelines.

### Layer 1: Orientation (first session)

The first layer answers one question: "What's the single most important thing I should do right now?" Everything else stays hidden.

```tsx
// src/components/OrientationTour.tsx
import { TourProvider, Tour, TourStep } from '@tourkit/react';

function OrientationTour() {
  return (
    <TourProvider>
      <Tour
        tourId="orientation"
        trigger="manual"
        onComplete={() => {
          localStorage.setItem('orientation-done', 'true');
        }}
      >
        <TourStep
          target="#create-first-project"
          title="Create your first project"
          content="This is the only thing that matters right now."
          placement="bottom"
        />
      </Tour>
    </TourProvider>
  );
}
```

One step. That's the whole orientation tour. The restraint is the point.

### Layer 2: Contextual guidance (first week)

Once a user completes their first core action, layer 2 activates. Hints and hotspots appear next to features the user hasn't discovered yet, but only when they navigate to the relevant screen.

```tsx
// src/components/ContextualHints.tsx
import { HintProvider, Hint } from '@tourkit/hints';

function ContextualHints() {
  const orientationDone = localStorage.getItem('orientation-done');
  if (!orientationDone) return null;

  return (
    <HintProvider>
      <Hint
        hintId="dashboard-filters"
        target="#filter-bar"
        content="Filter by status, assignee, or date range"
        trigger="hover"
        dismissible
      />
      <Hint
        hintId="bulk-actions"
        target="#bulk-select"
        content="Select multiple items to move, archive, or tag in bulk"
        trigger="click"
        showWhen={() => getItemCount() >= 3}
      />
    </HintProvider>
  );
}
```

The `showWhen` prop is doing the progressive disclosure work here. Bulk actions don't appear until the user has enough items to need them.

### Layer 3: Power user features (weeks 2+)

The final layer surfaces advanced capabilities to users who've demonstrated proficiency. Keyboard shortcuts, API access, automation rules. These appear through checklists or prompts that reference what the user has already accomplished.

## Common mistakes that kill progressive disclosure

**Treating it as "hide everything"** — Progressive disclosure doesn't mean making features hard to find. Nielsen's research warns that more than 2 disclosure levels causes navigation confusion.

**Ignoring behavior signals** — Time-based drip campaigns aren't progressive disclosure. They're scheduled interruptions. Real PD is behavior-triggered.

**Skipping accessibility** — Disclosure widgets need `aria-expanded`, `aria-controls`, and Esc key support per WCAG 2.1 1.4.13.

## Measuring each layer

For each disclosure layer, track four metrics:

1. **Trigger rate**: what percentage of eligible users see this layer?
2. **Completion rate**: of those who see it, what percentage complete the guided action?
3. **Activation correlation**: does completing this layer correlate with reaching activation?
4. **Time to value**: how long after disclosure does the user first use the feature independently?

| Layer | Trigger rate target | Completion rate target |
|-------|-------------------|---------------------|
| Orientation (Layer 1) | 95%+ | 75%+ |
| Contextual (Layer 2) | 60-80% | 50%+ |
| Power user (Layer 3) | 20-30% | 40%+ |

## The architecture angle

A monolithic tour library that loads 40KB on first page load violates progressive disclosure at the technical level. Tour Kit's 10-package architecture lets you install only what each layer needs:

```bash
# Layer 1: Orientation tours
npm install @tourkit/core @tourkit/react

# Layer 2: Add contextual hints
npm install @tourkit/hints

# Layer 3: Add advanced features as needed
npm install @tourkit/checklists @tourkit/announcements @tourkit/analytics
```

We're biased since we built Tour Kit, so take the architecture pitch with skepticism. The principle applies regardless: load disclosure layers on demand. React.lazy and dynamic imports make this straightforward.

---

Full article with all code examples and FAQ: [usertourkit.com/blog/progressive-disclosure-onboarding](https://usertourkit.com/blog/progressive-disclosure-onboarding)
