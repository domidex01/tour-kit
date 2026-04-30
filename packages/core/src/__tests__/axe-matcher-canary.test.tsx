import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'

describe('vitest-axe matcher (Phase 4 canary)', () => {
  it('toHaveNoViolations is wired up via vitest.setup.ts', async () => {
    const { container } = render(
      <main>
        <h1>Hello</h1>
        <button type="button" aria-label="Click me">
          +
        </button>
      </main>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
