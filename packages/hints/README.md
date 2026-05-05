# @tour-kit/hints

> React feature hints, hotspots & beacons — pulse-animated indicators with dismissal tracking, works with or without Tailwind.

[![npm version](https://img.shields.io/npm/v/@tour-kit/hints.svg)](https://www.npmjs.com/package/@tour-kit/hints)
[![npm downloads](https://img.shields.io/npm/dm/@tour-kit/hints.svg)](https://www.npmjs.com/package/@tour-kit/hints)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/hints?label=gzip)](https://bundlephobia.com/package/@tour-kit/hints)
[![types](https://img.shields.io/npm/types/@tour-kit/hints.svg)](https://www.npmjs.com/package/@tour-kit/hints)
[![license](https://img.shields.io/npm/l/@tour-kit/hints.svg)](https://github.com/domidex01/tour-kit/blob/main/LICENSE)

Persistent **feature hints**, **hotspots**, and **beacons** for React — pulse-animated indicators that draw attention to a single UI element. Each hint has independent open/dismissed state tracked in storage, so users see it until they engage with it.

**Use this for:** "new feature" badges, contextual coachmarks, single-element tooltips, feature discovery pulses, callouts on a button or menu item.

**Don't use this for:** sequential onboarding — that's [`@tour-kit/react`](https://www.npmjs.com/package/@tour-kit/react).

**Alternative to:** Pendo guides, Userpilot hotspots, Appcues pins, Shepherd.js hints, hand-rolled `tooltip + pulse` patterns.

## Features

- **Pulsing hotspot** + tooltip composed independently
- **Headless variants** with render props — full UI control
- **Dismissal persisted** via storage adapter (localStorage by default)
- **`hide()` vs `dismiss()`** — temporary close vs permanent
- **Floating UI positioning** — collision-aware fallback placements
- **Tailwind plugin** at `@tour-kit/hints/tailwind`
- **TypeScript-first**, supports React 18 & 19
- **< 5 KB gzipped**

## Installation

```bash
npm install @tour-kit/hints
# or
pnpm add @tour-kit/hints
```

## Quick Start

```tsx
import { HintsProvider, Hint } from '@tour-kit/hints'

function App() {
  return (
    <HintsProvider>
      <Hint
        id="feature-hint"
        target="#new-feature"
        content="Click here to try our new feature!"
      />
    </HintsProvider>
  )
}
```

Or compose hotspot + tooltip manually:

```tsx
import { HintsProvider, HintHotspot, HintTooltip } from '@tour-kit/hints'

<HintsProvider>
  <HintHotspot hintId="feature-x">
    <HintTooltip>
      Try our new dashboard feature!
    </HintTooltip>
  </HintHotspot>
</HintsProvider>
```

## i18n & interpolation

All user-facing strings in `@tour-kit/hints` accept the `{{var | fallback}}` interpolation grammar from `@tour-kit/core`. Wrap your tree in `<LocaleProvider>` and every hint title and content body resolves automatically.

```tsx
import { LocaleProvider } from '@tour-kit/core'
import { HintsProvider, Hint } from '@tour-kit/hints'

<LocaleProvider locale="en" messages={{ 'hint.beta': 'Try {{feature.name | this beta feature}}!' }}>
  <HintsProvider>
    <Hint id="beta-hint" target="#beta-button" content={{ key: 'hint.beta' }} />
  </HintsProvider>
</LocaleProvider>
```

> Full guide: https://usertourkit.com/docs/guides/i18n

## Hints vs tours

| | Hints | Tours |
|---|---|---|
| Order | Independent | Sequential steps |
| Lifetime | Until dismissed | One run-through |
| State | Open / dismissed / hidden | Active step index |
| Use case | "Try the new sidebar" pulse | "Walk me through onboarding" |

## Tailwind CSS setup

```ts
// tailwind.config.ts
import { hintsPlugin } from '@tour-kit/hints/tailwind'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tour-kit/hints/dist/**/*.js',
  ],
  plugins: [hintsPlugin],
}
```

## Headless components

```tsx
import { HintHeadless } from '@tour-kit/hints/headless'

<HintHeadless
  id="my-hint"
  target="#element"
  render={({ isOpen, show, hide, dismiss, targetRect }) => (
    // Full UI control
  )}
/>
```

Available headless components:

- `HintHeadless`
- `HintHotspotHeadless`
- `HintTooltipHeadless`

## API Reference

### Components

| Export | Purpose |
|---|---|
| `Hint` | Composed hotspot + tooltip in a single component |
| `HintHotspot` | Pulsing indicator dot (positioned over a target element) |
| `HintTooltip` | Floating tooltip content |
| `HintsProvider` | Context provider — registers hints, manages dismissal state |

### Hooks

| Hook | Description |
|---|---|
| `useHints()` | All registered hints + `dismissAll`, `hideAll` |
| `useHint(id)` | Single hint state + `show`, `hide`, `dismiss` actions |
| `useHintsContext()` | Raw context (advanced) |

### Variants (CVA)

```ts
import {
  hintHotspotVariants,
  hintTooltipVariants,
  hintCloseVariants,
} from '@tour-kit/hints'

<HintHotspot className={hintHotspotVariants({ size: 'lg', color: 'primary' })} />
```

### Slot & UI library

```ts
import {
  Slot, Slottable,            // Radix UI primitives
  UnifiedSlot,                // Reconciles Radix + Base UI render-prop styles
  UILibraryProvider,          // Switch to Base UI
  useUILibrary,
} from '@tour-kit/hints'
```

### Types

```ts
import type {
  HintConfig,
  HintState,
  HotspotPosition,
  HintsContextValue,
  Placement,
  HintProps,
  HintHotspotProps,
  HintTooltipProps,
} from '@tour-kit/hints'
```

## Dismissal patterns

- **`dismiss()`** — permanent. Stored in the persistence adapter; the hint won't reappear.
- **`hide()`** — temporary. Closes for the current session only.
- **`show()`** — re-open a hidden or never-shown hint.

## Gotchas

- **Z-index** — hotspots and tooltips need a high z-index to escape parent containers (especially modal portals).
- **Visibility check** — call `isElementVisible()` (re-exported from `@tour-kit/core`) before showing a hotspot. Attaching to a hidden element is a silent failure.
- **`<Hint autoShow>`** fires once per component instance — inline `onShow` handlers won't re-trigger on re-render.

## Related packages

- [`@tour-kit/core`](https://www.npmjs.com/package/@tour-kit/core) — provides `HintConfig`, `HintState`, position math
- [`@tour-kit/react`](https://www.npmjs.com/package/@tour-kit/react) — sequential tours (use for multi-step onboarding)
- [`@tour-kit/announcements`](https://www.npmjs.com/package/@tour-kit/announcements) — modal / toast / banner announcements
- [`@tour-kit/adoption`](https://www.npmjs.com/package/@tour-kit/adoption) — feature adoption tracking + nudges

## Documentation

Full documentation: [https://usertourkit.com/docs/hints](https://usertourkit.com/docs/hints)

## License

MIT © Tour Kit Team
