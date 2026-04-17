---
title: "Build a product tour heatmap with React + Canvas (under 1KB)"
published: false
description: "Your tour funnel says 39% of users bail. But where? Build a Canvas-based heatmap that tracks clicks, dismissals, and completions per tour step."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/product-tour-heatmap
cover_image: https://usertourkit.com/og-images/product-tour-heatmap.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-heatmap)*

# How to build a product tour heatmap (clicks, dismissals, completions)

Your tour analytics dashboard says 61% of users complete the onboarding flow. But where exactly did the other 39% bail — the close button on step 3, an outside click during step 2, the ESC key before step 1 even rendered? Funnel charts give you the *what*. A product tour heatmap gives you the *where*.

According to Chameleon's analysis of 15 million tour interactions, roughly 40% of modals get dismissed on sight ([Chameleon Benchmark Report, 2025](https://www.chameleon.io/benchmark-report)). That statistic is useless without spatial context. A heatmap overlay pinpoints exactly which screen regions trigger the most engagement and the most abandonment.

```bash
npm install @tourkit/core @tourkit/react
```

Tour Kit is our project, so treat the code examples with appropriate skepticism. The approach itself works with any tour library that exposes step lifecycle events. By the end you'll have a working Canvas-based heatmap that overlays click and dismissal data onto your actual tour steps, with completion tracking built in.

## What you'll build

A product tour heatmap tracks three distinct interaction types — clicks, dismissals, and completions — then renders them as a color-coded HTML5 Canvas overlay positioned on top of your running application, giving you spatial context that traditional funnel charts strip away. Red zones indicate high-frequency interactions. Blue zones show sparse activity. A separate dismissal layer highlights where users abandon the tour, and the visualization loads lazily so it adds zero weight to your production bundle.

The final result includes:
- An event collector that captures coordinates, interaction type, and active step ID
- A Canvas renderer using simpleheat (<1KB gzipped) for the heatmap layer
- Step-level filtering so you can isolate interactions per tour step
- A data table fallback for accessibility compliance

## Step 1: set up the event collector

Every product tour heatmap starts with raw interaction data: screen coordinates, interaction type (click, dismiss, or complete), plus which tour step was active when the event fired. The collector module stores these points in memory with zero React overhead, keeping the recording path under 0.01ms per event so it never interferes with the tour experience itself.

```typescript
// src/lib/tour-heatmap-collector.ts
type InteractionType = 'click' | 'dismiss' | 'complete';

interface TourInteraction {
  x: number;
  y: number;
  type: InteractionType;
  stepId: string;
  timestamp: number;
}

const interactions: TourInteraction[] = [];

export function recordInteraction(
  event: MouseEvent,
  type: InteractionType,
  stepId: string
) {
  interactions.push({
    x: event.clientX,
    y: event.clientY,
    type,
    stepId,
    timestamp: Date.now(),
  });
}

export function getInteractions(filter?: {
  type?: InteractionType;
  stepId?: string;
}): TourInteraction[] {
  if (!filter) return interactions;

  return interactions.filter((i) => {
    if (filter.type && i.type !== filter.type) return false;
    if (filter.stepId && i.stepId !== filter.stepId) return false;
    return true;
  });
}

export function clearInteractions() {
  interactions.length = 0;
}
```

The collector is a plain module with no React dependency. This matters because it runs in event handlers where you want zero overhead. No state updates, no re-renders, just an array push.

One thing we hit during testing: using `pageX`/`pageY` instead of `clientX`/`clientY` breaks the heatmap when the page scrolls between recording and rendering. Stick with viewport-relative coordinates and account for scroll offset only at render time.

## Step 2: wire up Tour Kit lifecycle events

Tour Kit fires callbacks at each step transition. Hook into `onStepClick`, `onStepDismiss`, `onStepComplete` to feed the collector.

```typescript
// src/components/TrackedTour.tsx
import { TourProvider, useTour } from '@tourkit/react';
import { recordInteraction } from '../lib/tour-heatmap-collector';

const tourSteps = [
  { id: 'welcome', target: '#welcome-button', content: 'Start here' },
  { id: 'dashboard', target: '#dashboard-nav', content: 'Your dashboard' },
  { id: 'settings', target: '#settings-icon', content: 'Customize settings' },
];

function TourWithTracking() {
  const { currentStep } = useTour();

  return (
    <TourProvider
      tourId="onboarding"
      steps={tourSteps}
      onStepInteraction={(event, stepId) => {
        recordInteraction(event.nativeEvent, 'click', stepId);
      }}
      onStepDismiss={(event, stepId) => {
        recordInteraction(event.nativeEvent, 'dismiss', stepId);
      }}
      onStepComplete={(event, stepId) => {
        recordInteraction(event.nativeEvent, 'complete', stepId);
      }}
    />
  );
}

export default TourWithTracking;
```

Each callback receives the native browser event with coordinate data plus the step ID. The collector stores raw interactions without processing them. Keeping the hot path this thin means you won't notice any performance impact during the tour itself.

### Tracking dismissal methods separately

Not all dismissals are equal. A close-button click signals intentional exit. An outside click might mean the user didn't realize they were in a tour. An ESC key press often means frustration.

```typescript
// src/lib/tour-heatmap-collector.ts
type DismissMethod = 'close-button' | 'outside-click' | 'escape-key';

interface TourInteraction {
  x: number;
  y: number;
  type: InteractionType;
  stepId: string;
  timestamp: number;
  dismissMethod?: DismissMethod;
}

export function recordDismissal(
  event: MouseEvent | KeyboardEvent,
  stepId: string,
  method: DismissMethod
) {
  const coords = 'clientX' in event
    ? { x: event.clientX, y: event.clientY }
    : { x: 0, y: 0 }; // keyboard events have no spatial data

  interactions.push({
    x: coords.x,
    y: coords.y,
    type: 'dismiss',
    stepId,
    timestamp: Date.now(),
    dismissMethod: method,
  });
}
```

Keyboard dismissals don't carry coordinates. That's fine. You still get the step ID and timestamp for funnel analysis. Spatial data is only meaningful for mouse-driven interactions.

## Step 3: render the heatmap with simpleheat

simpleheat is a 700-byte Canvas library by Mourner (the developer behind Leaflet). It takes an array of `[x, y, intensity]` points and draws a heatmap. No dependencies. No configuration headaches.

```typescript
// src/components/TourHeatmapOverlay.tsx
import { useEffect, useRef, useState } from 'react';
import { getInteractions } from '../lib/tour-heatmap-collector';
import type { InteractionType } from '../lib/tour-heatmap-collector';

const loadSimpleheat = () => import('simpleheat');

interface HeatmapOverlayProps {
  filterType?: InteractionType;
  filterStepId?: string;
  radius?: number;
  blur?: number;
}

export function TourHeatmapOverlay({
  filterType,
  filterStepId,
  radius = 25,
  blur = 15,
}: HeatmapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;

    let cancelled = false;

    loadSimpleheat().then((mod) => {
      if (cancelled || !canvasRef.current) return;

      const heat = mod.default(canvasRef.current);
      const data = getInteractions({ type: filterType, stepId: filterStepId });

      const points: [number, number, number][] = data
        .filter((d) => d.x > 0 && d.y > 0)
        .map((d) => [d.x, d.y, 1]);

      heat.radius(radius, blur);
      heat.data(points);
      heat.draw();
    });

    return () => { cancelled = true; };
  }, [visible, filterType, filterStepId, radius, blur]);

  return (
    <>
      <button
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label="Toggle tour heatmap overlay"
      >
        {visible ? 'Hide heatmap' : 'Show heatmap'}
      </button>

      {visible && (
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          role="img"
          aria-label="Tour interaction heatmap showing click density"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.6,
          }}
        />
      )}
    </>
  );
}
```

The Canvas overlay sits above everything with `pointerEvents: 'none'` so it doesn't intercept actual user interactions. The `role="img"` and `aria-label` attributes give screen readers a meaningful description of the overlay's purpose.

### Why simpleheat over heatmap.js?

heatmap.js (~3KB gzipped) is the more popular choice. But for a tour-specific use case, simpleheat wins on two counts. It's one-third the size, and it exposes a simpler API that matches our data shape exactly: `[x, y, intensity]` arrays. heatmap.js adds gradient customization and radius configuration that you won't need until your interaction dataset exceeds 10,000 points.

## Step 4: add step-level filtering and a data table

The real power of a tour heatmap isn't the overall view. It's filtering by step. "Where did users click during step 2?" is a fundamentally different question from "where did users click during the entire tour?"

The full dashboard component code is in the [original article](https://usertourkit.com/blog/product-tour-heatmap). It includes fieldset-based filters for step and interaction type, plus an accessible data table fallback.

The data table underneath the heatmap serves two purposes. For sighted users, it provides exact coordinates when the visual overlay is too dense to read. For screen reader users, it's the only way to access the data at all. Canvas elements are opaque to assistive technology.

## Benchmarks and performance impact

| Component | Bundle impact (gzipped) | Runtime cost |
|---|---|---|
| Event collector | <0.3KB | <0.01ms per event (array push) |
| simpleheat renderer | ~0.7KB (lazy-loaded) | ~2ms for 1,000 points on M1 MacBook |
| heatmap.js (alternative) | ~3KB (lazy-loaded) | ~3ms for 1,000 points |
| Full dashboard component | ~1.2KB (lazy-loaded) | Negligible (standard React render) |

Tour Kit's core ships at under 8KB gzipped. Adding the heatmap collector to production adds 0.3KB. The visualization itself lazy-loads in the dev dashboard, keeping the production bundle untouched.

## What the heatmap tells you (and what it doesn't)

A product tour heatmap answers the spatial questions that funnel analytics strip away: which UI zone draws the most clicks during step 2, whether dismissals cluster near the close button or outside the popover boundary. It also shows whether users interact with the highlighted target element or something else entirely.

It doesn't tell you *why*. A cluster of dismissals on step 3 could mean the content is confusing, the positioning blocks a primary action, or users already know the feature. Combine heatmap data with qualitative signals.

One limitation worth acknowledging: any client-side heatmap shows you what your testers and internal users did, not a statistically significant sample. For production-scale data, pipe interactions to your analytics backend and aggregate server-side across thousands of sessions.

## FAQ

### What is a product tour heatmap?

A product tour heatmap is a visual overlay showing where users click, dismiss, and complete tour steps. Tour Kit renders this as a Canvas layer using simpleheat, mapping interaction density to a color gradient. Red means frequent activity, blue means sparse. Unlike funnel charts, a heatmap reveals spatial patterns behind the drop-off numbers.

### How much does adding heatmap tracking affect bundle size?

The event collector adds under 0.3KB gzipped to your production bundle. The visualization component adds roughly 1.2KB but lazy-loads on demand, meaning it costs zero bytes in production unless you explicitly render the dashboard.

### What is a good tour completion rate?

According to Chameleon's study of 15 million tour interactions, the average completion rate is 61%. Tours in the top 1% never exceed five steps. User-triggered tours outperform auto-triggered by 2-3x ([Chameleon, 2025](https://www.chameleon.io/blog/product-tour-benchmarks-highlights)).

---

Full article with all code examples and troubleshooting: [usertourkit.com/blog/product-tour-heatmap](https://usertourkit.com/blog/product-tour-heatmap)
