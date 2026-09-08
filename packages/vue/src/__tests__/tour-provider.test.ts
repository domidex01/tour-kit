import type { CreateTourEngineOptions, Tour, TourEngine } from '@tour-kit/core/engine'
import { mount } from '@vue/test-utils'
/**
 * `<TourProvider>` is two lines over `provideTourKit`, and the two lines that
 * matter are: props are the option bag, and the getter keeps them reactive.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, onMounted } from 'vue'
import { useTour } from '../provide-tour-kit'
import { TourProvider } from '../tour-provider'

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

const tours: Tour[] = [{ id: 'provider-tour', steps: [{ id: 's1', target: '#a', content: 'one' }] }]

const Child = defineComponent({
  setup() {
    const t = useTour()
    onMounted(() => {
      void t.start('provider-tour')
    })
    return () => h('div', { 'data-testid': 'out' }, String(t.state.value.isActive))
  },
})

beforeEach(() => engineBuilds.mockClear())

describe('<TourProvider>', () => {
  it('provides a kit to its slot and renders the slot content', async () => {
    const wrapper = mount(TourProvider, {
      props: { tours },
      slots: { default: () => h(Child) },
    })

    await vi.waitFor(() => expect(wrapper.get('[data-testid="out"]').text()).toBe('true'))
    expect(engineBuilds).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    await Promise.resolve()
  })

  it('a prop change reaches the engine without a rebuild', async () => {
    const wrapper = mount(TourProvider, {
      props: { tours, autoNavigate: false },
      slots: { default: () => h('span', 'x') },
    })
    await nextTick()
    expect(engineBuilds).toHaveBeenCalledTimes(1)
    expect(engineBuilds.mock.calls[0]?.[0]).toMatchObject({ autoNavigate: false })

    await wrapper.setProps({ autoNavigate: true })
    await nextTick()

    expect(engineBuilds).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    await Promise.resolve()
  })

  it('renders nothing when no slot is given', async () => {
    const wrapper = mount(TourProvider, { props: { tours } })
    await nextTick()
    expect(wrapper.html()).toBe('')
    wrapper.unmount()
    await Promise.resolve()
  })
})
