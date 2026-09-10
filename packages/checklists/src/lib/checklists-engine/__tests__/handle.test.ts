import { describe, expect, it, vi } from 'vitest'
import {
  type CreateChecklistsEngineOptions,
  createChecklistsEngine,
  initialChecklistsState,
  seedChecklistsState,
} from '../create-checklists-engine'
import { createChecklistsHandle } from '../handle'
import type { EngineChecklistConfig } from '../types'

const cfg: EngineChecklistConfig = {
  id: 'c1',
  title: 'C',
  tasks: [
    { id: 't1', title: 'First' },
    { id: 't2', title: 'Second', dependsOn: ['t1'] },
  ],
}

/** A real engine behind a counter — "never constructs" has to be observed. */
function counting(options: CreateChecklistsEngineOptions<EngineChecklistConfig> = {}) {
  let constructed = 0
  return {
    factory: () => {
      constructed++
      return createChecklistsEngine(options)
    },
    count: () => constructed,
  }
}

describe('createChecklistsHandle — the one-argument form', () => {
  it('answers with the empty constant before any verb, and constructs nothing', () => {
    const c = counting({ checklists: [cfg] })
    const handle = createChecklistsHandle(c.factory)

    expect(handle.getState()).toBe(initialChecklistsState())
    expect(handle.getChecklist('c1')).toBeUndefined()
    expect(handle.getProgress('c1')).toEqual({
      completed: 0,
      total: 0,
      percentage: 0,
      remaining: 0,
    })
    expect(c.count()).toBe(0)
  })

  it('subscribe() alone does not construct', () => {
    const c = counting({ checklists: [cfg] })
    const handle = createChecklistsHandle(c.factory)
    handle.subscribe(() => undefined)
    expect(c.count()).toBe(0)
  })

  it('the first verb constructs exactly once, and later verbs reuse it', () => {
    const c = counting({ checklists: [cfg] })
    const handle = createChecklistsHandle(c.factory)

    handle.completeTask('c1', 't1')
    expect(c.count()).toBe(1)

    handle.completeTask('c1', 't2')
    handle.toggleExpanded('c1')
    handle.boot()
    expect(c.count()).toBe(1)
    expect(handle.getChecklist('c1')?.completedCount).toBe(2)
  })

  it('every verb constructs, and every read does not', () => {
    const verbs: Array<(h: ReturnType<typeof createChecklistsHandle>) => void> = [
      (h) => h.boot(),
      (h) => h.setChecklists([cfg]),
      (h) => h.setContext({ user: { a: 1 } }),
      (h) => h.completeTask('c1', 't1'),
      (h) => h.uncompleteTask('c1', 't1'),
      (h) => h.executeAction('c1', 't1'),
      (h) => h.dismissChecklist('c1'),
      (h) => h.restoreChecklist('c1'),
      (h) => h.toggleExpanded('c1'),
      (h) => h.setExpanded('c1', false),
      (h) => h.resetChecklist('c1'),
      (h) => h.resetAll(),
    ]
    for (const verb of verbs) {
      const c = counting({ checklists: [cfg] })
      const handle = createChecklistsHandle(c.factory)
      verb(handle)
      expect(c.count()).toBe(1)
    }

    const c = counting({ checklists: [cfg] })
    const handle = createChecklistsHandle(c.factory)
    handle.getState()
    handle.getChecklist('c1')
    handle.getProgress('c1')
    expect(c.count()).toBe(0)
  })

  it('subscribers survive the engine and see the construction fan-out', () => {
    const c = counting({ checklists: [cfg] })
    const handle = createChecklistsHandle(c.factory)
    const listener = vi.fn()
    handle.subscribe(listener)

    handle.completeTask('c1', 't1')
    // one for the construction fan-out, one for the dispatch
    expect(listener.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('release() then a verb in the SAME tick is a remount, not a re-boot', () => {
    const c = counting({ checklists: [cfg] })
    const handle = createChecklistsHandle(c.factory)

    handle.completeTask('c1', 't1')
    expect(c.count()).toBe(1)

    handle.release()
    handle.completeTask('c1', 't2') // same tick — takes the release back

    expect(c.count()).toBe(1)
    expect(handle.getChecklist('c1')?.completedCount).toBe(2)
  })

  it('release() then a microtask really does destroy, and reads fall back to the initial snapshot', async () => {
    const c = counting({ checklists: [cfg] })
    const handle = createChecklistsHandle(c.factory)

    handle.completeTask('c1', 't1')
    expect(handle.getState()).not.toBe(initialChecklistsState())

    handle.release()
    await Promise.resolve()

    expect(handle.getState()).toBe(initialChecklistsState())
    expect(handle.getChecklist('c1')).toBeUndefined()

    // the next verb builds a second engine
    handle.completeTask('c1', 't1')
    expect(c.count()).toBe(2)
  })

  it('release() is idempotent and safe before anything was ever built', async () => {
    const c = counting({ checklists: [cfg] })
    const handle = createChecklistsHandle(c.factory)
    expect(() => {
      handle.release()
      handle.release()
    }).not.toThrow()
    await Promise.resolve()
    expect(c.count()).toBe(0)
  })
})

describe('createChecklistsHandle — the two-argument (seeded) form', () => {
  it('answers reads from the seed before any verb, still constructing nothing', () => {
    const c = counting({ checklists: [cfg] })
    const seed = seedChecklistsState([cfg])
    const handle = createChecklistsHandle(c.factory, seed)

    expect(handle.getState()).toBe(seed)
    expect(handle.getState()).toBe(seed) // same object every call — Object.is
    expect(handle.getChecklist('c1')?.tasks).toHaveLength(2)
    expect(handle.getChecklist('c1')?.tasks[1]?.locked).toBe(true)
    expect(handle.getProgress('c1')).toEqual({
      completed: 0,
      total: 2,
      percentage: 0,
      remaining: 2,
    })
    expect(c.count()).toBe(0)
  })

  it('the seed is not the empty constant', () => {
    const seed = seedChecklistsState([cfg])
    const handle = createChecklistsHandle(counting().factory, seed)
    expect(handle.getState()).not.toBe(initialChecklistsState())
  })

  it('the first verb replaces the seed with the live engine snapshot', () => {
    const c = counting({ checklists: [cfg] })
    const seed = seedChecklistsState([cfg])
    const handle = createChecklistsHandle(c.factory, seed)

    handle.completeTask('c1', 't1')
    expect(handle.getState()).not.toBe(seed)
    expect(handle.getChecklist('c1')?.completedCount).toBe(1)
  })

  it('after release() the reads fall back to the SEED, not to empty', async () => {
    const c = counting({ checklists: [cfg] })
    const seed = seedChecklistsState([cfg])
    const handle = createChecklistsHandle(c.factory, seed)

    handle.completeTask('c1', 't1')
    handle.release()
    await Promise.resolve()

    expect(handle.getState()).toBe(seed)
    expect(handle.getChecklist('c1')?.tasks).toHaveLength(2)
  })

  it('reading the seed touches no storage — persisted state must not reach the first render', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const handle = createChecklistsHandle(
      counting({ checklists: [cfg], persistence: { enabled: true } }).factory,
      seedChecklistsState([cfg])
    )
    handle.getState()
    handle.getChecklist('c1')
    expect(getItem).not.toHaveBeenCalled()
    getItem.mockRestore()
  })
})
