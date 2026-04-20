---
title: Migrating from Shepherd.js
type: content
sources:
  - ../../marketing-strategy/competitive-landscape.md
  - ../../marketing-strategy/Articles/competitors/02-shepherd-js.md
updated: 2026-04-19
---

*Shepherd.js → TourKit. The "drop AGPL, get React-native" migration.*

## Why migrate

- **AGPL license dealbreaker.** AGPL can't ship in most commercial products — legal teams reject it. Commercial Shepherd license is $50–$300, still recurring friction.
- **React wrapper is a thin adapter.** `shepherd.js` is vanilla JS; the React wrapper doesn't integrate with React idioms (hooks, context, concurrent rendering).
- **Tours-only.** No checklists, announcements, analytics, adoption, media, scheduling, surveys.
- **Confusing tier structure.** Free AGPL / commercial / multiple commercial licenses.

TourKit: MIT (free tier) + $99 one-time Pro for 7 more packages. One decision, one license.

## Feature mapping

| Shepherd concept | TourKit equivalent |
|---|---|
| `new Shepherd.Tour({ steps })` imperative | `<Tour>` + `<TourStep>` declarative |
| `tour.addStep({ ... })` | `<TourStep id="...">` child |
| `tour.start()` / `tour.next()` / `tour.back()` | `useTour()` hook returning `start`, `next`, `prev`, `stop` |
| `attachTo: { element, on }` | `target: '#...'`, `placement: '...'` |
| `advanceOn: { selector, event }` | Event handlers in your step component or `onStepChange` |
| Builtin buttons config | Your own buttons in the step component (headless) or styled defaults |
| `classes` / `styles` | Your components (headless) or shadcn-styled defaults |
| Floating UI positioning | Same — TourKit also uses Floating UI |

## Side-by-side: 2-step tour

**Before (Shepherd.js with React wrapper):**

```tsx
import { useEffect } from 'react';
import { ShepherdTour, TourMethods } from 'react-shepherd';
import 'shepherd.js/dist/css/shepherd.css';

const steps = [
  {
    id: 'welcome',
    attachTo: { element: '#welcome-btn', on: 'bottom' },
    title: 'Welcome!',
    text: "Let's take a quick tour.",
    buttons: [{ text: 'Next', action: () => tour.next() }],
  },
  {
    id: 'dashboard',
    attachTo: { element: '#dashboard', on: 'right' },
    title: 'Dashboard',
    text: 'Your data overview.',
    buttons: [{ text: 'Done', action: () => tour.complete() }],
  },
];

const tourOptions = { useModalOverlay: true, defaultStepOptions: { cancelIcon: { enabled: true } } };

export function App() {
  return (
    <ShepherdTour steps={steps} tourOptions={tourOptions}>
      <YourApp />
    </ShepherdTour>
  );
}
```

**After (TourKit):**

```tsx
import { Tour, TourStep } from '@tour-kit/react';

export function App() {
  return (
    <Tour id="onboarding" autoStart>
      <TourStep id="welcome" target="#welcome-btn"
        title="Welcome!" content="Let's take a quick tour." placement="bottom" />
      <TourStep id="dashboard" target="#dashboard"
        title="Dashboard" content="Your data overview." placement="right" />
    </Tour>
  );
}
```

No imperative `.addStep()`. No buttons array. No separate CSS import. Composition, not configuration.

## Migration steps

1. **Remove Shepherd, install TourKit:**
   ```bash
   pnpm remove shepherd.js react-shepherd
   pnpm add @tour-kit/react
   ```

2. **Delete the CSS import.** TourKit has zero runtime CSS — styling lives in your components or the shadcn-styled layer.

3. **Convert `steps` config to `<TourStep>` JSX.** `attachTo.element` → `target`. `attachTo.on` → `placement`. `text` → `content`.

4. **Drop the `buttons` config.** TourKit renders Next / Previous / Done buttons in the styled layer; customize via composition.

5. **Replace `<ShepherdTour>` with `<Tour id="...">`.** Use `autoStart` or `useTour().start()` instead of mounting-as-start.

6. **Remove `advanceOn` event wiring.** If needed, use `onStepChange` or your own effect in the step.

## Common pitfalls

- **Imperative habits.** Shepherd's API is imperative (`tour.next()`). TourKit is declarative-first via `useTour()`. If you need imperative control, grab the hook's `next` / `prev` handles.
- **Missing the CSS.** Shepherd bundles CSS; TourKit doesn't. That's intentional (headless) — but you must style it yourself (or use `@tour-kit/react`'s defaults).
- **Framework-agnostic wrapper habits.** Shepherd's React wrapper is a thin adapter. TourKit is React-native — hooks, context, Suspense-safe. Avoid wrapping it in "just for React" patterns.

## What TourKit does NOT do

- **Multi-framework support.** Shepherd works with Vue, Angular, etc. via wrappers. TourKit is React-only. See [audience/anti-personas.md](../audience/anti-personas.md).
- **Imperative-only API.** TourKit offers hooks; not a pure imperative constructor.

## Legal / licensing rationale

If your ops team cares:

| | Shepherd | TourKit |
|---|---|---|
| License | AGPL-3.0 or commercial ($50–$300) | MIT (free) or $99 Pro |
| AGPL source-disclosure risk | Yes | No |
| Commercial pay-once | Yearly $50–$300 | $99 total, lifetime updates |

## Resources

- [competitors/oss/shepherd-js.md](../competitors/oss/shepherd-js.md)
- [product/licensing.md](../product/licensing.md)
- [brand/positioning.md](../brand/positioning.md) — MIT + $99-once is the licensing wedge

## Related

- [migration/index.md](index.md)
- [migration/from-react-joyride.md](from-react-joyride.md)
- [migration/from-intro-js.md](from-intro-js.md) — Same AGPL pattern
