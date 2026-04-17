---
title: "What is a progress bar? Onboarding progress indicators explained"
slug: "what-is-progress-bar-onboarding"
canonical: https://usertourkit.com/blog/what-is-progress-bar-onboarding
tags: react, javascript, web-development, accessibility
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

Progress bars in onboarding track step completion, not loading time. The core mechanic is a ratio: completed steps divided by total steps, rendered as a visual fill. In React:

```tsx
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

Five psychological principles explain why progress bars increase onboarding completion rates by 20-30% ([UserPilot](https://userpilot.com/blog/progress-bar-psychology/)):

| Principle | What it does | Onboarding application |
|---|---|---|
| Zeigarnik effect | Incomplete tasks nag at memory | Seeing "3 of 5 done" creates pull to finish |
| Endowed progress | Starting ahead boosts motivation | Pre-filling the first step as complete |
| Goal gradient | Effort increases near the finish | Users rush through the last 2 steps |
| Anchoring | First number sets expectations | "Step 1 of 4" feels lighter than "Step 1 of 12" |
| Perceived control | Visibility reduces anxiety | Users tolerate longer flows when they see the end |

One caveat: progress bars can *decrease* completion when early progress feels slow. Start the animation slow and accelerate toward the end for the best perceived speed.

## Progress bar examples and types

| Type | Best for | User clarity |
|---|---|---|
| Linear (continuous fill) | Simple 3-5 step flows | Medium |
| Segmented / stepped | Multi-step wizards, onboarding checklists | High |
| Circular / radial | Dashboards, compact sidebars | Medium |
| Percentage text | Inline status where bar space is tight | High |
| Hybrid (steps + percentage) | Complex onboarding with 8+ steps | Very high |
| Indeterminate (spinner) | Unknown-duration tasks only | Low |

## Progress bars in Tour Kit

Tour Kit's `@tour-kit/checklists` package handles onboarding progress tracking with step completion state, persistence across sessions, and accessible announcements built in:

```tsx
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

Full article with all FAQ answers and more detail: [usertourkit.com/blog/what-is-progress-bar-onboarding](https://usertourkit.com/blog/what-is-progress-bar-onboarding)
