# Joyride → Tour Kit coverage matrix

The Joyride transform covers BOTH coexisting v2 APIs (memory #181, confirmed
2026-05-12): the legacy `<Joyride>` JSX form and the modern `useJoyride()` hook
form.

## Supported patterns (✓)

| Pattern                                           | Joyride                                          | Tour Kit                                                  |
| ------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| Default import                                    | `import Joyride from 'react-joyride'`            | `import { TourProvider } from '@tour-kit/react'`          |
| Hook import                                       | `import { useJoyride } from 'react-joyride'`     | `import { useTour } from '@tour-kit/react'`               |
| JSX root element                                  | `<Joyride steps={steps} ... />`                  | `<TourProvider tours={[{ id, steps }]} />`                |
| Hook destructure                                  | `const { Tour, controls } = useJoyride({...})`   | `const controls = useTour()` + TODO                       |
| Inline `<Tour />` JSX                             | `<Tour />`                                       | `null` + TODO to render via `<TourProvider>` ancestor     |
| `Step.target` (string selector)                   | `'#hero'`                                        | `target: '#hero'`                                         |
| `Step.placement` (top/bottom/left/right + start/end variants) | `'top'`, `'top-start'`, ...                      | identical                                                  |
| `Step.id` / `Step.data`                           | `id: 'step-1'`                                   | `id: 'step-1'`                                            |

## Unsupported patterns (✗, emit `// TODO:`)

Every unsupported pattern emits a TODO comment that links to the matching
heading in `apps/docs/content/docs/migration/joyride.mdx`. Headings exist for:

| Anchor                  | Why unsupported                                                          |
| ----------------------- | ------------------------------------------------------------------------ |
| `run-prop`              | Tour Kit is imperative; call `useTour().start()`                         |
| `continuous`            | Default behaviour in Tour Kit                                            |
| `show-progress`         | Render `<TourProgress />` inside `<TourCard />`                          |
| `show-skip-button`      | Render `<TourClose />` inside `<TourCard />`                             |
| `step-index`            | Tour Kit owns step index; use `useTour().goTo()`                         |
| `callback`              | Splits into `onTourEnd` / `onTourSkip` / `onStepAdvance`                 |
| `use-joyride-hook`      | Move tour registration to a `<TourProvider>` ancestor                    |
| `controls-api`          | `controls.previous()` → `useTour().prev()` (rename); other names ≈ 1:1  |
| `tour-component`        | No inline `<Tour />` — use `<TourProvider>` + `<TourCard />` ancestor    |
| `callbackprops`         | `CallBackProps` type has no Tour Kit equivalent (split handlers)         |
| `eventdata`             | `EventData` type has no Tour Kit equivalent                              |
| `actions` / `status`    | Joyride enums have no Tour Kit equivalent (handlers are pre-split)       |
| `target-function`       | Tour Kit `target` accepts string selector or DOM ref, not a function     |
| `target-dynamic`        | Dynamic identifier preserved; verify it resolves to a string             |
| `placement`             | `auto` / `center` map to `top`; review manually                          |
| `beacon`                | Joyride beacon → Tour Kit has none (no migration needed)                 |
| `styles`                | Joyride inline-style object → Tour Kit theme tokens                      |
| `tooltip-component`     | Use `<TourCard />` headless slots                                        |
| `beacon-component`      | No beacon in Tour Kit                                                    |
| `spotlight-target`      | Tour Kit spotlight is anchored to `target`                               |
| `spotlight-clicks`      | Configure via `<TourOverlay />` slot                                     |
| `spotlight-padding`     | Numeric value on overlay slot                                            |
| `scroll-target`         | Auto-detected in Tour Kit                                                |
| `is-fixed`              | Tour Kit always uses Floating UI                                         |
| `portal-element`        | `<TourPortal container>`                                                 |
| `disable-overlay`       | Omit `<TourOverlay />`                                                   |
| `disable-scrolling`     | Gate manually                                                            |
| `hide-close-button`     | Omit `<TourClose />`                                                     |
| `hide-footer`           | Omit `<TourCardFooter />`                                                |
| `hide-back-button`      | Omit prev from `<TourNavigation />`                                      |
| `locale`                | Per-slot label props                                                     |
| `debug`                 | `<TourProvider diagnose>`                                                |
| `disablecloseonesc`     | Override via headless slot `onKeyDown`                                   |
| `unknown-step-field`    | Field not in this matrix; check Joyride v2 docs                          |
| `unknown-jsx-prop`      | Prop not in this matrix; check Joyride v2 docs                           |
| `jsx-spread`            | `<Joyride {...props} />` — verify props manually                         |
