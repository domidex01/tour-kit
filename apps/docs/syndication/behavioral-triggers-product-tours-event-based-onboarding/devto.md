---
title: "Stop using timers for product tours — 6 behavioral trigger patterns in React"
published: false
description: "Click-triggered tours complete at 67% vs 31% for time-delay. Here are 6 event-based trigger patterns with working React code for each."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/behavioral-triggers-product-tours-event-based-onboarding
cover_image: https://usertourkit.com/og-images/behavioral-triggers-product-tours-event-based-onboarding.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/behavioral-triggers-product-tours-event-based-onboarding)*

# Behavioral triggers for product tours: event-based onboarding

Most product tours fire on page load. The user hasn't clicked anything, hasn't oriented themselves, hasn't decided what they're trying to do, and a tooltip pops up anyway. It's the digital equivalent of a store employee greeting you at the door with a 5-step walkthrough of the shoe department.

Behavioral triggers flip this. Instead of guessing when to show guidance, you wait for a signal: a button click, a route change, an idle pause, a feature milestone. The user tells you when they're ready through their actions.

The data backs this up decisively. As of April 2026, Chameleon's analysis of 15 million tour interactions shows click-triggered tours complete at 67%, while time-delay tours land at 31% ([Chameleon, 2026](https://www.chameleon.io/blog/mastering-product-tours)). That's not a marginal improvement. It's a 2.16x difference in whether your onboarding actually works.

```bash
npm install @tourkit/core @tourkit/react
```

This guide covers the six behavioral trigger patterns that matter, with working React code for each, and the accessibility rules most implementations miss.

## What is a behavioral trigger for product tours?

A behavioral trigger is a condition tied to a user action (not a timer) that starts a product tour. When a user clicks a button, navigates to a specific route, reaches a feature milestone, or pauses on a page without completing an action, those behaviors become signals. The tour starts because the user demonstrated intent, not because 5 seconds elapsed.

Tour Kit implements behavioral triggers through composable hooks that attach to standard DOM events: `onClick`, route changes via `useLocation`, `IntersectionObserver` for element visibility, and custom event dispatchers for cross-component coordination. The core package adds under 8KB gzipped to your bundle. Trigger logic itself costs near-zero because it piggybacks on events your app already handles.

Unlike no-code tools like Chameleon or Userpilot where trigger configuration happens in a dashboard, a code-based approach gives you access to your full application state. You can trigger a tour when `user.plan === 'pro' && featureClicks < 2 && daysSinceSignup > 3`. Conditions like that are trivial in code but require workarounds in GUI builders.

## Why behavioral triggers matter for onboarding

Event-based onboarding works because it respects what the user is actually doing. A time-based trigger interrupts. A behavioral trigger responds. Pulkit Agrawal, CEO of Chameleon, puts it directly: "Click-triggered tours have a higher completion rate... you're reacting to their immediate context" ([Chameleon, 2026](https://www.chameleon.io/blog/mastering-product-tours)).

The numbers break down by trigger type:

| Trigger type | Completion rate | Source |
|---|---|---|
| On-page position (contextual) | 69.56% | Chameleon, 15M interactions |
| Click-triggered (user-initiated) | 67% | Chameleon, 15M interactions |
| Launcher-triggered | 61.65% | Chameleon, 15M interactions |
| Checklist-triggered | +21% above average | Chameleon benchmarks |
| Smart Delay (inactivity) | +21% above fixed delay | Chameleon benchmarks |
| Time/delay-triggered (fixed) | 31% | Chameleon, 15M interactions |

Tour length compounds with trigger type. Three-step tours achieve 72% completion. Five-step tours drop to 34% median ([Chameleon benchmarks, 2026](https://www.chameleon.io/product-tour-benchmarks-report)). Even a well-timed behavioral trigger can't rescue a 7-step walkthrough. Pair behavioral triggers with short, focused tours: 2 to 3 steps per trigger event.

## The six behavioral trigger patterns

Every event-based trigger in a React app falls into one of six categories. Here's each pattern with working Tour Kit code.

### Click triggers

The simplest and most effective pattern. A user clicks a button, the tour starts. No guesswork.

```tsx
// src/components/FeatureHeader.tsx
import { useTour } from '@tourkit/react';

export function FeatureHeader() {
  const { start } = useTour('export-tour');

  return (
    <div className="flex items-center justify-between">
      <h2>Exports</h2>
      <button
        onClick={() => start()}
        className="text-sm text-blue-600 underline"
      >
        How do exports work?
      </button>
    </div>
  );
}
```

The user opted in by clicking. Completion rates hit 67% because the intent was explicit.

### Route-change triggers

Show a tour when a user navigates to a specific page for the first time. Works well for feature areas with multiple interactive elements like dashboards, settings panels, and editor views.

```tsx
// src/hooks/useRouteTriggeredTour.ts
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTour } from '@tourkit/react';

export function useRouteTriggeredTour(
  tourId: string,
  targetPath: string
) {
  const { start, state } = useTour(tourId);
  const location = useLocation();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (
      location.pathname === targetPath &&
      !hasTriggered.current &&
      state === 'idle'
    ) {
      hasTriggered.current = true;
      start();
    }
  }, [location.pathname, targetPath, start, state]);
}
```

The `hasTriggered` ref prevents the tour from re-firing on subsequent visits. For persistent state across sessions, swap the ref for `localStorage` or Tour Kit's built-in storage adapters.

### Inactivity triggers (Smart Delay)

Chameleon's data shows Smart Delay outperforms fixed timers by 21%. The implementation is straightforward: track mouse and keyboard activity. When the user stops for a threshold period, they're probably stuck.

```tsx
// src/hooks/useInactivityTrigger.ts
import { useEffect, useRef } from 'react';
import { useTour } from '@tourkit/react';

export function useInactivityTrigger(
  tourId: string,
  idleMs: number = 8000
) {
  const { start, state } = useTour(tourId);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (state !== 'idle') return;

    const resetTimer = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => start(), idleMs);
    };

    resetTimer();
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('scroll', resetTimer);

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [start, state, idleMs]);
}
```

Eight seconds is a reasonable default. A data-dense dashboard warrants a longer idle threshold (15-20 seconds), while a simple form can trigger after 5.

### Element-visibility triggers

Trigger a tour when a specific element scrolls into view. `IntersectionObserver` handles this efficiently without polling or scroll event thrashing.

```tsx
// src/hooks/useVisibilityTrigger.ts
import { useEffect, useRef } from 'react';
import { useTour } from '@tourkit/react';

export function useVisibilityTrigger(
  tourId: string,
  selector: string
) {
  const { start, state } = useTour(tourId);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (state !== 'idle' || hasTriggered.current) return;

    const target = document.querySelector(selector);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          observer.disconnect();
          start();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [selector, start, state]);
}
```

Good for progressive onboarding: as the user explores further down a page, new guidance appears contextually.

### Feature-milestone triggers

Trigger tours based on cumulative user behavior: "completed first export," "used search 3 times," or "visited pricing but didn't upgrade." These require tracking state your app already has.

```tsx
// src/hooks/useMilestoneTrigger.ts
import { useEffect } from 'react';
import { useTour } from '@tourkit/react';

interface MilestoneCondition {
  check: () => boolean;
  tourId: string;
}

export function useMilestoneTrigger(
  conditions: MilestoneCondition[]
) {
  const tours = conditions.map(c => ({
    ...c,
    tour: useTour(c.tourId),
  }));

  useEffect(() => {
    for (const { check, tour } of tours) {
      if (check() && tour.state === 'idle') {
        tour.start();
        break; // Only fire one tour at a time
      }
    }
  });
}

// Usage
useMilestoneTrigger([
  {
    tourId: 'power-user-tips',
    check: () => analytics.exportCount >= 5,
  },
  {
    tourId: 'upgrade-prompt',
    check: () =>
      user.plan === 'free' && analytics.limitHits >= 3,
  },
]);
```

The `break` is critical. Without it, multiple milestone conditions firing simultaneously creates tour pile-ups, a trigger fatigue problem no competitor documentation addresses.

### Compound triggers (AND/OR rules)

Real-world triggers are rarely single conditions. You want combinations: show the tour when the user is on the dashboard AND has been a member for over 3 days AND hasn't completed the setup checklist.

```tsx
// src/lib/trigger-rules.ts
type TriggerRule =
  | { type: 'and'; rules: TriggerRule[] }
  | { type: 'or'; rules: TriggerRule[] }
  | { type: 'condition'; check: () => boolean };

export function evaluate(rule: TriggerRule): boolean {
  switch (rule.type) {
    case 'condition':
      return rule.check();
    case 'and':
      return rule.rules.every(evaluate);
    case 'or':
      return rule.rules.some(evaluate);
  }
}

// Usage
const shouldTrigger = evaluate({
  type: 'and',
  rules: [
    { type: 'condition', check: () => user.plan === 'pro' },
    { type: 'condition', check: () => featureClicks < 2 },
    {
      type: 'or',
      rules: [
        { type: 'condition', check: () => daysSinceSignup > 3 },
        { type: 'condition', check: () => user.referral === 'partner' },
      ],
    },
  ],
});
```

This is where code-based triggers pull ahead of GUI builders. Userpilot and Chameleon can combine a few conditions through their dashboards, but compound logic with nested OR branches requires their enterprise tiers or custom JavaScript anyway ([Userpilot, 2026](https://userpilot.com/blog/behavioral-targeting/)).

## Accessibility requirements for behavioral triggers

Behavioral triggers inject content into the DOM dynamically. Screen readers won't announce it unless you handle this explicitly. Most product tour libraries (and most articles about them) skip this entirely.

Three rules apply to every behavioral trigger:

**Announce injected content.** When a tour starts from a behavioral trigger, the tooltip or modal must live inside an `aria-live="polite"` region, or you must programmatically move focus to the first interactive element in the tour step. Otherwise screen readers see nothing ([W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/)).

**Make trigger elements keyboard-accessible.** If the trigger is a custom element (not a native `<button>`), it needs `role="button"`, `tabIndex={0}`, and `onKeyDown` handlers for Enter and Space. Tour Kit's built-in components handle this, but custom trigger elements are your responsibility.

**Don't steal focus unexpectedly.** Inactivity triggers and milestone triggers fire without the user explicitly requesting anything. When these triggers start a tour, the focus shift must be announced with context: "Tour started: 3 steps to complete your first export." Users relying on assistive technology need to understand why their focus moved.

Tour Kit doesn't have a visual builder. That's a real limitation for non-developer teams. But it does handle `aria-live` announcements and focus management out of the box for every trigger type, which is something most visual builder tools still struggle with.

## Measuring trigger effectiveness

A behavioral trigger product tour is only useful if you measure whether the trigger fired at the right time. Track these four metrics per trigger:

**Trigger-to-completion rate.** What percentage of users who see the trigger-fired tour actually finish it? Compare this across trigger types. Chameleon's benchmarks show click triggers at 67% and time triggers at 31%, but measure your own numbers. Your app's context matters more than industry averages.

**Dismissal rate at step 1.** If users dismiss the tour on the first step, the trigger fired too early or in the wrong context. A high step-1 dismissal rate with click triggers specifically suggests the tour content doesn't match what the user expected after clicking.

**Time-to-trigger.** How long after session start does the trigger condition first become true? If your behavioral trigger fires within the first 10 seconds for most users, you've accidentally built a fancy timer. True behavioral triggers should show variance: different users trigger at different points.

**Downstream activation.** Did the user actually perform the target action after completing the triggered tour? A tour that completes at 70% but doesn't move the activation metric is entertainment, not onboarding. Track the feature adoption event that the tour was designed to drive.

Tour Kit's `@tourkit/analytics` package fires callbacks for `tour:started`, `tour:completed`, `tour:dismissed`, and `step:viewed`. Pipe these into PostHog, Amplitude, or Mixpanel to build trigger-specific funnels.

## Common mistakes with behavioral triggers

### Firing multiple tours simultaneously

When two milestone conditions become true in the same session, both tours want to start. Without a priority queue, the user sees overlapping tooltips or rapidly sequenced modals. Tour Kit's `@tour-kit/scheduling` package handles this with a queue that respects priority ordering and prevents concurrent tours.

### Ignoring trigger fatigue

Behavioral triggers can fire more often than timers because there are more conditions to match. If a user hits 4 trigger conditions in one session, showing 4 tours is worse than showing none. Cap triggered tours at 1-2 per session.

### No persistence across sessions

A user dismisses the tour on Tuesday. The same behavioral trigger fires on Wednesday. Without session-aware storage, dismissed tours come back like uninvited guests. Use `localStorage`, a database flag, or Tour Kit's storage adapters to track which tours a user has seen or dismissed.

### Treating every feature as tour-worthy

Not every feature needs a guided tour. Simple, discoverable UI patterns (a clearly labeled button, a well-designed empty state) don't benefit from tooltips. Reserve behavioral triggers for features with genuine complexity: multi-step workflows, hidden power features, or configuration that affects other parts of the app.

## FAQ

### What is a behavioral trigger for a product tour?

A behavioral trigger for a product tour is a condition tied to a user action (clicking a button, navigating to a page, or reaching a usage milestone) that starts a guided tour. Unlike time-based triggers that fire after a fixed delay, behavioral triggers respond to demonstrated intent. Chameleon's data shows they achieve 67% completion versus 31% for timers.

### How do you implement event-based onboarding in React?

Event-based onboarding in React uses standard hooks and DOM events to detect user behavior and start tours conditionally. Attach `onClick` for click triggers, `useEffect` with route detection for navigation, `IntersectionObserver` for visibility, and `setTimeout` with activity listeners for inactivity detection. Tour Kit's `useTour` hook exposes `start()` and `state` for composing with any trigger.

### What trigger types have the highest tour completion rates?

On-page contextual triggers lead at 69.56%, followed by click triggers at 67% and launcher triggers at 61.65%. Checklist-triggered tours add a 21% completion bonus on top of whatever trigger type is used. Fixed time-delay triggers trail at 31% completion. These numbers come from Chameleon's analysis of 15 million tour interactions as of April 2026.

### How do you prevent trigger fatigue in product tours?

Limit triggered tours to 1-2 per session. Implement a priority queue so only the highest-priority tour fires when multiple conditions match simultaneously. Persist dismissal state across sessions using localStorage or a database flag. Tour Kit's scheduling package provides built-in queue management and fatigue prevention that caps concurrent and per-session tour counts.

### Are behavioral triggers accessible for screen reader users?

Behavioral triggers require explicit accessibility handling because they inject content dynamically. Tour content must appear in an `aria-live="polite"` region or receive programmatic focus with an announcement. Custom trigger elements need `role="button"`, `tabIndex={0}`, and keyboard event handlers. Inactivity-based triggers should announce context when shifting focus so users understand why their navigation changed.

---

*Built by a solo developer. Tour Kit is our project — take recommendations with appropriate skepticism. Every benchmark cited includes its source and date so you can verify independently.*
