---
title: "What is a hotspot? In-app guidance element explained"
slug: "what-is-a-hotspot-onboarding"
canonical: https://usertourkit.com/blog/what-is-a-hotspot-onboarding
tags: react, javascript, web-development, ux
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-a-hotspot-onboarding)*

# What is a hotspot? In-app guidance element explained

You added a feature your users asked for. A month later, support tickets say nobody can find it. A modal would interrupt everyone. A tooltip only appears on hover, which is invisible on mobile. What you need is a hotspot.

```bash
npm install @tour-kit/core @tour-kit/hints
```

## Definition

In onboarding UX, a hotspot is a small pulsing visual indicator placed on a UI element to draw attention without blocking the user's workflow. Unlike modals or guided tours, hotspots are opt-in: the user clicks or taps the beacon to reveal guidance content, and ignores it otherwise. UserGuiding defines it as "a UX/UI pattern that aims to draw a website/app user's attention to a specific area or spot on the screen" ([UserGuiding](https://userguiding.com/blog/hotspot-ux)). Every major onboarding platform, as of April 2026, ships hotspots as a core pattern.

"Beacon" and "hotspot" get used interchangeably, but they're different things. The beacon is the animated dot. The hotspot is the full pattern: beacon plus the tooltip it reveals on interaction.

## How hotspots work

Every hotspot implementation has three moving parts: a trigger element (the 12-16px pulsing beacon), content (a tooltip or popover with 1-2 sentences of guidance), and a lifecycle system that tracks whether the user has seen and dismissed the hint across sessions.

Clicking the beacon expands a tooltip positioned relative to the target element. That tooltip must follow WCAG 2.1 SC 1.4.13: dismissible via Escape, hoverable without disappearing, persistent until closed ([W3C WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)). Sarah Higley puts it bluntly: "do not use a timeout to hide the tooltip" ([sarahmhigley.com](https://sarahmhigley.com/writing/tooltips-in-wcag-21/)).

Positioning is the hard part. Beacons need to stay anchored through scrolls, resizes, and layout shifts. Most use Floating UI or a comparable engine.

The lifecycle works as a state machine:

1. **Idle**: beacon visible, pulsing
2. **Active**: user clicked, tooltip open
3. **Dismissed**: user closed, persisted to storage
4. **Retired**: engagement threshold hit, hotspot removed

## Hotspot examples

Five real-world patterns from production apps:

1. **Feature discovery.** SendGrid places hotspots on new dashboard elements.
2. **Contextual onboarding.** Typeform uses beacons during first-run.
3. **New feature announcements.** Plandisc adds pulsing indicators, auto-retiring after 30 days.
4. **Purchase guidance.** Cuepath positions hotspots near checkout CTAs with 44x44px touch targets.
5. **Supplementary help.** Krispy Kreme links hotspots to "learn more" content.

## Hotspots vs tooltips vs modals

| Aspect | Hotspot | Tooltip | Modal |
|--------|---------|---------|-------|
| Trigger | Click or tap | Hover or focus | Page load or event |
| User opt-in | Yes (must click) | Partial (hover) | No (blocks workflow) |
| Mobile support | Good (tap-friendly) | Poor (no hover) | Good (if responsive) |
| Content depth | 1-2 sentences + CTA | 1 sentence max | Paragraphs, media, forms |
| Interruption | None until clicked | Low | High |
| Best for | Feature discovery | Label clarification | Critical announcements |

UX Myths research found less than 20% of page copy gets read, making opt-in patterns like hotspots more effective than text-heavy onboarding.

## Why hotspots matter

Whatfix reports in-context enablement makes end users 82% more confident navigating new features. Hotspots solve discovery without the friction that makes users close a tour after step one.

Three rules: cap at 2-3 per view, persist dismissals, and respect `prefers-reduced-motion`.

## Code example

```tsx
import { HintHotspot, HintTooltip } from '@tour-kit/hints';

export function FeatureHotspot() {
  return (
    <HintHotspot
      targetSelector="#new-export-button"
      hintId="export-feature-2026"
      dismissible
    >
      <HintTooltip side="bottom" sideOffset={8}>
        <p>Export your data as CSV or JSON.</p>
        <button onClick={() => console.log('CTA clicked')}>
          Try it now
        </button>
      </HintTooltip>
    </HintHotspot>
  );
}
```

Full docs: [usertourkit.com/docs](https://usertourkit.com/docs)
