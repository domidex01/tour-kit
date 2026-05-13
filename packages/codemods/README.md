# @tour-kit/codemods

Codemods for migrating to Tour Kit from competing tour libraries. Ships as a
single `tour-kit-migrate` CLI plus reusable `jscodeshift` transforms.

## Install

```bash
pnpm add -D @tour-kit/codemods
# or: npm install -D @tour-kit/codemods
# or: bun add -D @tour-kit/codemods
```

## Usage

```bash
# Dry-run a Joyride codebase
npx tour-kit-migrate --from joyride --dry-run ./src

# Apply
npx tour-kit-migrate --from joyride ./src

# Pipe transformed source to stdout
npx tour-kit-migrate --from joyride --print ./src/MyTour.tsx
```

### Flags

| Flag                  | Default          | Meaning                                        |
| --------------------- | ---------------- | ---------------------------------------------- |
| `--from <source>`     | required         | `joyride` (Shepherd / Driver coming in Phase 7b) |
| `--parser <parser>`   | `tsx`            | `tsx` \| `ts` \| `babel`                       |
| `--dry-run`           | off              | Print diffs, don't write                       |
| `--print`             | off              | Write transformed source to stdout             |
| `--extensions <list>` | `ts,tsx,js,jsx`  | Comma-separated extension list                 |
| `--verbose`           | off              | Log every file action                          |

### Exit codes

| Code | Meaning                          |
| ---- | -------------------------------- |
| 0    | Success                          |
| 1    | Parse error in one or more files |
| 2    | Bad CLI args                     |
| 3    | No files matched                 |

## What gets migrated (Joyride)

| Pattern                                           | Migrated                                                  |
| ------------------------------------------------- | --------------------------------------------------------- |
| `import Joyride from 'react-joyride'`             | `import { TourProvider } from '@tour-kit/react'`          |
| `import { useJoyride } from 'react-joyride'`      | `import { useTour } from '@tour-kit/react'`               |
| `<Joyride steps={...} ... />`                     | `<TourProvider tours={[{ id: 'migrated-tour', steps }]} />` |
| `const { Tour, controls } = useJoyride({steps})`  | `const controls = useTour()` + TODO to register the tour  |
| `<Tour />`                                        | `null` + TODO to render via `<TourProvider>` ancestor     |

Every Joyride-only pattern (callback, run, stepIndex, showProgress,
showSkipButton, continuous, Step.styles, Step.tooltipComponent, …) is preserved
with a `// TODO:` comment linking to a heading in the [migration guide](https://tourkit.dev/docs/migration/joyride).

## What doesn't migrate yet

The codemod is conservative — it does NOT synthesize helper components,
refactor callback dispatchers, or move tour registration to the right ancestor.
A transform that mangles user code is worse than no transform. Patterns the
codemod can't handle are surfaced as `// TODO:` comments so the user can hand
port — never silently dropped.

See the [Joyride migration guide](https://tourkit.dev/docs/migration/joyride) for
the full list of supported patterns and the manual-port path for everything else.

## Roadmap

- Phase 7b — Shepherd.js and Driver.js transforms
- Future — Step-level rewriting (mapping `Step.styles` to theme tokens, etc.)

## License

MIT
