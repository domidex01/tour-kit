// @vitest-environment node
/**
 * The SvelteKit story. `// @vitest-environment node` is FILE-SCOPED, which is
 * why this is its own file: one node case inside a jsdom file silently runs
 * under jsdom and proves nothing.
 *
 * A component `<script>` runs on the server. `createTourEngine` touches
 * `tourRegistry`, builds four storage adapters and opens a `BroadcastChannel`;
 * none of that may happen there. `onMount` does not run on the server, and the
 * handle is inert until the first verb, so a server render builds zero engines
 * and renders `INITIAL_SNAPSHOT`.
 */
import type { CreateTourEngineOptions, Tour, TourEngine } from '@tour-kit/core/engine'
import { render } from 'svelte/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Provider from './fixtures/Provider.svelte'

const engineBuilds = vi.fn()

vi.mock('@tour-kit/core/engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tour-kit/core/engine')>()
  return {
    ...actual,
    createTourEngine: (options: CreateTourEngineOptions): TourEngine => {
      engineBuilds(options)
      return actual.createTourEngine(options)
    },
  }
})

const tour: Tour = { id: 'ssr-tour', steps: [{ id: 's1', target: '#a', content: 'one' }] }

describe('SSR', () => {
  beforeEach(() => engineBuilds.mockClear())

  it('svelte/server render builds no engine and renders INITIAL_SNAPSHOT', () => {
    const { body } = render(Provider, { props: { options: { tours: [tour] } } })

    expect(engineBuilds).toHaveBeenCalledTimes(0)
    // The fixture prints `kit.state.isActive`.
    expect(body).toContain('false')
  })

  it('there is no window or document to have touched', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })
})
