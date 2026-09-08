/**
 * v2 §1.3b — `createFlowSession` against an injected `createMemoryStorage()`.
 *
 * The hydration contract is the reason this file exists. `use-flow-session.ts`
 * loads the blob in a mount effect rather than a `useState` initializer because
 * a render-time storage read shifts React's `useId` tree positions and surfaces
 * as hydration mismatches in unrelated downstream consumers (comment at
 * `use-flow-session.ts:105`). The factory keeps that property structurally:
 * construction reads nothing, and `load()` is the only reader.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logger } from '../../../../utils/logger'
import { createMemoryStorage } from '../../../../utils/storage'
import { serialize } from '../../../flow-session'
import { type FlowSessionStore, createFlowSession } from '../../adapters/flow-session-store'

const KEY = 'tourkit:flow:active'
const HOUR_MS = 60 * 60 * 1000

let storage: Storage
let store: FlowSessionStore

function stage(overrides: Record<string, unknown> = {}) {
  const now = Date.now()
  storage.setItem(
    KEY,
    serialize({
      schemaVersion: 2,
      tourId: 't',
      stepIndex: 1,
      startedAt: now,
      lastUpdatedAt: now,
      ...overrides,
    } as Parameters<typeof serialize>[0])
  )
}

beforeEach(() => {
  storage = createMemoryStorage()
  store = createFlowSession({ storage: 'sessionStorage' }, storage)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('construction is inert', () => {
  it('reads nothing from storage until load() is called', () => {
    const fresh = createMemoryStorage()
    const getItem = vi.spyOn(fresh, 'getItem')

    const s = createFlowSession({ storage: 'sessionStorage' }, fresh)
    expect(getItem).not.toHaveBeenCalled()

    s.load()
    expect(getItem).toHaveBeenCalled()
  })

  it('writes nothing from storage during construction either', () => {
    const fresh = createMemoryStorage()
    const setItem = vi.spyOn(fresh, 'setItem')

    createFlowSession({ storage: 'sessionStorage' }, fresh)
    expect(setItem).not.toHaveBeenCalled()
  })
})

describe('load', () => {
  it('returns null when nothing is stored', () => {
    expect(store.load()).toBeNull()
  })

  it('parses a stored V2 blob', () => {
    stage()

    expect(store.load()).toMatchObject({ schemaVersion: 2, tourId: 't', stepIndex: 1 })
  })

  it('migrates a V1 blob in-flight to V2', () => {
    const now = Date.now()
    storage.setItem(
      KEY,
      JSON.stringify({
        schemaVersion: 1,
        tourId: 't',
        stepIndex: 1,
        startedAt: now,
        lastUpdatedAt: now,
      })
    )

    expect(store.load()).toMatchObject({ schemaVersion: 2, currentRoute: undefined })
  })

  it('returns null and removes the key for an unparseable blob', () => {
    storage.setItem(KEY, '{not json')

    expect(store.load()).toBeNull()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('returns null and removes the key for an expired blob', () => {
    stage({ lastUpdatedAt: Date.now() - (HOUR_MS + 1000) })

    expect(store.load()).toBeNull()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('uses the 24h default TTL for localStorage', () => {
    const local = createFlowSession({ storage: 'localStorage' }, storage)
    stage({ lastUpdatedAt: Date.now() - 2 * HOUR_MS })

    // Two hours is past sessionStorage's 1h default but well inside 24h.
    expect(local.load()).not.toBeNull()
  })

  it('honours a custom keyPrefix', () => {
    const custom = createFlowSession({ storage: 'sessionStorage', keyPrefix: 'myapp' }, storage)
    stage()

    expect(custom.load()).toBeNull()

    storage.setItem('myapp:flow:active', storage.getItem(KEY) as string)
    expect(custom.load()).not.toBeNull()
  })
})

describe('save', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('writes a V2 blob carrying the tour id, step index and route', () => {
    store.save('t', 3, '/pricing')
    store.flush()

    expect(JSON.parse(storage.getItem(KEY) ?? 'null')).toMatchObject({
      schemaVersion: 2,
      tourId: 't',
      stepIndex: 3,
      currentRoute: '/pricing',
    })
  })

  it('coalesces a burst: leading write plus one trailing write, never five', () => {
    // `throttleTime` is leading AND trailing edge — the first call lands
    // immediately, calls 2..n collapse into a single write at the 200 ms
    // boundary. (The phase plan calls this "trailing-edge"; the util it names
    // is both, and the leading write is what makes the first step of a tour
    // survive an instant reload.)
    const setItem = vi.spyOn(storage, 'setItem')

    for (let i = 0; i < 5; i++) store.save('t', i)
    expect(setItem).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(200)
    expect(setItem).toHaveBeenCalledTimes(2)
  })

  it('the coalesced write carries the LAST value in the burst', () => {
    for (let i = 0; i < 5; i++) store.save('t', i)
    vi.advanceTimersByTime(200)

    expect(JSON.parse(storage.getItem(KEY) ?? 'null').stepIndex).toBe(4)
  })

  it('flush() writes the pending trailing value immediately', () => {
    store.save('t', 0)
    store.save('t', 7)
    store.flush()

    expect(JSON.parse(storage.getItem(KEY) ?? 'null').stepIndex).toBe(7)
  })

  it('preserves startedAt from a previously loaded session', () => {
    const startedAt = Date.now() - 5000
    stage({ startedAt })
    store.load()

    store.save('t', 2)
    store.flush()

    expect(JSON.parse(storage.getItem(KEY) ?? 'null').startedAt).toBe(startedAt)
  })

  it('writes nothing when the save carries no tour id', () => {
    // The disabled-writes path. It used to be reached by never calling
    // `setTourId`; it is now reached by passing the empty id, which is what a
    // binding with no active tour has to hand.
    store.save('', 1)
    store.flush()

    expect(storage.getItem(KEY)).toBeNull()
  })

  it('swallows and logs a throwing setItem', () => {
    // A full quota must not end the tour.
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    expect(() => {
      store.save('t', 1)
      store.flush()
    }).not.toThrow()
    expect(warn).toHaveBeenCalled()
  })
})

describe('clear', () => {
  it('removes the key', () => {
    stage()
    store.clear()

    expect(storage.getItem(KEY)).toBeNull()
  })

  it('cancels a pending throttled save so it cannot resurrect the blob', () => {
    vi.useFakeTimers()
    store.save('t', 0)
    store.save('t', 1)
    store.clear()

    vi.advanceTimersByTime(200)
    expect(storage.getItem(KEY)).toBeNull()
  })
})

describe('isStale', () => {
  it('is false with no session loaded', () => {
    expect(store.isStale()).toBe(false)
  })

  it('is false for a freshly loaded session', () => {
    stage()
    store.load()

    expect(store.isStale()).toBe(false)
  })

  it('is true once the loaded session passes its TTL', () => {
    // A blob just inside the window at load time, read again after the clock
    // has moved past it — the resolver asks `isStale()` at boot, not at save.
    stage({ lastUpdatedAt: Date.now() - (HOUR_MS - 1000) })
    store.load()

    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 2000)
    expect(store.isStale()).toBe(true)
  })
})

describe('the tour id travels with the write, not beside it', () => {
  it('a trailing-edge save stamps the tour that was current WHEN IT WAS CALLED', () => {
    // `throttleTime` keeps the last call's arguments and replays them on the
    // trailing edge — but the tour id used to be read from closure state at
    // FIRE time. Switch tours inside the 200 ms window and the queued write
    // lands the new tour's id on the old tour's step index: a resume blob for
    // a tour the user is no longer in, pointing at a step number that means
    // nothing there.
    //
    // Passing the id as an argument makes the triple atomic by construction.
    vi.useFakeTimers()

    store.save('tour-a', 5)
    vi.advanceTimersByTime(50)
    store.save('tour-a', 6)

    // The user branches to another tour before the trailing edge fires.
    vi.advanceTimersByTime(250)

    const blob = JSON.parse(storage.getItem(KEY) as string)
    expect(blob.tourId).toBe('tour-a')
    expect(blob.stepIndex).toBe(6)
  })
})
