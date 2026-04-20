---
title: Migrating from React Joyride
type: content
sources:
  - ../../marketing-strategy/competitive-landscape.md
  - ../../marketing-strategy/Articles/competitors/01-react-joyride.md
updated: 2026-04-19
---

*React Joyride → TourKit. Highest-priority migration — React 19 breakage is forcing this decision now.*

## Why migrate

- **React 19 incompatibility.** Joyride uses deprecated React APIs. Upgrading to React 19 breaks tours. This is the forcing function.
- **Inline styles clash with Tailwind.** Joyride's defaults fight your design system.
- **Spotlight breaks in dark mode.** `mix-blend-mode` approach inverts incorrectly.
- **Not headless.** Can't bring your own components.
- **Bus factor 1.** Single maintainer, slow response to React version bumps.
- **No extended features.** Joyride is tours only — no checklists, announcements, analytics, adoption, media, scheduling, surveys.

## Feature mapping

| Joyride concept | TourKit equivalent |
|---|---|
| `<Joyride steps={...} />` config-driven | `<Tour id="..."><TourStep ... /></Tour>` composition |
| Callback `callback={(data) => ...}` with `action`, `index`, `type` | `useTour()` hook with discrete state + event handlers |
| `styles` prop (deep object) | Your own components (headless) or shadcn-styled defaults |
| `run`, `continuous`, `showProgress` props | Props on `<Tour>` or `useTour()` options |
| `target: '.selector'` | `target: '.selector'` or element ref |
| `placement: 'bottom'` | `placement: 'bottom'` (Floating UI under the hood) |
| `spotlightPadding` | Pass to `<Tour>` or configure in styled layer |
| `disableOverlay` | Headless: just don't render it |
| `floaterProps` | Replaced by composition — use your own popover/portal |

## Side-by-side: a 2-step tour

**Before (React Joyride):**

```tsx
import Joyride, { CallBackProps, STATUS } from 'react-joyride';

const steps = [
  {
    target: '#welcome-btn',
    content: "Welcome! Let's take a quick tour.",
    placement: 'bottom',
  },
  {
    target: '#dashboard',
    content: 'Your data overview.',
    placement: 'right',
  },
];

export function App() {
  const [run, setRun] = useState(true);
  const handleCallback = (data: CallBackProps) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
      setRun(false);
    }
  };
  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      callback={handleCallback}
      styles={{ options: { primaryColor: '#0056ff' } }}
    />
  );
}
```

**After (TourKit, styled):**

```tsx
import { Tour, TourStep } from '@tour-kit/react';

export function App() {
  return (
    <Tour id="onboarding" autoStart>
      <TourStep
        id="welcome"
        target="#welcome-btn"
        title="Welcome!"
        content="Let's take a quick tour."
        placement="bottom"
      />
      <TourStep
        id="dashboard"
        target="#dashboard"
        title="Dashboard"
        content="Your data overview."
        placement="right"
      />
    </Tour>
  );
}
```

No callback boilerplate. No `STATUS` constants. No style object. No `run` state — tour state is managed by the provider.

**After (TourKit, headless — your own components):**

```tsx
import { TourProvider, useTour } from '@tour-kit/core';

function StepUI() {
  const { currentStep, next, prev, stop } = useTour();
  if (!currentStep) return null;
  return (
    <Popover anchor={currentStep.target}>
      <h3>{currentStep.title}</h3>
      <p>{currentStep.content}</p>
      <Button onClick={next}>Next</Button>
      <Button variant="ghost" onClick={stop}>Skip</Button>
    </Popover>
  );
}
```

## Migration steps

1. **Uninstall Joyride, install TourKit:**
   ```bash
   pnpm remove react-joyride
   pnpm add @tour-kit/react
   ```

2. **Convert your `steps` array to `<TourStep>` children.** Same `target`, `content`, `placement` — just composed into JSX.

3. **Replace `<Joyride>` with `<Tour>`.** Drop the `run` state; use `autoStart` or `useTour().start()`.

4. **Remove the `callback` handler.** If you need callbacks, `useTour()` exposes lifecycle (`onStart`, `onStop`, `onStepChange`).

5. **Delete the `styles` prop.** If you were using `@tour-kit/react`, defaults match shadcn/ui. If headless, style your own components.

6. **Verify a11y improved:** TourKit ships focus traps + aria-live by default — a Lighthouse a11y audit should score higher than before.

## Common pitfalls

- **Relying on `callback` for routing side-effects.** Move those to `onStepChange` or to effects inside your step components.
- **Custom tooltips via `floaterProps`.** In TourKit, you own the tooltip entirely (headless) or use the styled defaults. No floater config API.
- **`spotlightClicks` behavior.** TourKit allows target clicks by default; configure per-step if you need otherwise.
- **SSR.** TourKit's React 19 support includes Server Components context. Guard client-only rendering the same way you do for any React 19 app.

## What TourKit does NOT do (honest about trade-offs)

- No built-in `showProgress` ProgressBar component — compose your own from `useTour().progress`
- No Joyride-style giant config object — if you liked that API, the transition may feel verbose at first
- No `locale` prop — bring your own i18n (React Intl, i18next, etc.)

## Resources

- [product/tourkit.md](../product/tourkit.md) — Tech stack and quick start
- [product/packages.md](../product/packages.md) — Extended packages Joyride doesn't have
- [competitors/oss/react-joyride.md](../competitors/oss/react-joyride.md) — Full competitive analysis
- [content/article-ideas.md](../content/article-ideas.md) — Comparison article #1 in the 75-list
- Docs: `apps/docs/content/compare/tour-kit-vs-react-joyride.mdx`

## Related

- [migration/index.md](index.md)
- [competitors/oss/react-joyride.md](../competitors/oss/react-joyride.md)
- [brand/voice.md](../brand/voice.md) — "If you need X, [competitor] is a good choice" pattern
