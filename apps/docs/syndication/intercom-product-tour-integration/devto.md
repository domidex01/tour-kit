---
title: "Show product tours before chat: wiring Tour Kit into Intercom"
published: false
description: "How to integrate a headless React tour library with Intercom so users get guided onboarding before they reach for the support widget. 40 lines of glue code, no backend."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/intercom-product-tour-integration
cover_image: https://usertourkit.com/og-images/intercom-product-tour-integration.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/intercom-product-tour-integration)*

# Tour Kit + Intercom: show tours before chat, not after

Most teams wire up Intercom, bolt on its product tours add-on, and hope for the best. The problem: users who don't understand a feature reach for the chat widget first. Support answers the same "how do I..." questions on repeat. Intercom's own data shows proactive onboarding can reduce support contact rates by roughly 80% ([Intercom blog](https://www.intercom.com/blog/self-serve-support/)). But Intercom's built-in tours can't coordinate with its own Messenger to make that happen.

This guide wires Tour Kit's headless tour engine into Intercom's JavaScript API so tours fire at the right moment, completion events flow into Intercom for targeting, and the chat widget only appears after users have seen the relevant guidance.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

A Tour Kit-powered integration that shows contextual product tours before the Intercom chat widget appears, reducing repetitive support questions by giving users guidance at the moment they need it. Tour Kit handles the contextual onboarding (a 3-step tour explaining a feature) and fires a completion event into Intercom via `trackEvent`. Intercom uses that event to suppress auto-messages for users who already got the tour. If a user skips or hits a dead end, the Messenger launcher appears immediately as a fallback.

The whole integration is about 40 lines of glue code. No custom backend required.

## Why Intercom + Tour Kit instead of Intercom tours alone?

Intercom's built-in product tours are a bolt-on add-on that costs $99 to $199 per month on top of your base plan, ships without lifecycle callbacks, and silently fails on mobile. Tour Kit fills those gaps at a fraction of the cost while letting Intercom do what it does best: messaging and support.

| Capability | Intercom tours | Tour Kit |
|---|---|---|
| Mobile web support | Silently ignored | Same API everywhere |
| Lifecycle callbacks | No onComplete/onSkip | onStepComplete, onTourEnd, onTourSkip |
| Bundle size impact | ~210 KB gzipped | <8 KB gzipped (core) |
| Checklist support | No | @tourkit/checklists |
| Iframe compatibility | Breaks silently | Yes |
| Pricing | $99–$199/month add-on | Free core (MIT), $99 one-time Pro |

The callback gap is the big one. Intercom's own community forum confirms it: "At present there is no JS callback function for Tours, nor is there a way to specifically detect if an end-user is due or about to trigger/receive a Tour" ([Intercom community](https://community.intercom.com/outbound-11/product-tour-callback-detect-when-started-7052)).

## Step 1: Define a tour with completion callbacks

Tour Kit's `onComplete` and `onSkip` callbacks give you the lifecycle events Intercom's product tours lack entirely, letting you fire custom events into Intercom's user timeline the moment a tour finishes or gets abandoned.

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

The core of this integration is a 20-line hook that hides Intercom's chat launcher while a Tour Kit tour is active, then shows it again when the tour finishes or gets skipped.

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

Twenty lines. The user sees the tour first. When it finishes (completed or skipped), the Messenger appears.

## Step 3: Build the targeting loop in Intercom

Once Tour Kit fires `trackEvent` on completion, you can build audience segments inside Intercom:

1. Go to **Intercom > Outbound > Messages**
2. Create an auto-message targeting users who have NOT triggered `tour-completed` where `tour_id = export-feature`
3. Set a delay (e.g., 48 hours after signup)
4. The message can prompt them to retry the tour or open the docs

Users who finished the tour never see this message. Users who skipped get a gentler nudge two days later. Users who never encountered the tour get a proactive prompt.

## Step 4: Verify the integration works

Testing this integration takes three checks: confirm the custom events land in Intercom's user timeline, verify the Messenger launcher toggles visibility during a tour, and run the same flow on mobile where Intercom's own tours silently fail.

1. **Events tab** on the test user's profile should show `tour-completed` with the metadata
2. **Messenger visibility** should toggle: hidden during tour, visible after
3. **Mobile test**: load the same page on a phone. Tour Kit renders the tour. Intercom's `startTour` would silently fail here, but Tour Kit doesn't rely on it

The gotcha we hit: if you call `Intercom('update', { hide_default_launcher: true })` before Intercom finishes booting, it gets overwritten by the boot defaults. We added a 500ms delay on initial page load.

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    if (isActive && window.Intercom) {
      window.Intercom('update', { hide_default_launcher: true });
    }
  }, 500);
  return () => clearTimeout(timer);
}, []);
```

## Going further

Once the basic Tour Kit-to-Intercom bridge is working, three patterns let you push the integration further: dual analytics pipelines, checklist-driven messaging, and a mobile fallback strategy.

One limitation to call out: Tour Kit requires React 18+ and doesn't have a visual builder. If your product team wants drag-and-drop tour creation without code, this integration isn't the right fit.

Check the full [Tour Kit docs](https://usertourkit.com/) for the hooks API and analytics configuration. Intercom's [JavaScript API reference](https://developers.intercom.com/installing-intercom/web/methods) covers `trackEvent`, `update`, and `startTour`.

## FAQ

**Can Tour Kit replace Intercom product tours completely?**
Tour Kit replaces the guided tour functionality (step-by-step guides, tooltips, checklists) at under 8 KB gzipped versus Intercom's ~210 KB Messenger bundle. It can't replace Intercom's audience targeting or message scheduling, but those features work without the tours add-on.

**Does this integration work with Intercom's modern SDK?**
Yes. The `@intercom/messenger-js-sdk` npm package exposes the same `Intercom()` global. Tour Kit's callbacks fire standard JavaScript, so no special adapter is needed.

**What happens on mobile where Intercom tours don't work?**
Intercom's `startTour` API silently does nothing on mobile web. Tour Kit renders the same tour on desktop and mobile using the same React components.

**How much does this save compared to the Intercom tours add-on?**
The Proactive Support Plus add-on costs $99 per month for 500 tour sends, with overages beyond that. Tour Kit's core is MIT-licensed and free. The Pro package is a one-time $99 purchase.
