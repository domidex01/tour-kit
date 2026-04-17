---
title: "What is a progress bar in onboarding? (the developer version)"
published: false
description: "78% of SaaS products use progress indicators during onboarding. Here's how they work under the hood — ARIA attributes, React implementation, and the psychology that makes them effective."
tags: react, webdev, javascript, tutorial
canonical_url: https://usertourkit.com/blog/what-is-progress-bar-onboarding
cover_image: https://usertourkit.com/og-images/what-is-progress-bar-onboarding.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-progress-bar-onboarding)*

# What is a progress bar? Onboarding progress indicators explained

Every SaaS onboarding flow with more than three steps faces the same question: do users know where they are? Progress bars answer that. But the implementation details (which type, what ARIA attributes, when they actually help) get buried under product-manager-focused advice. Here's the developer version.

```bash
npm install @tourkit/core @tourkit/react
```

## Definition

A progress bar is a visual indicator that communicates how much of a multi-step process a user has completed and how much remains. In onboarding, it typically sits at the top of a setup flow or checklist, showing the ratio of finished steps to total steps. The HTML spec defines a native `<progress>` element for this ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress)), and the WAI-ARIA spec adds `role="progressbar"` for custom implementations that need accessible state attributes like `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` ([MDN ARIA progressbar](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/progressbar_role)).

Progress bars differ from spinners. A spinner is indeterminate: it loops without telling you when things will finish. A progress bar is determinate, showing actual completion percentage. Jakob Nielsen's research established a 10-second threshold. After 10 seconds without progress feedback, users assume the process has stalled ([Smashing Magazine](https://www.smashingmagazine.com/2016/12/best-practices-for-animated-progress-indicators/)). Onboarding flows routinely exceed that, which is why 78% of products now include progress indicators during setup (UserGuiding, 2026).

## How progress bars work in onboarding

Progress bars in onboarding track step completion, not loading time. The core mechanic is a ratio: completed steps divided by total steps, rendered as a visual fill. In React, a minimal implementation looks like this:

```tsx
// src/components/OnboardingProgress.tsx
function OnboardingProgress({ current, total }: { current: number; total: number }) {
  const percent = Math.round((current / total) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Onboarding progress: step ${current} of ${total}`}
    >
      <div style={{ width: `${percent}%` }} />
      <span>{current} of {total} complete</span>
    </div>
  );
}
```

That covers the basics. Production implementations add persistence (so progress survives page reloads) and screen reader announcements when the value changes. You also need a live region or `aria-valuetext` update to announce transitions, or assistive technology users won't know they advanced.

Five psychological principles explain why progress bars increase onboarding completion rates by 20-30% ([UserPilot](https://userpilot.com/blog/progress-bar-psychology/)):

| Principle | What it does | Onboarding application |
|---|---|---|
| Zeigarnik effect | Incomplete tasks nag at memory | Seeing "3 of 5 done" creates pull to finish |
| Endowed progress | Starting ahead boosts motivation | Pre-filling the first step (account creation) as complete |
| Goal gradient | Effort increases near the finish | Users rush through the last 2 steps |
| Anchoring | First number sets expectations | "Step 1 of 4" feels lighter than "Step 1 of 12" |
| Perceived control | Visibility reduces anxiety | Users tolerate longer flows when they see the end |

One caveat: progress bars can *decrease* completion when early progress feels slow. A meta-analysis of 32 experiments found that bars perceived as decelerating led to higher abandonment ([Irrational Labs, 2025](https://irrationallabs.com/blog/knowledge-cuts-both-ways-when-progress-bars-backfire/)). Start the animation slow and accelerate toward the end for the best perceived speed.

## Progress bar examples and types

Not every onboarding flow needs the same indicator. Six common types map to different use cases:

| Type | Best for | User clarity |
|---|---|---|
| Linear (continuous fill) | Simple 3-5 step flows | Medium |
| Segmented / stepped | Multi-step wizards, onboarding checklists | High |
| Circular / radial | Dashboards, compact sidebars | Medium |
| Percentage text | Inline status where bar space is tight | High |
| Hybrid (steps + percentage) | Complex onboarding with 8+ steps | Very high |
| Indeterminate (spinner) | Unknown-duration tasks only | Low |

Segmented progress bars dominate onboarding because they answer two questions at once: "how far am I?" and "what's the next step?" LinkedIn's profile completion meter is the classic example, boosting completions by combining a percentage with specific missing-item prompts.

## Why progress bars matter for onboarding

The median checklist completion rate sits at 10.1% ([Userpilot, 2026](https://userpilot.com/blog/onboarding-checklist-completion-rate-benchmarks/)). Progress bars won't fix a broken flow, but they reduce one specific failure mode: users quitting because they don't know how much is left.

The real question isn't whether to show progress. It's whether your flow has a clear enough structure to make progress meaningful. Branching paths, optional steps, or context-dependent screens will make a linear progress bar lie to users. And they'll notice.

## Progress bars in Tour Kit

Tour Kit's `@tour-kit/checklists` package handles onboarding progress tracking with step completion state, persistence across sessions, and accessible announcements built in. Because Tour Kit is headless, you render the progress bar however you want: your Tailwind classes, your design tokens, your component library.

```tsx
// src/components/TourProgress.tsx
import { useChecklist } from '@tour-kit/checklists';

function TourProgress() {
  const { completedCount, totalCount, percentComplete } = useChecklist('onboarding');

  return (
    <div
      role="progressbar"
      aria-valuenow={percentComplete}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Onboarding progress"
      className="h-2 w-full rounded-full bg-gray-200"
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-all duration-300"
        style={{ width: `${percentComplete}%` }}
      />
    </div>
  );
}
```

Tour Kit doesn't prescribe the UI. It tracks which steps are done, persists that state to `localStorage` (or your own storage adapter), and exposes the numbers. You decide whether that's a bar, a ring, a fraction, or a percentage label.

Explore the full API at [usertourkit.com](https://usertourkit.com/).

## FAQ

### Do progress bars actually improve onboarding completion rates?

Progress bars combined with checklists increase onboarding completion rates by 20-30%, according to UserPilot's analysis. The effect comes from the Zeigarnik effect (incomplete tasks nag at memory) and the goal gradient hypothesis (users accelerate near the finish). But bars that decelerate visually or misrepresent remaining effort can reduce completion instead.

### What ARIA attributes does a progress bar need?

An accessible progress bar needs `role="progressbar"`, `aria-valuenow` for the current value, `aria-valuemin` and `aria-valuemax` for the range, and `aria-label` for an accessible name. For indeterminate bars, omit `aria-valuenow` entirely. Its absence signals unknown progress to screen readers ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/progressbar_role)).

### When should you not use a progress bar in onboarding?

Skip the progress bar when your onboarding has fewer than three steps, when steps have wildly different durations (the bar will feel uneven), or when paths branch based on user choices. A linear bar misrepresents nonlinear flows. Also skip them for tasks under 10 seconds; Nielsen's research shows users don't need progress feedback for quick interactions.

### What's the difference between a progress bar and a stepper?

A progress bar shows continuous completion as a filled region (30%, 60%, 90%). A stepper shows discrete numbered steps with distinct states: complete, active, upcoming. When step names matter ("Profile," "Team," "Integrations"), steppers give more structural information. For simpler flows where users just need to see how far along they are, a progress bar keeps the UI quieter.
