import type { CreateTourEngineOptions, Tour, TourEngine } from '@tour-kit/core/engine'
import { mount } from '@vue/test-utils'
/**
 * The lifecycle cases — construction MOMENT, not just count.
 *
 * `provideTourKit` in `setup()` must construct nothing. Every kit member except
 * `state` is `ensure()` in disguise, so an immediate watcher (or the
 * `watchEffect` an earlier draft of the plan had) would build an engine inside
 * `setup()` — on Nuxt, that is registry writes, four storage adapters and a
 * `BroadcastChannel` on the server.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type PropType, defineComponent, h, nextTick, onMounted } from 'vue'
import type { TourKit } from '../create-tour-kit'
import { type TourKitOptions, provideTourKit, useTour } from '../provide-tour-kit'

/**
 * The oracle: how many engines were built, and when.
 *
 * NOT a counted options getter — `provideTourKit` takes a `MaybeRefOrGetter`
 * and `toValue`s it on every watcher evaluation, every `validateTour` pass and
 * every `ensure()`, so the getter is read many times per engine by design.
 * Wrapping `createTourEngine` itself counts constructions exactly, with the
 * real engine underneath.
 */
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

function harness(options: TourKitOptions, slot?: () => unknown) {
  return defineComponent({
    setup(_props, { slots }) {
      provideTourKit(() => options)
      return () => (slot ? slot() : slots.default?.())
    },
  })
}

beforeEach(() => {
  engineBuilds.mockClear()
})

afterEach(() => {
  document.body.innerHTML = ''
  // biome-ignore lint/performance/noDelete: the test bridge writes a real global
  delete (window as unknown as Record<string, unknown>).__tourKit__
})

describe('provideTourKit — lifecycle', () => {
  it('constructs nothing during setup()', async () => {
    // The count is read INSIDE setup(), not after `mount()` returns: Vue runs
    // `onMounted` synchronously at the end of the initial render, so by the
    // time `mount()` hands back, the provider's own boot has legitimately
    // built one. The regression this pins is one built EARLIER than that —
    // which is what an immediate `watch`, or the `watchEffect` the first draft
    // of the plan had, would do, because every verb is `ensure()` in disguise
    // and `setOptions` is a verb. On Nuxt that is registry writes, four
    // storage adapters and a `BroadcastChannel` on the server.
    let duringSetup = -1
    const Harness = defineComponent({
      setup() {
        provideTourKit(() => ({ tours: [tour('vue-setup-inert')] }))
        duringSetup = engineBuilds.mock.calls.length
        return () => h('div')
      },
    })

    const wrapper = mount(Harness)

    expect(duringSetup).toBe(0)
    expect(engineBuilds).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    await Promise.resolve()
  })

  it("a child's onMounted verb — which fires BEFORE the provider's — builds exactly one engine", async () => {
    const Child = defineComponent({
      setup() {
        const t = useTour()
        onMounted(() => {
          void t.start('vue-child-start')
        })
        return () => h('div', { 'data-testid': 'child' }, String(t.state.value.isActive))
      },
    })
    const wrapper = mount(harness({ tours: [tour('vue-child-start')] }, () => h(Child)))

    await vi.waitFor(() => expect(wrapper.get('[data-testid="child"]').text()).toBe('true'))

    expect(engineBuilds).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    await Promise.resolve()
  })

  it('a live prop change re-pushes setOptions without a second construction', async () => {
    const tours = [tour('vue-live-props')]
    const Harness = defineComponent({
      props: { autoNavigate: { type: Boolean, default: false } },
      setup(props) {
        const kit = provideTourKit(() => ({ tours, autoNavigate: props.autoNavigate }))
        return () => h('div', {}, String(kit.state.value.isActive))
      },
    })
    const wrapper = mount(Harness, { props: { autoNavigate: false } })
    await nextTick()
    expect(engineBuilds).toHaveBeenCalledTimes(1)
    expect(engineBuilds.mock.calls[0]?.[0]).toMatchObject({ autoNavigate: false })

    await wrapper.setProps({ autoNavigate: true })
    await nextTick()

    // The watcher pushed the change through `setOptions`, which is a verb —
    // and a verb on a live handle must NOT build a second engine.
    expect(engineBuilds).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    await Promise.resolve()
  })

  it('setTours pushes a new tour list without rebuilding the engine', async () => {
    const held: { kit?: TourKit } = {}
    const Harness = defineComponent({
      props: { tours: { type: Array as PropType<Tour[]>, required: true } },
      setup(props) {
        held.kit = provideTourKit(() => ({ tours: props.tours as Tour[] }))
        return () => h('div', {}, String(held.kit?.state.value.isActive))
      },
    })
    const wrapper = mount(Harness, { props: { tours: [tour('vue-set-tours-a')] } })
    await nextTick()
    expect(engineBuilds).toHaveBeenCalledTimes(1)

    await wrapper.setProps({ tours: [tour('vue-set-tours-a'), tour('vue-set-tours-b')] })
    await nextTick()

    expect(engineBuilds).toHaveBeenCalledTimes(1)
    // And the new tour is really reachable through the same engine.
    await held.kit?.start('vue-set-tours-b')
    expect(held.kit?.state.value.isActive).toBe(true)

    wrapper.unmount()
    await Promise.resolve()
  })

  it('keyboard is on by default: Escape ends the tour', async () => {
    const held: { kit?: TourKit } = {}
    const Harness = defineComponent({
      setup() {
        held.kit = provideTourKit(() => ({ tours: [tour('vue-keyboard-on')] }))
        return () => h('div')
      },
    })
    const wrapper = mount(Harness)
    await nextTick()

    await held.kit?.start('vue-keyboard-on')
    expect(held.kit?.state.value.isActive).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()

    // Escape maps to skip(), not stop() — which is why the e2e case that
    // presses it needs its own browser context.
    expect(held.kit?.state.value.isActive).toBe(false)

    wrapper.unmount()
    await Promise.resolve()
  })

  it('keyboard: false opts out', async () => {
    const held: { kit?: TourKit } = {}
    const Harness = defineComponent({
      setup() {
        held.kit = provideTourKit(() => ({ tours: [tour('vue-keyboard-off')], keyboard: false }))
        return () => h('div')
      },
    })
    const wrapper = mount(Harness)
    await nextTick()

    await held.kit?.start('vue-keyboard-off')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()

    expect(held.kit?.state.value.isActive).toBe(true)

    wrapper.unmount()
    await Promise.resolve()
  })

  it('enableTestBridge installs window.__tourKit__ and unmount removes it', async () => {
    const wrapper = mount(harness({ tours: [tour('vue-bridge')], enableTestBridge: true }))
    await nextTick()

    expect((window as unknown as Record<string, unknown>).__tourKit__).toBeDefined()

    wrapper.unmount()
    await Promise.resolve()

    expect((window as unknown as Record<string, unknown>).__tourKit__).toBeUndefined()
  })

  it('unmount releases the engine and detaches the keyboard listener', async () => {
    const held: { kit?: TourKit } = {}
    const Harness = defineComponent({
      setup() {
        held.kit = provideTourKit(() => ({ tours: [tour('vue-teardown')] }))
        return () => h('div')
      },
    })
    const wrapper = mount(Harness)
    await nextTick()
    await held.kit?.start('vue-teardown')
    expect(held.kit?.state.value.isActive).toBe(true)

    wrapper.unmount()
    await Promise.resolve()
    await Promise.resolve()

    // The engine is destroyed: the handle reports the initial snapshot again.
    expect(held.kit?.handle.getState().isActive).toBe(false)

    // And the keyboard listener is gone. A live listener would call a verb,
    // and a verb on a released handle builds engine #2 — which is what this
    // count catches.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await nextTick()
    expect(engineBuilds).toHaveBeenCalledTimes(1)
  })
})

describe('useTour', () => {
  it('throws outside a provider', () => {
    const Orphan = defineComponent({
      setup() {
        useTour()
        return () => h('div')
      },
    })
    expect(() => mount(Orphan)).toThrow(/within provideTourKit/)
  })
})
