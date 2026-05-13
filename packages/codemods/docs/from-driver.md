# driver.js → Tour Kit coverage matrix

The Driver transform reshapes `driver({...})` function-style configs into
Tour Kit tour literals. It runs over `.ts` / `.tsx` files matched by
`tour-kit-migrate --from driver`.

## Supported patterns (✓)

| Pattern | driver.js | Tour Kit |
| --- | --- | --- |
| Import | `import { driver } from 'driver.js'` | `import { TourProvider } from '@tour-kit/react'` |
| Config call | `driver({ steps: [...] })` | `{ id: 'migrated-tour', steps: [...] }` |
| `Step.element` (selector) | `'#hero'` | `target: '#hero'` |
| `Step.element` (DOM Element) | captured `el` | `target: el` + TODO |
| `popover.title` | `'Welcome'` | `title: 'Welcome'` |
| `popover.description` | `'Hi there'` | `content: 'Hi there'` |
| `popover.side` | `top` / `bottom` / `left` / `right` | identical |

## Unsupported patterns (✗, emit `// TODO:`)

Every unsupported pattern emits a TODO comment that links to the matching
heading in `apps/docs/content/docs/migration/driver.mdx`. Headings exist
for:

| Anchor | Why unsupported |
| --- | --- |
| `driver-call` | `driver({...})` has no runtime mapping — register the migrated literal at `<TourProvider>` |
| `driver-config-dynamic` | `driver(...)` argument was dynamic |
| `steps-dynamic` | `config.steps` was dynamic (not an inline array) |
| `step-dynamic` | A step inside `steps` was dynamic (not an inline object) |
| `element-function` | `Step.element` returned an element from a function |
| `element-dom` | `Step.element` is a captured DOM Element instance (preserved + TODO) |
| `target` | Could not resolve `Step.element` to a selector |
| `placement` | `popover.side: 'over'` mapped to `'top'` |
| `align` | `popover.align` folded into compound Tour Kit placements |
| `popover-dynamic` | `Step.popover` was not an inline object |
| `popover-class` | `popover.popoverClass` — theme tokens via `<ThemeProvider>` |
| `show-progress` | `showProgress` (tour or popover) → `<TourProgress />` slot |
| `allow-close` | `allowClose` — include / omit `<TourClose />` slot |
| `btn-text` | `doneBtnText` / `nextBtnText` / `prevBtnText` / `closeBtnText` → slot labels |
| `show-buttons` | `showButtons[]` → compose `<TourCard />` with only the slots you need |
| `disable-active-interaction` | Configure the spotlight interactive flag on `<TourOverlay />` |
| `smooth-scroll` | `smoothScroll` — Tour Kit always scrolls |
| `animate` | `animate` — Tour Kit respects `prefers-reduced-motion` automatically |
| `stage-padding` | `stagePadding` → pass `padding` to `<TourOverlay />` |
| `stage-radius` | `stageRadius` → theme tokens |
| `overlay-color` | `overlayColor` → theme tokens |
| `overlay-opacity` | `overlayOpacity` → theme tokens |
| `on-highlight-started` | `onHighlightStarted` / `onHighlighted` → `onShow` on the step |
| `on-highlighted` | Alias of `on-highlight-started` |
| `on-deselected` | `onDeselected` → `onHide` on the step |
| `on-popover-render` | `onPopoverRender` → custom JSX in `<TourCard />` children |
| `on-next-click` | `onNextClick` / `onPrevClick` / `onCloseClick` → slot handlers |
| `on-prev-click` | See `on-next-click` |
| `on-close-click` | See `on-next-click` |
| `on-click` | Generic on-click anchor for popover button handlers |
| `on-destroy-started` | `onDestroyStarted` → `<TourProvider onSkip / onComplete>` |
| `on-destroyed` | `onDestroyed` → `<TourProvider onSkip / onComplete>` |
| `drive` | `.drive()` removed — call `useTour().start()` from a descendant |
| `control-flow` | `.destroy()` / `.moveNext()` / `.movePrevious()` / `.moveTo()` removed |
| `highlight` | `.highlight()` — render `<HintHotspot>` from `@tour-kit/hints` |
| `unknown-config-field` | A tour-level config field not in this matrix |
| `unknown-popover-field` | A `popover.*` field not in this matrix |
| `unknown-step-field` | A `Step.*` field not in this matrix |
