# Phase 6 — `@tour-kit/testing-library` docs (G-2)

> **Goal:** `apps/docs/content/docs/testing-library/` does not exist; the
> package ships test helpers (12 source files, 6 test files) but consumers
> have no way to discover them.
>
> **Audit ID:** G-2 (HIGH).
> **Effort:** M (2 new MDX pages + nav).
> **Branch:** `sprint-1/phase-6-testing-library-docs`.
> **Bump:** docs only.
> **Independent.**

## 1. Pre-conditions

Read the public surface of the package before writing about it:

```bash
cat packages/testing-library/src/index.ts
ls packages/testing-library/src/helpers/
```

Verified exports (per audit + a fresh read):

- `setupTourKitTesting(options?)` — global setup helper
- `TourKitTestingError` — typed error
- `virtualTarget(rect?, contextElement?)` — create a Floating UI virtual reference
- `expectStepVisible(stepId, options?)` — assertion helper
- `advanceTour(options?)` — moves the tour to the next step
- `previousTour(options?)` — moves backward
- `skipTour(options?)` — skips the current tour
- `completeTour(tourId, options?)` — completes the named tour by clicking next/done until no next button remains
- `goToStep(stepId)` — jumps to an arbitrary step (requires `<HookProbe />`)
- `HookProbe`, `getActiveTourHandle` — escape hatch for direct hook access
- Re-exports from `@testing-library/react`: `render`, `screen`,
  `fireEvent`, `waitFor`, `act`, `cleanup`

Validated API caveats:

- `TourProvider` has no `defaultActiveTour` prop. Test examples must start a
  tour through `useTour().start(tourId)` or a tour-level `autoStart`.
- Visible tour UI does not render from `TourProvider` alone. Examples that use
  `expectStepVisible` must mount a real `<TourCard />` from `@tour-kit/react`.
- `virtualTarget()` returns a Floating UI virtual reference shape
  (`getBoundingClientRect`, optional `contextElement`), not
  `{ selector, element }`. Do not document it as a fake DOM selector helper.

## 2. File plan

| File                                                              | Purpose                          |
|-------------------------------------------------------------------|----------------------------------|
| `apps/docs/content/docs/testing-library/index.mdx`                | Overview + setup                 |
| `apps/docs/content/docs/testing-library/recipes.mdx`              | Copy-paste recipes               |
| `apps/docs/content/docs/testing-library/meta.json`                | Nav metadata                     |
| `apps/docs/content/docs/meta.json`                                | Edit: add `testing-library`      |

> Two pages is the minimum to be discoverable + useful. Per-helper API
> reference is intentionally NOT in Sprint 1 — deferred to G-3-class work
> in Sprint 2. The `index.mdx` covers the API list informally; that's enough.

## 3. Templates

### 3.1 `apps/docs/content/docs/testing-library/index.mdx`

```mdx
---
title: Testing Library
description: Tour Kit's test helpers for Vitest, Jest, and React Testing Library.
---

# Testing Library

`@tour-kit/testing-library` is a thin layer of test helpers on top of
[`@testing-library/react`](https://testing-library.com/docs/react-testing-library/intro/).
It exists so you can assert against tour state without reaching into
provider internals or scraping the DOM by hand.

## Install

```bash
pnpm add -D @tour-kit/testing-library @testing-library/react vitest
# or npm install --save-dev ...
```

## Setup

Call `setupTourKitTesting()` once in your test setup file (e.g.
`vitest.setup.ts`). It registers cleanup hooks and configures
`@testing-library/react` for tour-kit's portal layout.

```ts
// vitest.setup.ts
import { setupTourKitTesting } from '@tour-kit/testing-library/setup'

setupTourKitTesting()
```

> Use the `/setup` subpath to keep your setup file free of the RTL
> dependency graph until tests actually need it.

In `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

## Quick example

```tsx
import { describe, it, expect } from 'vitest'
import {
  render,
  expectStepVisible,
  advanceTour,
  HookProbe,
} from '@tour-kit/testing-library'
import { TourProvider, TourCard, useTour } from '@tour-kit/react'
import * as React from 'react'

const tours = [
  {
    id: 'demo',
    steps: [
      { id: 's1', target: '#a', content: 'First' },
      { id: 's2', target: '#b', content: 'Second' },
    ],
  },
]

function AutoStart({ tourId }: { tourId: string }) {
  const { start } = useTour()
  React.useEffect(() => {
    void start(tourId)
  }, [start, tourId])
  return null
}

describe('demo tour', () => {
  it('walks step 1 → step 2', async () => {
    render(
      <>
        <div id="a">A</div>
        <div id="b">B</div>
        <TourProvider tours={tours}>
          <AutoStart tourId="demo" />
          <TourCard />
          <HookProbe />
        </TourProvider>
      </>,
    )

    await expectStepVisible('s1')
    await advanceTour()
    await expectStepVisible('s2')
  })
})
```

The key bits:

- **`<TourCard />`** — renders the current visible step. `TourProvider`
  owns state but does not render a card by itself.
- **`<HookProbe />`** — mount this inside `<TourProvider>` so helpers like
  `goToStep` can reach the active tour handle.
- **`expectStepVisible(id)`** — waits for the step's card to render
  (handles portal mount delay) and asserts visibility.
- **`advanceTour()`** — synthetic equivalent of clicking "Next."
  Drives the same actions hook your UI uses.

## Available helpers

| Helper                          | Purpose                                          |
|---------------------------------|--------------------------------------------------|
| `setupTourKitTesting(opts?)`    | Global setup (call once in test setup file)      |
| `virtualTarget(rect?, contextElement?)` | Create a Floating UI virtual reference for low-level positioning tests |
| `expectStepVisible(id, opts?)`  | Wait + assert the step's card is visible         |
| `advanceTour(opts?)`            | Click-equivalent "Next"                          |
| `previousTour(opts?)`           | Click-equivalent "Back"                          |
| `skipTour(opts?)`               | Click-equivalent "Skip"                          |
| `completeTour(tourId, opts?)`   | Click-equivalent flow through the named tour until done |
| `goToStep(id)`                  | Jump to step `id` (requires `<HookProbe />`)     |
| `HookProbe`                     | Bridge component — mount inside `<TourProvider>` |
| `getActiveTourHandle()`         | Escape hatch — returns the live tour handle      |
| `TourKitTestingError`           | Typed error thrown by all helpers                |

Plus re-exported from `@testing-library/react` for convenience:
`render`, `screen`, `fireEvent`, `waitFor`, `act`, `cleanup`.

## Why these helpers?

Without them, you'd be:

- Polling for portal mount by reading from `document.body` directly.
- Calling `userEvent.click` on a button whose selector depends on
  Tour Kit's internal DOM (brittle).
- Reaching into the provider context with `useContext()` from a test
  helper component you wrote yourself.

The helpers normalize against the provider's actual state — if Tour Kit
changes how a step renders, the helpers update with it; your tests don't.

## See also

- [Recipes](/docs/testing-library/recipes) — copy-paste patterns for
  common test scenarios.
- [`TourProvider` reference](/docs/react/tour-provider)
```

### 3.2 `apps/docs/content/docs/testing-library/recipes.mdx`

```mdx
---
title: Recipes
description: Copy-paste test patterns for Tour Kit.
---

# Recipes

Patterns that come up over and over in tour testing. Copy, adapt, ship.

The snippets below assume this tiny harness:

```tsx
import { HookProbe, render } from '@tour-kit/testing-library'
import { TourProvider, TourCard, useTour, type TourConfig } from '@tour-kit/react'
import * as React from 'react'

function AutoStart({ tourId }: { tourId: string }) {
  const { start } = useTour()
  React.useEffect(() => {
    void start(tourId)
  }, [start, tourId])
  return null
}

function renderTour(tours: TourConfig[], tourId: string, targets: React.ReactNode = null) {
  return render(
    <>
      {targets}
      <TourProvider tours={tours}>
        <AutoStart tourId={tourId} />
        <TourCard />
        <HookProbe />
      </TourProvider>
    </>,
  )
}
```

## 1. Asserting that a tour starts on mount

```tsx
import { expectStepVisible } from '@tour-kit/testing-library'

it('autostarts the welcome tour', async () => {
  renderTour(
    [{ id: 'welcome', steps: [{ id: 'hi', target: '#hi', content: 'Hi' }] }],
    'welcome',
    <div id="hi" />,
  )

  await expectStepVisible('hi')
})
```

## 2. Driving a tour through every step

```tsx
import { render, advanceTour, completeTour, expectStepVisible, HookProbe } from '@tour-kit/testing-library'

it('walks step 1 → 2 → done', async () => {
  renderTour(tours, 'demo', <>
    <div id="a" />
    <div id="b" />
  </>)

  await expectStepVisible('s1')
  await advanceTour()
  await expectStepVisible('s2')
  await completeTour('demo')

  // Tour is done — no step should be visible:
  expect(document.querySelector('[data-tour-step]')).toBeNull()
})
```

## 3. Skipping mid-tour

```tsx
import { skipTour } from '@tour-kit/testing-library'

it('skip mid-tour invokes onSkip', async () => {
  const onSkip = vi.fn()
  renderTour([{ ...tours[0], onSkip }], 'demo')

  await skipTour()
  expect(onSkip).toHaveBeenCalledOnce()
})
```

## 4. Jumping to a non-adjacent step

`goToStep` requires the `<HookProbe />` because it needs direct access to
the tour handle.

```tsx
import { goToStep, expectStepVisible } from '@tour-kit/testing-library'

it('jumps from step 1 to step 5', async () => {
  renderTour(tours, 'long')

  await expectStepVisible('s1')
  await goToStep('s5')
  await expectStepVisible('s5')
})
```

## 5. Testing target positioning helpers

Use `virtualTarget` for low-level Floating UI positioning tests. It does not
create a selector-backed DOM element for `TourStep.target`; for full TourCard
tests, render a real DOM target or pass a ref/getter.

```tsx
import { virtualTarget } from '@tour-kit/testing-library'

it('creates a stable virtual rect', () => {
  const target = virtualTarget({ width: 320, height: 180 })
  expect(target.getBoundingClientRect().width).toBe(320)
})
```

## 6. Asserting against the active tour handle directly

For complex assertions, drop to the handle:

```tsx
import { getActiveTourHandle } from '@tour-kit/testing-library'

it('exposes step metadata via the handle', async () => {
  renderTour(tours, 'demo')

  const handle = getActiveTourHandle()
  expect(handle?.currentStep?.id).toBe('s1')
  expect(handle?.totalSteps).toBe(2)
})
```

## 7. Mocking storage between tests

Tour Kit persists progress to localStorage by default. If your tests
care about a fresh state per test, clear it in `beforeEach`:

```ts
import { beforeEach } from 'vitest'

beforeEach(() => {
  localStorage.clear()
})
```

Or pass an in-memory storage adapter to the provider — see
[`TourProvider` storage docs](/docs/react/tour-provider#storage).

## 8. Testing portal-rendered cards

Cards render into a portal mounted on `document.body`. The helpers handle
this for you, but if you bypass them and use `screen.getByText`, scope
your query to the portal root:

```tsx
import { within } from '@testing-library/react'

const text = within(document.body).getByText(/welcome/i)
expect(text).toBeVisible()
```
```

### 3.3 `apps/docs/content/docs/testing-library/meta.json`

```json
{
  "title": "Testing Library",
  "pages": [
    "index",
    "recipes"
  ]
}
```

### 3.4 Edit `apps/docs/content/docs/meta.json`

Insert `testing-library` next to `codemods` under `---Resources---`:

```diff
     "---Resources---",
     "guides",
     "examples",
     "migration",
     "codemods",
+    "testing-library",
     "api",
     "troubleshooting",
```

## 4. Validation

### 4.1 Recipes must compile

The recipes in `recipes.mdx` are NOT in a test file — they're inline. To
validate they're real:

1. Pick one (recipe #1 or #2 is simplest).
2. Drop it into a scratch test inside `packages/testing-library/src/__tests__/`.
3. Run `pnpm --filter @tour-kit/testing-library test`.
4. If it passes, the recipe is correct. Delete the scratch test before
   committing.

Do this for **at least two** recipes — the cost is 5 minutes and it
saves you the embarrassment of shipping broken sample code.

### 4.2 Docs build

```bash
pnpm --filter @tour-kit/docs dev
# Open http://localhost:3000/docs/testing-library
# Click through both pages.
```

### 4.3 No package code changed

```bash
git diff --stat -- packages/
```

Should be empty.

## 5. Commit + PR

```bash
git checkout -b sprint-1/phase-6-testing-library-docs

git add apps/docs/content/docs/testing-library/ \
        apps/docs/content/docs/meta.json

git commit -m "$(cat <<'EOF'
docs(testing-library): add index + recipes pages

@tour-kit/testing-library shipped 12 source files (helpers, probe,
re-exports) but had zero docs pages. Adds an overview/setup page and a
copy-paste recipes page covering the most common test scenarios.

No package code changed. Recipes validated against the package's actual
test fixtures.

Refs: audit G-2.
EOF
)"

git push -u origin sprint-1/phase-6-testing-library-docs

gh pr create --title "docs(testing-library): add index + recipes (G-2)" --body "$(cat <<'EOF'
## Summary
- New `apps/docs/content/docs/testing-library/` subtree with `index.mdx` + `recipes.mdx`.
- Documents the package's 10 exported helpers, the `<HookProbe />` bridge, and `setupTourKitTesting`.
- 8 copy-paste recipes for common test scenarios.
- Nav wired in `apps/docs/content/docs/meta.json`.

## Test plan
- [ ] `pnpm --filter @tour-kit/docs dev` shows new nav entry.
- [ ] Both MDX pages render.
- [ ] At least 2 recipes verified by running them as actual tests in
      `packages/testing-library/src/__tests__/` (scratch tests removed before commit).

Refs: audit G-2.
EOF
)"
```

## 6. Acceptance gates

- [ ] `apps/docs/content/docs/testing-library/index.mdx` exists.
- [ ] `apps/docs/content/docs/testing-library/recipes.mdx` exists.
- [ ] `apps/docs/content/docs/testing-library/meta.json` exists.
- [ ] `apps/docs/content/docs/meta.json` lists `testing-library` under Resources.
- [ ] At least 2 recipes verified by ad-hoc test runs.
- [ ] `pnpm --filter @tour-kit/docs build` (or `dev`) renders the pages.
- [ ] No package code touched.

## 7. Rollback

```bash
git revert <merge-commit-sha>
git push origin main
```

---

**Next:** [phase-7-bundle-size-ci.md](phase-7-bundle-size-ci.md)
