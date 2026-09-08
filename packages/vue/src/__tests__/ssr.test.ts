import type { CreateTourEngineOptions, Tour, TourEngine } from '@tour-kit/core/engine'
// @vitest-environment node
/**
 * The Nuxt story. `// @vitest-environment node` is FILE-SCOPED, which is why
 * this is its own file: one node case inside a jsdom file silently runs under
 * jsdom and proves nothing.
 *
 * `setup()` runs on the server. `createTourEngine` touches `tourRegistry`,
 * builds four storage adapters and opens a `BroadcastChannel`; none of that may
 * happen there. The handle is inert until the first verb, and `getState()`
 * returns `INITIAL_SNAPSHOT` until then — so a server render must build zero
 * engines and render the initial values.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { provideTourKit, useTour } from '../provide-tour-kit'

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

const tour: Tour = {
  id: 'ssr-tour',
  steps: [{ id: 's1', target: '#a', content: 'one' }],
}

describe('SSR', () => {
  beforeEach(() => engineBuilds.mockClear())

  it('renderToString builds no engine and renders INITIAL_SNAPSHOT', async () => {
    const Child = defineComponent({
      setup() {
        const t = useTour()
        return () =>
          h('div', { id: 'out' }, `${t.state.value.isActive}|${t.state.value.currentStepIndex}`)
      },
    })
    const App = defineComponent({
      setup() {
        provideTourKit(() => ({ tours: [tour] }))
        return () => h(Child)
      },
    })

    const html = await renderToString(createSSRApp(App))

    expect(engineBuilds).toHaveBeenCalledTimes(0)
    expect(html).toContain('false|0')
  })

  it('there is no window or document to have touched', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })
})
