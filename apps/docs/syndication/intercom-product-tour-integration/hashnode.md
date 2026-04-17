---
title: "Tour Kit + Intercom: show tours before chat, not after"
slug: "intercom-product-tour-integration"
canonical: https://usertourkit.com/blog/intercom-product-tour-integration
tags: react, javascript, web-development, intercom
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/intercom-product-tour-integration)*

# Tour Kit + Intercom: show tours before chat, not after

Most teams wire up Intercom, bolt on its product tours add-on, and hope for the best. The problem: users who don't understand a feature reach for the chat widget first. Support answers the same "how do I..." questions on repeat. Intercom's own data shows proactive onboarding can reduce support contact rates by roughly 80% ([Intercom blog](https://www.intercom.com/blog/self-serve-support/)). But Intercom's built-in tours can't coordinate with its own Messenger to make that happen.

This guide wires Tour Kit's headless tour engine into Intercom's JavaScript API so tours fire at the right moment, completion events flow into Intercom for targeting, and the chat widget only appears after users have seen the relevant guidance.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

A Tour Kit-powered integration that shows contextual product tours before the Intercom chat widget appears, reducing repetitive support questions by giving users guidance at the moment they need it. The whole integration is about 40 lines of glue code. No custom backend required.

## Why Intercom + Tour Kit instead of Intercom tours alone?

Intercom's built-in product tours cost $99 to $199 per month as an add-on, ship without lifecycle callbacks, and silently fail on mobile.

| Capability | Intercom tours | Tour Kit |
|---|---|---|
| Mobile web support | Silently ignored | Same API everywhere |
| Lifecycle callbacks | No onComplete/onSkip | onStepComplete, onTourEnd, onTourSkip |
| Bundle size impact | ~210 KB gzipped | <8 KB gzipped (core) |
| Pricing | $99–$199/month add-on | Free core (MIT), $99 one-time Pro |

The callback gap is the big one. Intercom's own community forum confirms it: "At present there is no JS callback function for Tours."

## Step 1: Define a tour with completion callbacks

```tsx
// src/components/FeatureTour.tsx
import { TourProvider, Tour, TourStep } from '@tourkit/react';

const steps = [
  { target: '#export-button', content: 'Export your data as CSV or PDF.' },
  { target: '#filter-panel', content: 'Filter results before exporting.' },
  { target: '#schedule-export', content: 'Schedule recurring exports here.' },
];

function FeatureTour() {
  return (
    <TourProvider>
      <Tour
        tourId="export-feature"
        steps={steps}
        onComplete={() => {
          window.Intercom?.('trackEvent', 'tour-completed', {
            tour_id: 'export-feature',
            steps_viewed: steps.length,
          });
        }}
        onSkip={(stepIndex) => {
          window.Intercom?.('trackEvent', 'tour-skipped', {
            tour_id: 'export-feature',
            skipped_at_step: stepIndex,
          });
        }}
      />
    </TourProvider>
  );
}
```

## Step 2: Control the Messenger based on tour state

```tsx
// src/hooks/useIntercomTourBridge.ts
import { useEffect } from 'react';
import { useTour } from '@tourkit/react';

export function useIntercomTourBridge(tourId: string) {
  const { isActive, currentStep } = useTour(tourId);

  useEffect(() => {
    if (!window.Intercom) return;
    if (isActive) {
      window.Intercom('update', { hide_default_launcher: true });
    } else {
      window.Intercom('update', { hide_default_launcher: false });
    }
  }, [isActive]);

  return { isActive, currentStep };
}
```

## Step 3: Build the targeting loop in Intercom

1. Go to **Intercom > Outbound > Messages**
2. Target users who have NOT triggered `tour-completed` where `tour_id = export-feature`
3. Set a delay (48 hours after signup)
4. Prompt them to retry the tour or open the docs

## Step 4: Verify it works

1. Events tab should show `tour-completed` with metadata
2. Messenger should toggle: hidden during tour, visible after
3. Mobile: Tour Kit renders the tour. Intercom's `startTour` would silently fail

Full article with gotchas and more code examples: [usertourkit.com/blog/intercom-product-tour-integration](https://usertourkit.com/blog/intercom-product-tour-integration)
