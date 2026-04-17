---
title: "What is a hotspot? The in-app guidance pattern your users actually notice"
published: false
description: "Hotspots are the opt-in alternative to modals and forced tours. Here's the definition, accessibility requirements, code examples, and when to use them vs tooltips."
tags: react, webdev, tutorial, beginners
canonical_url: https://usertourkit.com/blog/what-is-a-hotspot-onboarding
cover_image: https://usertourkit.com/og-images/what-is-a-hotspot-onboarding.png
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

Hotspots appear across SaaS dashboards, e-commerce, and developer tools. Five real-world patterns:

1. **Feature discovery.** SendGrid places hotspots on new dashboard elements.
2. **Contextual onboarding.** Typeform uses beacons during first-run to introduce the form builder.
3. **New feature announcements.** Plandisc adds pulsing indicators, auto-retiring after 30 days.
4. **Purchase guidance.** Cuepath positions hotspots near checkout CTAs with 44x44px touch targets (WCAG 2.5.8 minimum).
5. **Supplementary help.** Krispy Kreme links hotspots to "learn more" content.

Hand-coded implementation takes 1-5 hours depending on positioning complexity ([UserGuiding](https://userguiding.com/blog/hotspot-ux)).

## Hotspots vs tooltips vs modals

| Aspect | Hotspot | Tooltip | Modal |
|--------|---------|---------|-------|
| Trigger | Click or tap | Hover or focus | Page load or event |
| User opt-in | Yes (must click beacon) | Partial (appears on hover) | No (blocks workflow) |
| Mobile support | Good (tap-friendly) | Poor (no hover on touch) | Good (if responsive) |
| Content depth | 1-2 sentences + CTA | 1 sentence max | Paragraphs, media, forms |
| Interruption level | None until clicked | Low | High (blocks entire page) |
| Best for | Feature discovery | Label clarification | Critical announcements |

UX Myths research found less than 20% of page copy gets read ([UX Myths](https://uxmyths.com/post/647473628/myth-people-read-on-the-web)), which makes opt-in patterns more effective than walls of text.

## Why hotspots matter for onboarding

Feature adoption is where most SaaS apps lose users: you build something useful, nobody notices it, and the feature sits unused while support tickets pile up. Hotspots solve discovery without the friction that makes users close a tour after step one.

They work for ongoing guidance too. Whatfix reports in-context enablement makes end users 82% more confident navigating new features ([Whatfix](https://www.walkme.com/glossary/ux-hotspots/)). Keep beacon colors above the 4.5:1 WCAG contrast minimum.

Three rules before you add hotspots everywhere:

- **Cap density at 2-3 per view.** More creates visual noise. Queue the rest.
- **Persist dismissals.** If closed, don't show again. Use localStorage or your backend.
- **Respect `prefers-reduced-motion`.** Swap the pulse for a static dot when users opt out of animation.

## Code example with Tour Kit

```tsx
// src/components/FeatureHotspot.tsx
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

Tour Kit requires React 18+ and has no visual builder. For code-owned guidance integrated into a design system, that's the point of headless.

Full docs: [usertourkit.com/docs](https://usertourkit.com/docs)

## FAQ

**What is the difference between a hotspot and a tooltip?**
A hotspot combines a visual beacon with a tooltip that appears on click. Standalone tooltips appear on hover or focus without any indicator. Hotspots are opt-in and work on touch devices, while tooltips rely on hover.

**Are hotspots accessible?**
Yes, when implemented correctly. The beacon needs keyboard focus and an `aria-label`. The tooltip must be dismissible via Escape, hoverable without vanishing, and persistent until closed per WCAG 2.1 SC 1.4.13.

**When should I use a hotspot instead of a product tour?**
Use hotspots for single-feature discovery. Use tours for multi-step workflows. Combine both: tours for first-run onboarding, hotspots for ongoing feature announcements.

**How many hotspots should I show at once?**
Two to three per view max. Queue extras and reveal them after the user interacts with the first batch.
