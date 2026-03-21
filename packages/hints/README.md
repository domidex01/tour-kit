# @tour-kit/hints

shadcn/ui-compatible hint/beacon components for contextual help.

## Installation

```bash
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

## Tailwind CSS Setup

```js
// tailwind.config.js
import { hintsPlugin } from '@tour-kit/hints/tailwind'

export default {
  plugins: [hintsPlugin],
}
```

## Components

| Component | Description |
|-----------|-------------|
| `Hint` | Main hint component (hotspot + tooltip) |
| `HintHotspot` | Pulsing indicator dot |
| `HintTooltip` | Tooltip content |

## Variants

```tsx
import { HintHotspot, hintHotspotVariants } from '@tour-kit/hints'

<HintHotspot size="lg" color="success" pulse />
```

## Headless Components

```tsx
import { HintHeadless } from '@tour-kit/hints/headless'

<HintHeadless
  id="my-hint"
  target="#element"
  render={({ isOpen, show, hide, targetRect }) => (
    // Full UI control
  )}
/>
```

## License

MIT
