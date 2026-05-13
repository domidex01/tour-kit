# shepherd.js → Tour Kit coverage matrix

The Shepherd transform reconstitutes the class-chain imperative API
(`new Shepherd.Tour({...})` + `.addStep({...})` + `.start()`) into a single
Tour Kit-shaped object literal. It runs over `.ts` / `.tsx` files matched by
`tour-kit-migrate --from shepherd`.

## Supported patterns (✓)

| Pattern | shepherd.js | Tour Kit |
| --- | --- | --- |
| Default import | `import Shepherd from 'shepherd.js'` | `import { TourProvider } from '@tour-kit/react'` |
| Named import | `import { Tour } from 'shepherd.js'` | `import { TourProvider } from '@tour-kit/react'` |
| Tour constructor | `new Shepherd.Tour({...})` / `new Tour({...})` | `{ id: 'migrated-tour', steps: [...] }` |
| addStep chain | `tour.addStep({...})` (any depth) | merged into the `steps: [...]` array |
| `attachTo.element` (selector) | `'#cta'` | `target: '#cta'` |
| `attachTo.on` | `top` / `bottom` / `left` / `right` (+ start/end) | identical |
| `Step.text` | `'Welcome'` | `content: 'Welcome'` |
| `Step.title` | `'Hi'` | `title: 'Hi'` |
| `Step.id` | `'step-1'` | `id: 'step-1'` |

## Unsupported patterns (✗, emit `// TODO:`)

Every unsupported pattern emits a TODO comment that links to the matching
heading in `apps/docs/content/docs/migration/shepherd.mdx`. Headings exist
for:

| Anchor | Why unsupported |
| --- | --- |
| `tour-constructor` | `new Shepherd.Tour({...})` has no runtime mapping — register the migrated literal at `<TourProvider>` |
| `add-step-dynamic` | `.addStep(someVariable)` — can't inline a dynamic step shape |
| `attach-to-dynamic` | `attachTo` was not an inline object literal |
| `attach-to-element-function` | `attachTo.element` returned an element from a function |
| `target` | Could not resolve `attachTo.element` to a selector |
| `target-dynamic` | Dynamic identifier preserved — verify it resolves |
| `placement` | `attachTo.on: 'auto'` mapped to `'top'` |
| `start` | `tour.start()` removed — call `useTour().start()` from a descendant |
| `control-flow` | `.show()` / `.hide()` / `.cancel()` / `.complete()` / `.next()` / `.back()` removed |
| `buttons` | `Step.buttons` array — Tour Kit has fixed Next/Prev/Skip slots |
| `classes` | `Step.classes` — Tour Kit uses theme tokens |
| `modal-overlay-class` | `Step.modalOverlayOpeningClass` → `<TourOverlay />` slot |
| `modal-overlay-padding` | `Step.modalOverlayOpeningPadding` → `<TourOverlay />` slot |
| `can-click-target` | Configure the overlay spotlight interactive flag |
| `scroll-to` | `Step.scrollTo` / `scrollToHandler` — Tour Kit auto-scrolls |
| `highlight-class` | `Step.highlightClass` — theme tokens via `<ThemeProvider>` |
| `when` | `Step.when` lifecycle hooks → `onShow` / `onHide` |
| `advance-on` | `Step.advanceOn` — wire `useTour().next()` manually |
| `before-show-promise` | `Step.beforeShowPromise` — await before `goTo()` or use `onShow` |
| `show-on` | `Step.showOn` predicate — branch on `useTour().currentStepIndex` |
| `unknown-step-field` | A `Step.*` field not in this matrix |
