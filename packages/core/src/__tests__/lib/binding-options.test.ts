/**
 * v2 §1.5f — the option splits all three bindings share.
 *
 * These were duplicated in `tour-provider.tsx`, `@tour-kit/vue` and
 * `@tour-kit/svelte`; `engineOptionsFrom` was byte-identical in the two
 * bindings. The risk the copies carried was silent: a new
 * `CreateTourEngineOptions` field gets threaded through one list and not the
 * others, and nothing fails.
 */
import { describe, expect, it } from 'vitest'
import {
  type BindingOptions,
  engineOptionsFrom,
  liveOptionsFrom,
} from '../../lib/tour-engine/binding-options'

const base: BindingOptions = {
  tours: [{ id: 't', steps: [{ id: 's', target: '#a', content: 'hi' }] }],
}

describe('engineOptionsFrom', () => {
  it('carries persistence and routePersistence, which liveOptionsFrom must not', () => {
    // The whole reason there are two splits: the engine builds four storage
    // adapters from these at construction and they hold pending throttled
    // writes, so they are read once and never pushed.
    const src: BindingOptions = {
      ...base,
      persistence: { enabled: true },
      routePersistence: { enabled: true },
    }

    expect(engineOptionsFrom(src)).toMatchObject({
      persistence: { enabled: true },
      routePersistence: { enabled: true },
    })
    expect(liveOptionsFrom(src)).not.toHaveProperty('persistence')
    expect(liveOptionsFrom(src)).not.toHaveProperty('routePersistence')
  })

  it('drops the binding-only keys the engine has no field for', () => {
    const built = engineOptionsFrom({ ...base, keyboard: false, enableTestBridge: true })

    expect(built).not.toHaveProperty('keyboard')
    expect(built).not.toHaveProperty('enableTestBridge')
    expect(built.tours).toHaveLength(1)
  })

  it('normalises a null analytics to undefined', () => {
    // The React provider passes its context value straight through, and that is
    // `null` outside a `<TourKitProvider>`; the engine option is optional, not
    // nullable.
    const src = { ...base, analytics: null } as unknown as BindingOptions

    expect(engineOptionsFrom(src).analytics).toBeUndefined()
    expect(liveOptionsFrom(src).analytics).toBeUndefined()
  })
})

describe('liveOptionsFrom', () => {
  it('carries exactly the six live keys', () => {
    const noop = () => {}
    const live = liveOptionsFrom({
      ...base,
      router: undefined,
      autoNavigate: true,
      onNavigationRequired: noop,
      onStepError: noop,
      onTourPaused: noop,
    })

    // Pinned as a set: `TourEngineLiveOptions` is a `Pick` over
    // `CreateTourEngineOptions`, so a new live option that nobody adds here
    // would be pushed by no binding at all.
    expect(Object.keys(live).sort()).toEqual([
      'analytics',
      'autoNavigate',
      'onNavigationRequired',
      'onStepError',
      'onTourPaused',
      'router',
    ])
  })
})
