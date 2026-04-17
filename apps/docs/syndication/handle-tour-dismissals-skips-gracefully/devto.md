---
title: "70% of users skip your product tour — here's how to handle it gracefully"
published: false
description: "Nearly 70% of users skip product tours, and 78% abandon by step 3. Instead of fighting dismissals, build patterns that respect user agency: snooze, resume, contextual re-engagement, and dismissal reason tracking. Working TypeScript examples included."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/handle-tour-dismissals-skips-gracefully
cover_image: https://usertourkit.com/og-images/handle-tour-dismissals-skips-gracefully.png
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

A 3-step tour completes at 72%. A 7-step tour drops to 16%. That 56-point gap means most of your dismissal handling will run on the majority of users, not the edge cases.

## The five dismissal types

Not all dismissals are equal. A user clicking "Skip tour" on step one has different intent than a user pressing Escape on step five. We categorize dismissals into five types, each requiring a different response.

**Explicit skip** — The user clicks "Skip" or "Not now." Respect it fully, store the skip, don't re-trigger immediately, and offer a way back through a help menu.

**Escape key** — A WCAG requirement for dismissable overlays. Signals mild disinterest. Treat it like a skip but with a lighter touch.

**Click-outside** — The user is trying to interact with the product. Ambiguous intent. Offer a "Resume tour" nudge after 30 seconds of inactivity.

**Tab/navigation away** — A context switch, not a rejection. Persist the current step and resume when they return.

**Timeout/inactivity** — No interaction for 60+ seconds? Auto-minimize the tour to a small beacon.

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
    <button
      onClick={handleSkip}
      aria-label="Skip this tour"
    >
      Not now
    </button>
  );
}
```

## Building a snooze pattern in React

Every source in our research mentions "let users postpone" as a best practice, but none provide implementation details. Here's the pattern we built.

The snooze pattern gives users three options instead of binary show/dismiss: **continue**, **snooze** (come back later), or **dismiss** (don't show again). Snooze re-triggers the tour after a delay, typically the next session or after a configurable interval.

```tsx
// src/components/TourSnooze.tsx
import { useTour } from '@tourkit/react';
import { useCallback } from 'react';

type SnoozeOption = '1h' | 'tomorrow' | 'next_session';

const SNOOZE_DELAYS: Record<SnoozeOption, number> = {
  '1h': 60 * 60 * 1000,
  'tomorrow': 24 * 60 * 60 * 1000,
  'next_session': -1, // Special: re-trigger on next app load
};

function TourSnoozeControls() {
  const { dismiss, snooze, currentStep } = useTour();

  const handleSnooze = useCallback(
    (option: SnoozeOption) => {
      const delay = SNOOZE_DELAYS[option];
      snooze({
        resumeAfter: delay,
        resumeAtStep: currentStep,
        reason: 'snoozed',
      });
    },
    [currentStep, snooze]
  );

  return (
    <div role="group" aria-label="Tour options">
      <button onClick={() => handleSnooze('1h')}>
        Remind me later
      </button>
      <button onClick={() => handleSnooze('next_session')}>
        Show next time
      </button>
      <button
        onClick={() => dismiss({ reason: 'permanent_dismiss' })}
      >
        Don't show again
      </button>
    </div>
  );
}
```

The key detail: snooze persists the current step index, so the user resumes where they stopped. Not from the beginning. Restarting a tour from step one after a user already reached step four is the fastest way to guarantee a permanent dismissal.

## Resume-from-where-you-left-off

Partial progress is the norm, not the exception. 76.3% of tooltips are dismissed within 3 seconds. Your tour needs to remember where the user stopped and resume there.

```tsx
// src/hooks/useTourResume.ts
import { useTour } from '@tourkit/react';
import { useEffect } from 'react';

function useTourResume(tourId: string) {
  const { startAt, isActive } = useTour();

  useEffect(() => {
    if (isActive) return;

    const saved = localStorage.getItem(`tour-progress-${tourId}`);
    if (!saved) return;

    const { step, dismissedAt } = JSON.parse(saved);
    const hoursSinceDismiss =
      (Date.now() - dismissedAt) / (1000 * 60 * 60);

    // Resume if dismissed less than 72 hours ago
    if (hoursSinceDismiss < 72 && step > 0) {
      startAt(step);
    }
  }, [tourId, startAt, isActive]);
}
```

Three rules for resume behavior:

1. **Expire stale progress.** If a user dismissed 2 weeks ago, start fresh. The UI may have changed.
2. **Validate the target element exists.** The step's target DOM node might not be on the current page. Check before resuming.
3. **Show a "Welcome back" micro-step.** A brief "Picking up where you left off, step 4 of 6" message orients the user.

## Tracking dismissal reasons with analytics

As of April 2026, no major product tour library tracks *why* users dismiss, only *that* they do. Dismissal reasons are the most actionable analytics data in your onboarding funnel.

```tsx
// src/components/DismissWithReason.tsx
import { useTour } from '@tourkit/react';

type DismissReason =
  | 'too_long'
  | 'already_know'
  | 'not_relevant'
  | 'bad_timing'
  | 'accidental';

function DismissWithReason() {
  const { dismiss, currentStep } = useTour();

  const handleDismiss = (reason: DismissReason) => {
    dismiss({
      reason,
      stepReached: currentStep,
      timestamp: Date.now(),
    });

    // Fire to your analytics provider
    analytics.track('tour_dismissed', {
      reason,
      step: currentStep,
      tourId: 'onboarding-v2',
    });
  };

  return (
    <div role="group" aria-label="Why are you skipping?">
      <p>Not helpful right now?</p>
      <button onClick={() => handleDismiss('already_know')}>
        I already know this
      </button>
      <button onClick={() => handleDismiss('bad_timing')}>
        Bad timing
      </button>
      <button onClick={() => handleDismiss('not_relevant')}>
        Not relevant to me
      </button>
    </div>
  );
}
```

Don't show the reason picker on every dismissal. That's its own kind of tour fatigue. Show it on the first dismissal and after every fifth.

## Accessibility requirements for dismissal

Tour dismissal is where most libraries fail WCAG 2.1 AA compliance. Three non-negotiable requirements:

**Escape key must always work.** Every tour overlay, tooltip, and modal must close on Escape. This is a WCAG operable principle, not a nice-to-have.

**Focus must return to the trigger.** When a tour dismisses, keyboard focus needs to land on the element that launched the tour. Dropping focus to `document.body` leaves keyboard and screen reader users stranded.

**Announce the dismissal.** Screen readers need to know the tour closed. A live region announcement like "Tour dismissed. You can restart it from the Help menu" gives context that sighted users get visually.

## Common mistakes

- **Showing the same tour on every page load.** Use a frequency cap: once dismissed, don't re-trigger for at least 72 hours.
- **Resetting progress on dismiss.** Resume at step 4, not step 1.
- **No path back to the tour.** 48% of users who dismiss tours later look for the information those tours contained. Put a "Replay tour" button in your help menu.
- **Ignoring multi-tour conflicts.** If a user dismisses Tour A and Tour B is queued next, firing Tour B immediately feels like spam.

---

**Ready to build tours that respect your users?** Tour Kit gives you full control over dismissal UX with `onDismiss` callbacks, snooze patterns, and automatic progress resume built in. Check the [documentation](https://usertourkit.com/) or install and start building:

```bash
npm install @tourkit/core @tourkit/react
```
