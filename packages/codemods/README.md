# @tour-kit/codemods

Codemods for migrating to Tour Kit from competing tour libraries. Ships as a
single `tour-kit-migrate` CLI plus reusable `jscodeshift` transforms for
**react-joyride**, **shepherd.js**, and **driver.js**.

## Install

```bash
pnpm add -D @tour-kit/codemods
# or: npm install -D @tour-kit/codemods
# or: bun add -D @tour-kit/codemods
```

## Usage

```bash
# Joyride
npx tour-kit-migrate --from joyride --dry-run ./src
npx tour-kit-migrate --from joyride ./src

# Shepherd.js
npx tour-kit-migrate --from shepherd --dry-run ./src
npx tour-kit-migrate --from shepherd ./src

# Driver.js
npx tour-kit-migrate --from driver --dry-run ./src
npx tour-kit-migrate --from driver ./src

# Pipe transformed source to stdout
npx tour-kit-migrate --from joyride --print ./src/MyTour.tsx
```

### Flags

| Flag                  | Default          | Meaning                                        |
| --------------------- | ---------------- | ---------------------------------------------- |
| `--from <source>`     | required         | `joyride` \| `shepherd` \| `driver`            |
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

## Coverage status

Fixture-corpus coverage from the parametrized `fixture-runner.test.ts`. Numbers
reflect the percentage of committed fixtures where the transform output
matches the expected output AND passes `tsc --noEmit` against the stub types.

| Source           | Coverage | Status |
| ---------------- | -------- | ------ |
| `joyride`        | 100%     | stable |
| `shepherd`       | 100%     | stable |
| `driver`         | 100%     | stable |

When a transform's coverage drops below 80%, it is added to the
`EXPERIMENTAL_TRANSFORMS` set in `src/cli.ts` and the CLI prints a one-line
warning to stderr the first time `--from <source>` is invoked:

```
[Tour Kit] <source> transform is experimental. Coverage: <pct>%. Review TODOs carefully.
```

## What gets migrated

### Joyride (`--from joyride`)

| Pattern                                           | Migrated                                                  |
| ------------------------------------------------- | --------------------------------------------------------- |
| `import Joyride from 'react-joyride'`             | `import { TourProvider } from '@tour-kit/react'`          |
| `import { useJoyride } from 'react-joyride'`      | `import { useTour } from '@tour-kit/react'`               |
| `<Joyride steps={...} ... />`                     | `<TourProvider tours={[{ id: 'migrated-tour', steps }]} />` |
| `const { Tour, controls } = useJoyride({steps})`  | `const controls = useTour()` + TODO to register the tour  |
| `<Tour />`                                        | `null` + TODO to render via `<TourProvider>` ancestor     |

Every Joyride-only pattern (callback, run, stepIndex, showProgress,
showSkipButton, continuous, Step.styles, Step.tooltipComponent, …) is preserved
with a `// TODO:` comment linking to a heading in the
[migration guide](https://usertourkit.com/docs/migration/joyride).

### Shepherd.js (`--from shepherd`)

| Pattern                                  | Migrated                                                        |
| ---------------------------------------- | --------------------------------------------------------------- |
| `import Shepherd from 'shepherd.js'`     | `import { TourProvider } from '@tour-kit/react'`                |
| `import { Tour } from 'shepherd.js'`     | `import { TourProvider } from '@tour-kit/react'`                |
| `new Shepherd.Tour({...})`               | `{ id: 'migrated-tour', steps: [...] }` literal + TODO          |
| `.addStep({...})` chain                  | merged into the `steps: [...]` array                            |
| `Step.attachTo.element` (selector)       | `target` field                                                  |
| `Step.attachTo.on` (placement)           | `placement` field                                               |
| `tour.start()` / `.cancel()` / etc.      | empty statements + TODO pointing at `useTour()`                 |

Every Shepherd-only pattern (buttons, classes, beforeShowPromise, advanceOn,
scrollTo, …) is preserved with a `// TODO:` comment linking to the
[migration guide](https://usertourkit.com/docs/migration/shepherd).

### Driver.js (`--from driver`)

| Pattern                                  | Migrated                                                        |
| ---------------------------------------- | --------------------------------------------------------------- |
| `import { driver } from 'driver.js'`     | `import { TourProvider } from '@tour-kit/react'`                |
| `driver({ steps: [...] })`               | `{ id: 'migrated-tour', steps: [...] }` literal + TODO          |
| `Step.element` (selector)                | `target` field                                                  |
| `Step.element` (DOM Element)             | `target: el` + TODO                                             |
| `popover.title` / `description` / `side` | `title` / `content` / `placement`                               |
| `d.drive()` / `.destroy()` / `.moveNext` | empty statements + TODO pointing at `useTour()`                 |

Every driver-only pattern (showProgress, allowClose, button-label overrides,
onHighlightStarted, popoverClass, …) is preserved with a `// TODO:` comment
linking to the [migration guide](https://usertourkit.com/docs/migration/driver).

## What doesn't migrate

The codemod is conservative — it does NOT synthesize helper components,
refactor callback dispatchers, or move tour registration to the right ancestor.
A transform that mangles user code is worse than no transform. Patterns the
codemod can't handle are surfaced as `// TODO:` comments so the user can hand
port — never silently dropped.

See the per-source migration guides for the supported patterns and the
manual-port path for everything else:

- [Joyride migration guide](https://usertourkit.com/docs/migration/joyride)
- [Shepherd.js migration guide](https://usertourkit.com/docs/migration/shepherd)
- [Driver.js migration guide](https://usertourkit.com/docs/migration/driver)

## License

MIT
