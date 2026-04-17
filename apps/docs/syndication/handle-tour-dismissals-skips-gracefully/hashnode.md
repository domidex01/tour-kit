---
title: "How to handle tour dismissals and skips gracefully"
slug: "handle-tour-dismissals-skips-gracefully"
canonical: https://usertourkit.com/blog/handle-tour-dismissals-skips-gracefully
tags: react, javascript, web-development, typescript, ux
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/handle-tour-dismissals-skips-gracefully)*

# How to handle tour dismissals and skips gracefully

Most product tours fail. Not because the content is wrong, but because the exit experience is an afterthought. Nearly 70% of users skip traditional linear tours, and 78% abandon them by step three ([Chameleon Benchmark Report, 2025](https://www.chameleon.io/blog/effective-product-tour-metrics)). The question isn't how to prevent skipping. It's what happens after.

A user who dismisses your tour and finds a helpful fallback is better off than a user who's forced through seven steps of content they already understand. Tour dismissal handling is the difference between "this app respects my time" and "I'm uninstalling this."

```bash
npm install @tourkit/core @tourkit/react
```

This guide covers the patterns we use in Tour Kit for graceful dismissals: snooze mechanics, resume-from-where-you-left-off, dismissal reason tracking, and contextual re-engagement. Every pattern includes working TypeScript code.

## Why dismissals matter more than completions

Tracking tour completion rates tells you what percentage of users finished. Tracking dismissals tells you *why they didn't*. And that second number is far more actionable.

Users who skip or abandon tours show 34% higher churn rates within 90 days compared to users who complete contextual onboarding. But here's what the churn data actually reveals: users forced through lengthy tours show similar churn to users who skipped entirely. Forced completion doesn't equal retention.

| Tour configuration | Completion rate | Source |
|---|---|---|
| 3-step tour | 72% | Chameleon 2025 |
| 7-step tour | 16% | Chameleon 2025 |
| User-triggered (launcher) | ~67% | Chameleon 2025 |
| Auto-triggered pop-up | Single-digit % | Chameleon 2025 |
| With progress indicator | +12% boost | Chameleon 2025 |

## The five dismissal types

Not all dismissals are equal. We categorize them into five types:

1. **Explicit skip** — User clicks "Skip" or "Not now." Store the skip, don't re-trigger, offer a way back.
2. **Escape key** — WCAG requirement. Treat like a skip with lighter touch.
3. **Click-outside** — Ambiguous. Offer a "Resume tour" nudge after 30 seconds.
4. **Tab/navigation away** — Context switch, not rejection. Persist and resume.
5. **Timeout/inactivity** — Auto-minimize to a beacon after 60+ seconds.

```tsx
// src/components/TourWithSkip.tsx
import { useTour } from '@tourkit/react';

function TourWithSkip() {
  const { dismiss, currentStep, totalSteps } = useTour();

  const handleSkip = () => {
    dismiss({
      reason: 'explicit_skip',
      stepReached: currentStep,
      totalSteps,
    });
  };

  return (
    <button onClick={handleSkip} aria-label="Skip this tour">
      Not now
    </button>
  );
}
```

## Building a snooze pattern in React

The snooze pattern gives users three options instead of binary show/dismiss: **continue**, **snooze** (come back later), or **dismiss** (don't show again).

```tsx
// src/components/TourSnooze.tsx
import { useTour } from '@tourkit/react';
import { useCallback } from 'react';

type SnoozeOption = '1h' | 'tomorrow' | 'next_session';

const SNOOZE_DELAYS: Record<SnoozeOption, number> = {
  '1h': 60 * 60 * 1000,
  'tomorrow': 24 * 60 * 60 * 1000,
  'next_session': -1,
};

function TourSnoozeControls() {
  const { dismiss, snooze, currentStep } = useTour();

  const handleSnooze = useCallback(
    (option: SnoozeOption) => {
      snooze({
        resumeAfter: SNOOZE_DELAYS[option],
        resumeAtStep: currentStep,
        reason: 'snoozed',
      });
    },
    [currentStep, snooze]
  );

  return (
    <div role="group" aria-label="Tour options">
      <button onClick={() => handleSnooze('1h')}>Remind me later</button>
      <button onClick={() => handleSnooze('next_session')}>Show next time</button>
      <button onClick={() => dismiss({ reason: 'permanent_dismiss' })}>
        Don't show again
      </button>
    </div>
  );
}
```

## Tracking dismissal reasons

As of April 2026, no major product tour library tracks *why* users dismiss, only *that* they do. Capture the reason, the step reached, and the timestamp. Show a reason picker on first dismissal, then default to silent tracking.

## Accessibility requirements

Three non-negotiable rules:

1. **Escape key must always work.** WCAG operable principle.
2. **Focus must return to the trigger.** Don't strand keyboard users on `document.body`.
3. **Announce the dismissal.** Screen readers need a live region announcement.

## Common mistakes

- Showing the same tour on every page load (use a 72-hour frequency cap)
- Resetting progress on dismiss (resume at step 4, not step 1)
- No path back to the tour (48% of users later look for the dismissed content)
- Ignoring multi-tour conflicts (don't immediately fire Tour B after Tour A is dismissed)

---

Full article with all code examples: [usertourkit.com/blog/handle-tour-dismissals-skips-gracefully](https://usertourkit.com/blog/handle-tour-dismissals-skips-gracefully)
