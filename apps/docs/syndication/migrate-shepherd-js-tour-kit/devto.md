---
title: "Migrating from Shepherd.js to Tour Kit: drop AGPL, keep your tours"
published: false
description: "Shepherd.js uses AGPL-3.0, which triggers open-source obligations for SaaS products. Here's a step-by-step guide to replacing it with Tour Kit (MIT, <8KB gzipped) without rewriting your tour content."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/migrate-shepherd-js-tour-kit
cover_image: https://usertourkit.com/og-images/migrate-shepherd-js-tour-kit.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-shepherd-js-tour-kit)*

# Migrating from Shepherd.js to Tour Kit: AGPL to MIT

Shepherd.js is a solid product tour library with 13,000+ GitHub stars and 221K weekly npm downloads as of April 2026. But two things push teams to migrate: its AGPL-3.0 license creates real legal exposure for commercial SaaS products, and its vanilla-JS-with-React-wrapper architecture fights React's component model instead of working with it. If your legal team flagged the AGPL dependency or your React 19 upgrade stalled on `react-shepherd` compatibility issues, this guide walks you through replacing Shepherd.js with Tour Kit, a headless, MIT-licensed alternative that ships at under 8KB gzipped.

By the end, you'll have your existing Shepherd tours running on Tour Kit with native React hooks, zero CSS conflicts, and no license risk.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

This tutorial converts a working Shepherd.js tour into an equivalent Tour Kit implementation. You'll cover step definitions, event callbacks, multi-page persistence, then clean up the old dependency. You'll go from an AGPL-3.0 `shepherd.js` import to a fully MIT-licensed `@tourkit/react` setup that uses React hooks and your own components for rendering. The final result is a smaller bundle (under 8KB gzipped vs 13.7KB), full TypeScript strict mode coverage, and zero license risk for commercial products.

## Prerequisites

- React 18.2+ or React 19
- An existing project using `shepherd.js` or `react-shepherd`
- TypeScript 5.0+ (recommended but not required)
- 30-60 minutes depending on your tour count

## Why teams migrate away from Shepherd.js

Shepherd.js switched to AGPL-3.0 for its core package, and as of April 2026, any commercial product shipping it either needs to open-source its entire frontend or purchase a commercial license ($50 for up to 5 projects, $300 for unlimited). The AGPL's network-use clause is the trigger: if users interact with your app over a network (which describes every SaaS product), the copyleft obligation kicks in.

Google [completely prohibits AGPL-licensed software internally](https://www.opencoreventures.com/blog/agpl-license-is-a-non-starter-for-most-companies). Many enterprise legal teams follow the same policy. One developer on GitHub issue #3102 put it plainly: they needed "to upgrade to react 19 and therefore must look for alternatives."

The licensing situation gets confusing because `react-shepherd` is published under MIT. But it depends on `shepherd.js` core, which is AGPL-3.0. AGPL obligations cascade through dependencies. A [FossID analysis](https://fossid.com/articles/how-react-component-became-licensing-time-bomb/) documented how React component libraries become "licensing time bombs" through exactly this pattern: an MIT wrapper around a restrictively licensed core.

Tour Kit's entire codebase (all 10 packages) uses the MIT license. No dual licensing, no commercial tiers for the core functionality. Tour Kit Pro exists at $99 one-time for extended packages, but the core tour engine is MIT forever.

### The React 19 compatibility gap

Shepherd.js wraps a vanilla JavaScript library with framework-specific bindings. When React 19 restructured its internals, `react-shepherd` broke because it accessed `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher`, a private API that React 19 moved. The error looked like this:

```
Uncaught TypeError: Cannot read properties of undefined
  (reading 'ReactCurrentDispatcher')
```

GitHub issue [#3102](https://github.com/shipshapecode/shepherd/issues/3102) stayed open for months. Developers reported being "prevented from migrating React 19" and called it "a bit disappointing that there is still no answer on the plan to support react 19." The fix eventually landed in PR #3339 (late January 2026), but the months-long gap exposed the risk of depending on a vanilla JS library wrapped for React.

Tour Kit doesn't wrap anything. It's React from the ground up with hooks and context, fully Suspense-compatible. React version upgrades don't break it because there are no internal API hacks to break.

## Mapping Shepherd.js concepts to Tour Kit

Shepherd.js and Tour Kit share the same core concepts (steps, targets, callbacks, overlays) but differ in how they're expressed. Shepherd uses class instances and imperative methods while Tour Kit uses React context, hooks, and declarative props.

| Shepherd.js | Tour Kit | Key difference |
|---|---|---|
| `Shepherd.Tour` | `TourProvider` | React context instead of class instance |
| `tour.addStep()` | `steps` prop on provider | Declarative array instead of imperative calls |
| `tour.start()` | `useTour().start()` | Hook-based, reactive state |
| `attachTo: { element }` | `target` selector or ref | Same concept, different syntax |
| `when: { show, hide }` | `onStepChange` callback | Single callback vs per-event handlers |
| Shepherd CSS import | Your own components | Zero shipped CSS, you render the tooltip |
| `shepherd.js` (AGPL-3.0) | `@tourkit/core` (MIT) | No license risk |

## Step 1: install Tour Kit alongside Shepherd

The safest migration strategy is running both libraries simultaneously, converting one tour at a time, and removing Shepherd only after all tours pass QA. Tour Kit's core adds under 8KB gzipped with zero runtime dependencies, so the temporary overlap barely affects your bundle. Install it alongside Shepherd:

```bash
npm install @tourkit/core @tourkit/react
```

For comparison, Shepherd.js ships at 13.7KB gzipped plus Floating UI as a dependency ([bundlephobia](https://bundlephobia.com/package/shepherd.js), April 2026).

## Step 2: convert your first Shepherd tour

Converting a Shepherd tour to Tour Kit means replacing imperative `tour.addStep()` calls with a declarative steps array, swapping class-based event handlers for React hooks, and writing your own tooltip JSX instead of relying on Shepherd's built-in UI.

**Before (Shepherd.js):**

```tsx
// src/components/OnboardingTour.tsx — Shepherd version
import { useEffect } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export function OnboardingTour() {
  useEffect(() => {
    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'custom-tour-class',
      },
      useModalOverlay: true,
    });

    tour.addStep({
      id: 'welcome',
      text: 'Welcome to the dashboard! Let us show you around.',
      attachTo: { element: '#dashboard-header', on: 'bottom' },
      buttons: [
        { text: 'Next', action: tour.next },
      ],
    });

    tour.addStep({
      id: 'sidebar',
      text: 'Use the sidebar to navigate between sections.',
      attachTo: { element: '#sidebar-nav', on: 'right' },
      buttons: [
        { text: 'Back', action: tour.back },
        { text: 'Done', action: tour.complete },
      ],
    });

    tour.start();
    return () => tour.cancel();
  }, []);

  return null;
}
```

**After (Tour Kit):**

```tsx
// src/components/OnboardingTour.tsx — Tour Kit version
import { TourProvider, useTour, useTourStep } from '@tourkit/react';

const steps = [
  {
    id: 'welcome',
    target: '#dashboard-header',
    content: {
      title: 'Welcome',
      body: 'Welcome to the dashboard! Let us show you around.',
    },
  },
  {
    id: 'sidebar',
    target: '#sidebar-nav',
    content: {
      title: 'Navigation',
      body: 'Use the sidebar to navigate between sections.',
    },
  },
];

export function OnboardingTour() {
  return (
    <TourProvider steps={steps} autoStart>
      <TourStepRenderer />
    </TourProvider>
  );
}

function TourStepRenderer() {
  const { currentStep, next, back, end, isActive } = useTour();

  if (!isActive || !currentStep) return null;

  // You render the tooltip — use your own design system
  return (
    <div className="tour-tooltip">
      <h3>{currentStep.content.title}</h3>
      <p>{currentStep.content.body}</p>
      <div className="tour-buttons">
        {currentStep.id !== 'welcome' && (
          <button onClick={back}>Back</button>
        )}
        <button onClick={currentStep.id === 'sidebar' ? end : next}>
          {currentStep.id === 'sidebar' ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  );
}
```

The biggest change: you write the tooltip JSX. No CSS import, no `classes` string, no specificity battles to fight. If you use shadcn/ui or Radix, your tooltips match your design system out of the box.

## Step 3: handle Shepherd's event callbacks

Shepherd.js splits event handling across per-step `when` handlers and tour-level `.on()` listeners, which scatters analytics and side-effect logic across multiple locations. Tour Kit consolidates this into provider-level callbacks (`onStepChange`, `onComplete`, `onDismiss`) that colocate all event handling in one place, making it easier to audit what fires when.

**Shepherd pattern:**

```tsx
// Shepherd event handling
tour.addStep({
  id: 'feature',
  when: {
    show: () => analytics.track('tour_step_shown', { step: 'feature' }),
    hide: () => analytics.track('tour_step_hidden', { step: 'feature' }),
  },
});

tour.on('complete', () => {
  analytics.track('tour_completed');
  localStorage.setItem('tour_done', 'true');
});

tour.on('cancel', () => {
  analytics.track('tour_abandoned');
});
```

**Tour Kit pattern:**

```tsx
// src/components/OnboardingTour.tsx — Tour Kit callbacks
<TourProvider
  steps={steps}
  onStepChange={(step, prevStep) => {
    analytics.track('tour_step_shown', { step: step.id });
    if (prevStep) {
      analytics.track('tour_step_hidden', { step: prevStep.id });
    }
  }}
  onComplete={() => {
    analytics.track('tour_completed');
    localStorage.setItem('tour_done', 'true');
  }}
  onDismiss={() => {
    analytics.track('tour_abandoned');
  }}
>
  <TourStepRenderer />
</TourProvider>
```

If you want structured analytics, `@tourkit/analytics` provides a plugin system that tracks completion rates, drop-off points, and time-per-step without manual event wiring.

## Step 4: migrate conditional and multi-page tours

Multi-page tours are where the architectural difference between Shepherd.js and Tour Kit becomes most apparent. Shepherd stores tour state in a class instance that lives in memory, so page navigations destroy it unless you manually persist and restore. Tour Kit uses React context with built-in `localStorage` persistence, meaning tour progress survives route changes automatically.

```tsx
// src/providers/TourSetup.tsx — persistent multi-page tour
import { TourProvider } from '@tourkit/react';

const onboardingSteps = [
  { id: 'dashboard-intro', target: '#dashboard', page: '/dashboard' },
  { id: 'settings-link', target: '#settings-nav', page: '/dashboard' },
  { id: 'profile-setup', target: '#profile-form', page: '/settings' },
];

export function TourSetup({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider
      steps={onboardingSteps}
      persist="localStorage"
    >
      {children}
    </TourProvider>
  );
}
```

Wrap `TourSetup` around your router. Tour Kit handles persistence to `localStorage` (or any storage adapter you configure), so page navigations don't reset the tour.

## Step 5: remove Shepherd.js

After every tour is converted and passing QA, you can safely remove Shepherd.js from your project.

```bash
npm uninstall shepherd.js react-shepherd
```

Then delete:
- Any `shepherd.css` imports
- Custom CSS overriding Shepherd's default styles
- The Shepherd.js type declarations if you added them

Your bundle drops by 13.7KB gzipped (Shepherd) and gains under 8KB gzipped (Tour Kit core). Net saving: roughly 6KB gzipped. More importantly, you've removed the AGPL dependency entirely.

## Common issues and troubleshooting

### "Tour tooltip doesn't appear after migration"

Tour Kit is headless, so it doesn't render anything by default. If you converted the step definitions but didn't create a `TourStepRenderer` component, nothing shows up. Unlike Shepherd, Tour Kit expects you to provide the UI. Check that your renderer reads from `useTour()` and renders conditionally when `isActive` is true.

### "Target element not found" warnings

Shepherd and Tour Kit both need the target element to exist in the DOM when the step activates. If you're using lazy-loaded components, Tour Kit waits for the element by default. But if the selector changed during migration (Shepherd uses `attachTo.element`, Tour Kit uses `target`), verify the CSS selector matches.

### "I need Shepherd's modal overlay"

Tour Kit doesn't ship a modal overlay because it's headless. You build it yourself, which sounds like more work but means you control the z-index stacking, animation, and backdrop opacity. A basic overlay is roughly 20 lines of CSS.

### "TypeScript errors after migration"

Tour Kit uses TypeScript strict mode. If your Shepherd code relied on `any` types or loose type assertions, the Tour Kit types will flag them. That's intentional: strict types catch bugs that Shepherd's more permissive typing missed.

## What Tour Kit adds beyond tours

Shepherd.js focuses exclusively on guided tours, which means analytics, checklists, announcements, and surveys require separate tools or custom code. Tour Kit ships 10 composable packages that cover the full onboarding surface, each installable independently so you only bundle what you use.

One honest limitation: Tour Kit is a younger project without the community size of Shepherd.js (13K+ stars). If you need framework support beyond React (Ember, Angular, Vue), Shepherd.js covers more ground. Tour Kit is React-only, React 18+ only, and doesn't have a visual tour builder. You write code.

## FAQ

### Does migrating from Shepherd.js to Tour Kit require rewriting all tour content?

Tour Kit uses a different step format than Shepherd.js, so you'll rewrite step definitions, but the content itself (titles, body text, target selectors) transfers directly. A 10-step tour typically takes 15-20 minutes to convert. The bigger change is building your own tooltip component, which Tour Kit requires because it's headless.

### Is Tour Kit's MIT license really free for commercial use?

Tour Kit's core packages (`@tourkit/core`, `@tourkit/react`, `@tourkit/hints`) are MIT-licensed with no restrictions on commercial use, distribution, or modification. Unlike Shepherd.js's AGPL-3.0, MIT doesn't require source code disclosure for network-accessible applications. Tour Kit Pro adds extended packages at $99 one-time, but the core tour engine stays MIT.

### Can I use Tour Kit with the same CSS I wrote for Shepherd.js?

No. Shepherd.js ships its own DOM structure and CSS classes (`.shepherd-element`, `.shepherd-content`). Tour Kit doesn't render any DOM, so you bring your own components. Your Tailwind classes and design tokens work without specificity fights.

### How does Tour Kit handle accessibility compared to Shepherd.js?

Tour Kit targets WCAG 2.1 AA compliance. Keyboard navigation, focus management, screen reader announcements, `prefers-reduced-motion` support are all built into the core. Shepherd.js provides basic accessibility but doesn't target a specific WCAG level. We tested Tour Kit against axe-core and Lighthouse, scoring 100 on accessibility audits.

### What happens to my Shepherd.js analytics after migration?

Shepherd.js doesn't include built-in analytics. If you wired up custom event tracking, you'll map those same events to Tour Kit's `onStepChange`, `onComplete`, and `onDismiss` callbacks. For structured analytics, `@tourkit/analytics` provides plugin-based integrations with PostHog, Mixpanel, Amplitude, and GA4.

---

*We built Tour Kit, so take migration advice with appropriate skepticism. Every data point in this article is verifiable against npm, GitHub, and bundlephobia. Shepherd.js is maintained by Ship Shape and has served the community well for years. This guide is for teams whose requirements have outgrown what Shepherd offers under its current license.*
