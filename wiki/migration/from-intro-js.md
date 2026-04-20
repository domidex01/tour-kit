---
title: Migrating from Intro.js
type: content
sources:
  - ../../marketing-strategy/competitive-landscape.md
  - ../../marketing-strategy/Articles/competitors/03-intro-js.md
updated: 2026-04-19
---

*Intro.js → TourKit. Legacy DOM-based library → React-native hooks.*

## Why migrate

- **AGPL-3.0 license** (or $9.99–$299.99 commercial tiers). Same legal issue as Shepherd.
- **Not React-native.** `intro.js-react` is a thin wrapper; DOM-based approach conflicts with React's virtual DOM.
- **Maintenance slowed.** 8+ months between recent releases as of 2026.
- **Dated UI.** Designed ~2013 — default styling shows its age.
- **No TypeScript strict.** Types exist but aren't strict-mode friendly.
- **No extended features.** Tours / hints only.

## Feature mapping

| Intro.js concept | TourKit equivalent |
|---|---|
| `data-intro="..."` + `data-step` attributes on elements | `<TourStep>` JSX referencing `target` |
| `introJs().setOptions({ steps })` | `<Tour id="...">` with children |
| `.start()` / `.nextStep()` / `.exit()` | `useTour()`: `start`, `next`, `stop` |
| `data-position="right"` | `placement="right"` |
| `onbeforechange` / `onafterchange` | `onStepChange` |
| `showStepNumbers`, `showBullets` | Compose in styled layer or your own UI |
| Hints (`data-hint` API) | `@tour-kit/hints` package |

## Side-by-side: 2-step tour

**Before (Intro.js, data-attribute style):**

```html
<button id="welcome-btn" data-step="1" data-intro="Welcome! Let's take a quick tour.">
  Start
</button>

<div id="dashboard" data-step="2" data-intro="Your data overview." data-position="right">
  ...
</div>
```

```tsx
import introJs from 'intro.js';
import 'intro.js/introjs.css';

useEffect(() => {
  introJs().setOptions({
    showStepNumbers: true,
    showProgress: true,
  }).start();
}, []);
```

**After (TourKit):**

```tsx
import { Tour, TourStep } from '@tour-kit/react';

export function App() {
  return (
    <>
      <button id="welcome-btn">Start</button>
      <div id="dashboard">...</div>

      <Tour id="onboarding" autoStart>
        <TourStep id="welcome" target="#welcome-btn"
          title="Welcome!" content="Let's take a quick tour." placement="bottom" />
        <TourStep id="dashboard" target="#dashboard"
          content="Your data overview." placement="right" />
      </Tour>
    </>
  );
}
```

Tour definition lives with the components it points at — not spread across HTML attributes.

## Migration steps

1. **Remove Intro.js, install TourKit:**
   ```bash
   pnpm remove intro.js intro.js-react
   pnpm add @tour-kit/react
   ```

2. **Remove `data-intro` / `data-step` / `data-position` / `data-hint` attributes** from your components. Keep the `id` attributes you need as targets.

3. **Convert intro setup to `<Tour>` + `<TourStep>` JSX.** `data-intro` → `content`. `data-position` → `placement`. Numbered `data-step` → child order.

4. **Remove the CSS import** (`intro.js/introjs.css`). TourKit has zero runtime CSS.

5. **Replace hint setup with `@tour-kit/hints`.** If you were using Intro.js hints (`data-hint`), use the dedicated package.

6. **Delete the imperative setup.** No more `introJs().setOptions(...).start()` — `<Tour autoStart>` replaces it.

## Common pitfalls

- **Missing the DOM-attribute convenience.** Intro.js lets non-React code annotate elements. TourKit requires the tour to be React. That's the trade — clean integration with React state and lifecycle.
- **Hint migration.** Intro.js's hint API (clickable `?` icons) maps to `@tour-kit/hints` beacons — but the UX is slightly different. Test a few before mass-migrating.
- **Custom CSS overrides.** You likely have CSS targeting `.introjs-tooltip` etc. Delete it all; style your own components or use `@tour-kit/react` defaults.

## What TourKit does NOT do

- **Multi-framework support.** Intro.js works in any JS context. TourKit is React-only.
- **HTML-attribute tour definition.** TourKit tours are React — no `data-intro` convenience.

## Legal / licensing

| | Intro.js | TourKit |
|---|---|---|
| License | AGPL-3.0 or commercial ($9.99–$299.99) | MIT (free) or $99 Pro |
| React support | Separate `intro.js-react` wrapper | Native package |
| Last release cadence | Slowed (8+ months) | Active |

## Resources

- [competitors/oss/intro-js.md](../competitors/oss/intro-js.md)
- [product/packages.md](../product/packages.md) — `@tour-kit/hints` for hint-style UX
- [product/licensing.md](../product/licensing.md)

## Related

- [migration/index.md](index.md)
- [migration/from-shepherd-js.md](from-shepherd-js.md) — Same AGPL pattern
- [migration/from-react-joyride.md](from-react-joyride.md)
