# @tour-kit/react

shadcn/ui-compatible React components for product tours and onboarding.

## Installation

```bash
pnpm add @tour-kit/react
```

## Quick Start

```tsx
import { Tour, TourStep, useTour } from '@tour-kit/react'

function App() {
  return (
    <Tour id="welcome-tour" autoStart>
      <TourStep
        id="step-1"
        target="#feature-button"
        title="Welcome!"
        content="Let me show you around."
      />
      <TourStep
        id="step-2"
        target="#another-element"
        title="This is great"
        content="Here's another feature."
      />
    </Tour>
  )
}
```

## Tailwind CSS Setup

```js
// tailwind.config.js
import { tourKitPlugin } from '@tour-kit/react/tailwind'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tour-kit/react/dist/**/*.js',
  ],
  plugins: [tourKitPlugin],
}
```

## Components

| Component | Description |
|-----------|-------------|
| `Tour` | Main tour wrapper |
| `TourStep` | Individual tour step |
| `TourCard` | Tour step card |
| `TourOverlay` | Spotlight overlay |
| `TourNavigation` | Next/Prev/Skip buttons |
| `TourProgress` | Progress indicator |
| `TourClose` | Close button |

## Headless Components

For full UI control, use headless components:

```tsx
import { TourCardHeadless } from '@tour-kit/react/headless'

<TourCardHeadless
  render={({ currentStep, next, prev }) => (
    <div>
      <h2>{currentStep?.title}</h2>
      <button onClick={prev}>Back</button>
      <button onClick={next}>Next</button>
    </div>
  )}
/>
```

## Variants

Customize components using cva variants:

```tsx
import { TourCard, tourCardVariants } from '@tour-kit/react'

<TourCard size="lg" />
<TourCard className={tourCardVariants({ size: 'sm' })} />
```

## License

MIT
