---
title: "Unit testing Tour Kit components with Vitest"
slug: "unit-testing-tour-kit-components-vitest"
canonical: https://usertourkit.com/blog/unit-testing-tour-kit-components-vitest
tags: react, javascript, testing, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/unit-testing-tour-kit-components-vitest)*

# Unit testing Tour Kit components with Vitest

Product tour components are tricky to test. They rely on context providers, DOM positioning, keyboard navigation, and accessibility attributes that most component tests never touch. Skip testing and you'll ship a tour that works in your browser but breaks under screen readers or silently loses progress.

Vitest and React Testing Library make this manageable. Vitest cold-starts in roughly 200ms compared to Jest's 2-4 seconds, and watch mode re-runs a single file change in about 380ms ([Better Stack, 2025](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/)). That speed matters when you're iterating on tour behavior.

By the end of this tutorial, you'll have a working test suite covering Tour Kit's providers, hooks, components, and accessibility requirements.

> The full article with all code examples, troubleshooting section, and FAQ is at the canonical URL above. Key sections below.

## The key pattern: renderWithProviders

Tour Kit components need `TourProvider` and `TourKitProvider` wrapping them. Build a reusable utility instead of copy-pasting provider trees:

```tsx
// src/test/render-with-providers.tsx
import { render, type RenderOptions } from '@testing-library/react'
import { TourProvider, TourKitProvider, createTour, createStep } from '@tour-kit/react'
import type { Tour, TourKitConfig } from '@tour-kit/react'
import type { ReactElement } from 'react'

const defaultSteps = [
  createStep({ id: 'step-1', target: '#welcome', title: 'Welcome', content: 'First step' }),
  createStep({ id: 'step-2', target: '#features', title: 'Features', content: 'Second step' }),
]

const defaultTour: Tour = createTour({ id: 'test-tour', steps: defaultSteps })

export function renderWithProviders(
  ui: ReactElement,
  { tour = defaultTour, initialOpen = true, ...renderOptions } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <TourKitProvider>
        <TourProvider tour={tour} initialOpen={initialOpen}>
          {children}
        </TourProvider>
      </TourKitProvider>
    )
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
```

This follows [React Testing Library's recommendation](https://testing-library.com/docs/example-react-context/) — wrap in real providers, don't mock context.

## Testing accessibility with vitest-axe

```tsx
import { axe, toHaveNoViolations } from 'vitest-axe'

expect.extend(toHaveNoViolations)

it('passes automated axe checks', async () => {
  const { container } = renderWithProviders(<AccessibleTourCard />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})

it('closes the tour on Escape key', async () => {
  const user = userEvent.setup()
  renderWithProviders(<AccessibleTourCard />)
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
```

As of April 2026, axe-core catches up to 57% of WCAG issues automatically. Combine with explicit ARIA assertions for higher coverage.

Read the full tutorial with all 6 steps, troubleshooting, and FAQ: [usertourkit.com/blog/unit-testing-tour-kit-components-vitest](https://usertourkit.com/blog/unit-testing-tour-kit-components-vitest)
