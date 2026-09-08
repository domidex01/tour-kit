import { render } from '@testing-library/svelte'
/**
 * The same six lifecycle cases as the Vue binding, through a real mounted
 * component tree.
 *
 * The oracle is how many engines were built and WHEN — not a counted options
 * getter, which would be read many times per engine.
 */
import type { CreateTourEngineOptions, Tour, TourEngine } from '@tour-kit/core/engine'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import InitProbe from './fixtures/InitProbe.svelte'
import Orphan from './fixtures/Orphan.svelte'
import Provider from './fixtures/Provider.svelte'
import ProviderWithChild from './fixtures/ProviderWithChild.svelte'

const engineBuilds = vi.fn()

vi.mock('@tour-kit/core/engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tour-kit/core/engine')>()
  return {
    ...actual,
    createTourEngine: (options: CreateTourEngineOptions): TourEngine => {
      engineBuilds(options)
      return actual.createTourEngine({ ...options, storage: actual.createMemoryStorage() })
    },
  }
})

const tour = (id: string): Tour => ({
  id,
  steps: [
    { id: 's1', target: '#a', content: 'one' },
    { id: 's2', target: '#b', content: 'two' },
  ],
})

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => engineBuilds.mockClear())

afterEach(() => {
  document.body.innerHTML = ''
  // biome-ignore lint/performance/noDelete: the test bridge writes a real global
  delete (window as unknown as Record<string, unknown>).__tourKit__
})

describe('provideTourKit — lifecycle', () => {
  it('constructs nothing during component initialisation', async () => {
    // The count is taken while the `<script>` is still running: `provideTourKit`
    // itself must build nothing. `onMount` — which runs later — legitimately
    // does. Every kit member except `state` is `ensure()` in disguise, so a
    // `setOptions` call in the script would construct on SvelteKit's server.
    let duringInit = -1
    render(InitProbe, {
      props: {
        options: { tours: [tour('svelte-init-inert')] },
        onInit: () => {
          duringInit = engineBuilds.mock.calls.length
        },
      },
    })

    expect(duringInit).toBe(0)

    await tick()
    expect(engineBuilds).toHaveBeenCalledTimes(1)
  })

  it('mount boots exactly one engine', async () => {
    render(Provider, { props: { options: { tours: [tour('svelte-boot')] } } })
    await tick()

    expect(engineBuilds).toHaveBeenCalledTimes(1)
  })

  it("a child's onMount verb — which fires BEFORE the parent's — builds exactly one engine", async () => {
    const { getByTestId } = render(ProviderWithChild, {
      props: { options: { tours: [tour('svelte-child-start')] }, tourId: 'svelte-child-start' },
    })

    await vi.waitFor(() => expect(getByTestId('child').textContent).toBe('true'))
    expect(engineBuilds).toHaveBeenCalledTimes(1)
  })

  it('keyboard is on by default: Escape ends the tour', async () => {
    const { getByTestId } = render(ProviderWithChild, {
      props: { options: { tours: [tour('svelte-keyboard-on')] }, tourId: 'svelte-keyboard-on' },
    })
    await vi.waitFor(() => expect(getByTestId('child').textContent).toBe('true'))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    // Escape maps to skip(), not stop() — which is why the e2e case that
    // presses it needs its own browser context.
    await vi.waitFor(() => expect(getByTestId('child').textContent).toBe('false'))
  })

  it('keyboard: false opts out', async () => {
    const { getByTestId } = render(ProviderWithChild, {
      props: {
        options: { tours: [tour('svelte-keyboard-off')], keyboard: false },
        tourId: 'svelte-keyboard-off',
      },
    })
    await vi.waitFor(() => expect(getByTestId('child').textContent).toBe('true'))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await tick()

    expect(getByTestId('child').textContent).toBe('true')
  })

  it('enableTestBridge installs window.__tourKit__ and unmount removes it', async () => {
    const { unmount } = render(Provider, {
      props: { options: { tours: [tour('svelte-bridge')], enableTestBridge: true } },
    })
    await tick()

    expect((window as unknown as Record<string, unknown>).__tourKit__).toBeDefined()

    unmount()
    await Promise.resolve()

    expect((window as unknown as Record<string, unknown>).__tourKit__).toBeUndefined()
  })

  it('unmount releases the engine and detaches the keyboard listener', async () => {
    const { getByTestId, unmount } = render(ProviderWithChild, {
      props: { options: { tours: [tour('svelte-teardown')] }, tourId: 'svelte-teardown' },
    })
    await vi.waitFor(() => expect(getByTestId('child').textContent).toBe('true'))
    expect(engineBuilds).toHaveBeenCalledTimes(1)

    unmount()
    await Promise.resolve()
    await Promise.resolve()

    // The keyboard listener is gone. A live one would call a verb, and a verb
    // on a released handle builds engine #2 — which is what this count catches.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await tick()

    expect(engineBuilds).toHaveBeenCalledTimes(1)
  })
})

describe('getTour', () => {
  it('throws outside a provider', () => {
    expect(() => render(Orphan)).toThrow(/below provideTourKit/)
  })
})
