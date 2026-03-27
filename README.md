# TourKit

A modern React onboarding and product tour library designed natively for Shadcn UI.

## Features

- **Shadcn-native** - Uses Shadcn primitives, follows copy-paste philosophy
- **Hints system** - Persistent UI beacons (unique in Shadcn ecosystem)
- **Headless + Styled** - Full flexibility or quick start
- **Accessible** - WCAG 2.1 AA compliant
- **TypeScript-first** - Full type safety

## Packages

| Package           | Description                  | Size   |
| ----------------- | ---------------------------- | ------ |
| `@tour-kit/core`  | Headless hooks and utilities | < 8KB  |
| `@tour-kit/react` | Shadcn-styled components     | < 12KB |
| `@tour-kit/hints` | Persistent hints/hotspots    | < 5KB  |

## Installation

```bash
# Core only (headless)
pnpm add @tour-kit/core

# With styled components
pnpm add @tour-kit/react

# Hints system
pnpm add @tour-kit/hints
```

## Quick Start

```tsx
import { Tour, TourStep } from '@tour-kit/react';

function App() {
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

## Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test
```

## License

MIT
