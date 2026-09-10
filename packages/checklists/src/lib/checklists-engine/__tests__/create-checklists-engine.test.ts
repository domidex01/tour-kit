import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type CreateChecklistsEngineOptions,
  createChecklistsEngine,
  initialChecklistsState,
  seedChecklistsState,
} from '../create-checklists-engine'
import { DEFAULT_KEY } from '../persistence'
import type { EngineChecklistConfig, PersistedChecklistState } from '../types'

const two = (): EngineChecklistConfig => ({
  id: 'c1',
  title: 'Getting started',
  tasks: [
    { id: 't1', title: 'First' },
    { id: 't2', title: 'Second', dependsOn: ['t1'] },
  ],
})

/** Hints' idiom — what makes "never constructs" observable rather than inferred. */
function counting<TConfig extends EngineChecklistConfig>(
  options: CreateChecklistsEngineOptions<TConfig> = {}
) {
  let constructed = 0
  return {
    factory: () => {
      constructed++
      return createChecklistsEngine(options)
    },
    count: () => constructed,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('the four contract properties', () => {
  it('the constructor is inert — no storage read, no listener, no window touch', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const addEventListener = vi.spyOn(window, 'addEventListener')

    const engine = createChecklistsEngine({
      checklists: [two()],
      persistence: { enabled: true },
    })

    expect(getItem).not.toHaveBeenCalled()
    expect(addEventListener).not.toHaveBeenCalled()
    // …and it is still useful: the config-derived state is already there.
    expect(engine.getChecklist('c1')?.tasks).toHaveLength(2)

    engine.boot()
    expect(getItem).toHaveBeenCalledWith(DEFAULT_KEY)
  })

  it('getState() is reference-stable between dispatches', () => {
    const engine = createChecklistsEngine({ checklists: [two()] })
    const first = engine.getState()
    expect(engine.getState()).toBe(first)
    expect(engine.getState()).toBe(first)

    engine.completeTask('c1', 't1')
    const second = engine.getState()
    expect(second).not.toBe(first)
    expect(engine.getState()).toBe(second)
  })

  it('a no-op verb does not move the snapshot', () => {
    const engine = createChecklistsEngine({ checklists: [two()] })
    const before = engine.getState()
    engine.setExpanded('c1', true) // already expanded
    expect(engine.getState()).toBe(before)
  })

  it('subscribe() notifies synchronously and unsubscribe is idempotent', () => {
    const engine = createChecklistsEngine({ checklists: [two()] })
    const seen: number[] = []
    const unsubscribe = engine.subscribe(() =>
      seen.push(engine.getChecklist('c1')?.completedCount ?? -1)
    )

    engine.completeTask('c1', 't1')
    expect(seen).toEqual([1]) // already recorded — no await, no flush

    unsubscribe()
    unsubscribe()
    engine.completeTask('c1', 't2')
    expect(seen).toEqual([1])
  })

  it('destroy() is terminal for state, callbacks and listeners', () => {
    const onTaskComplete = vi.fn()
    const engine = createChecklistsEngine({ checklists: [two()], onTaskComplete })
    const listener = vi.fn()
    engine.subscribe(listener)

    engine.destroy()
    engine.completeTask('c1', 't1')
    engine.dismissChecklist('c1')
    engine.resetAll()

    expect(engine.getChecklist('c1')?.tasks[0]?.completed).toBe(false)
    expect(onTaskComplete).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
  })

  it('destroy() twice is safe, and boot() after destroy does nothing', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const engine = createChecklistsEngine({ checklists: [two()], persistence: { enabled: true } })
    engine.destroy()
    engine.destroy()
    engine.boot()
    expect(getItem).not.toHaveBeenCalled()
  })
})

describe('registration and the dependency cascade', () => {
  it('setChecklists registers a config set that was not passed at construction', () => {
    const engine = createChecklistsEngine()
    expect(engine.getChecklist('c1')).toBeUndefined()
    engine.setChecklists([two()])
    expect(engine.getChecklist('c1')?.tasks).toHaveLength(2)
  })

  it('completing a dependency unlocks its dependant', () => {
    const engine = createChecklistsEngine({ checklists: [two()] })
    expect(engine.getChecklist('c1')?.tasks[1]?.locked).toBe(true)
    engine.completeTask('c1', 't1')
    expect(engine.getChecklist('c1')?.tasks[1]?.locked).toBe(false)
    engine.uncompleteTask('c1', 't1')
    expect(engine.getChecklist('c1')?.tasks[1]?.locked).toBe(true)
  })

  it('getProgress excludes an invisible task from the denominator', () => {
    const engine = createChecklistsEngine({
      checklists: [
        {
          id: 'c1',
          title: 'C',
          tasks: [
            { id: 'a', title: 'A' },
            { id: 'hidden', title: 'H', when: () => false },
          ],
        },
      ],
    })
    expect(engine.getProgress('c1')).toEqual({
      completed: 0,
      total: 1,
      percentage: 0,
      remaining: 1,
    })
    engine.completeTask('c1', 'a')
    expect(engine.getProgress('c1').percentage).toBe(100)
  })

  it('getProgress on an unknown checklist answers with zeroes rather than throwing', () => {
    const engine = createChecklistsEngine()
    expect(engine.getProgress('nope')).toEqual({
      completed: 0,
      total: 0,
      percentage: 0,
      remaining: 0,
    })
  })

  it('toggleExpanded flips, and defaults to collapsing an expanded checklist', () => {
    const engine = createChecklistsEngine({ checklists: [two()] })
    expect(engine.getChecklist('c1')?.isExpanded).toBe(true)
    engine.toggleExpanded('c1')
    expect(engine.getChecklist('c1')?.isExpanded).toBe(false)
    engine.toggleExpanded('c1')
    expect(engine.getChecklist('c1')?.isExpanded).toBe(true)
  })

  it('dismiss and restore move isDismissed, and dismiss fires config.onDismiss every time (quirk)', () => {
    const onDismiss = vi.fn()
    const engine = createChecklistsEngine({ checklists: [{ ...two(), onDismiss }] })
    engine.dismissChecklist('c1')
    expect(engine.getChecklist('c1')?.isDismissed).toBe(true)
    // a redundant dismiss still re-fires the consumer's own callback
    engine.dismissChecklist('c1')
    expect(onDismiss).toHaveBeenCalledTimes(2)
    engine.restoreChecklist('c1')
    expect(engine.getChecklist('c1')?.isDismissed).toBe(false)
  })
})

describe('executeAction — five arms, both navigate branches, the manualComplete skip', () => {
  let originalLocation: Location

  beforeEach(() => {
    originalLocation = window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  const withAction = (action: EngineChecklistConfig['tasks'][number]['action'], extra = {}) =>
    createChecklistsEngine({
      checklists: [{ id: 'c1', title: 'C', tasks: [{ id: 't1', title: 'T', action, ...extra }] }],
    })

  it('navigate (internal) sets location.href and does NOT open a window', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const engine = withAction({ type: 'navigate', url: '/dashboard' })
    engine.executeAction('c1', 't1')
    expect(window.location.href).toBe('/dashboard')
    expect(open).not.toHaveBeenCalled()
  })

  it('navigate (external) opens a window and does NOT set location.href', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const engine = withAction({ type: 'navigate', url: 'https://x.test', external: true })
    engine.executeAction('c1', 't1')
    expect(open).toHaveBeenCalledWith('https://x.test', '_blank')
    expect(window.location.href).toBe('')
  })

  it('callback runs the handler', () => {
    const handler = vi.fn()
    const engine = withAction({ type: 'callback', handler })
    engine.executeAction('c1', 't1')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it.each(['tour', 'modal', 'custom'] as const)(
    "the '%s' arm does nothing but still auto-completes (quirk 15.2)",
    (type) => {
      const action =
        type === 'tour'
          ? ({ type: 'tour', tourId: 'x' } as const)
          : type === 'modal'
            ? ({ type: 'modal', modalId: 'x' } as const)
            : ({ type: 'custom', data: 1 } as const)
      const engine = withAction(action)
      engine.executeAction('c1', 't1')
      expect(engine.getChecklist('c1')?.tasks[0]?.completed).toBe(true)
    }
  )

  it('manualComplete: false runs the action but skips the auto-completion', () => {
    const handler = vi.fn()
    const engine = withAction({ type: 'callback', handler }, { manualComplete: false })
    engine.executeAction('c1', 't1')
    expect(handler).toHaveBeenCalledTimes(1)
    expect(engine.getChecklist('c1')?.tasks[0]?.completed).toBe(false)
  })

  it('a task with no action is a no-op, and onTaskAction never fires', () => {
    const onTaskAction = vi.fn()
    const engine = createChecklistsEngine({ checklists: [two()], onTaskAction })
    engine.executeAction('c1', 't1')
    expect(onTaskAction).not.toHaveBeenCalled()
    expect(engine.getChecklist('c1')?.tasks[0]?.completed).toBe(false)
  })

  it('an unknown checklist or task is a no-op', () => {
    const engine = createChecklistsEngine({ checklists: [two()] })
    expect(() => engine.executeAction('nope', 't1')).not.toThrow()
    expect(() => engine.executeAction('c1', 'nope')).not.toThrow()
  })

  it('after destroy() it opens no window and fires no callback (Decision 16)', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const onTaskAction = vi.fn()
    const engine = createChecklistsEngine({
      checklists: [
        {
          id: 'c1',
          title: 'C',
          tasks: [{ id: 't1', title: 'T', action: { type: 'navigate', url: 'x', external: true } }],
        },
      ],
      onTaskAction,
    })
    engine.destroy()
    engine.executeAction('c1', 't1')
    expect(open).not.toHaveBeenCalled()
    expect(onTaskAction).not.toHaveBeenCalled()
  })
})

describe('hydration', () => {
  const blob: PersistedChecklistState = {
    completed: { c1: ['t1'] },
    dismissed: [],
    timestamp: 1,
    completedAt: { c1: { t1: 42 } },
  }

  it('boot() after setChecklists hydrates the registered configs', () => {
    const engine = createChecklistsEngine({
      persistence: { enabled: true, onLoad: () => blob },
    })
    engine.setChecklists([two()])
    engine.boot()
    expect(engine.getChecklist('c1')?.tasks[0]?.completed).toBe(true)
    expect(engine.getChecklist('c1')?.tasks[1]?.locked).toBe(false)
  })

  it('setChecklists after boot() recomputes from the already-hydrated completions', () => {
    const engine = createChecklistsEngine({
      persistence: { enabled: true, onLoad: () => blob },
    })
    engine.boot()
    engine.setChecklists([two()])
    expect(engine.getChecklist('c1')?.tasks[0]?.completed).toBe(true)
  })

  it('boot() is idempotent', () => {
    const onLoad = vi.fn(() => blob)
    const engine = createChecklistsEngine({
      checklists: [two()],
      persistence: { enabled: true, onLoad },
    })
    engine.boot()
    engine.boot()
    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  it('hydrates from a Promise onLoad', async () => {
    const engine = createChecklistsEngine({
      checklists: [two()],
      persistence: { enabled: true, onLoad: () => Promise.resolve(blob) },
    })
    engine.boot()
    expect(engine.getChecklist('c1')?.tasks[0]?.completed).toBe(false)
    await vi.waitFor(() => {
      expect(engine.getChecklist('c1')?.tasks[0]?.completed).toBe(true)
    })
  })

  it('a Promise that resolves after destroy() is dropped', async () => {
    const engine = createChecklistsEngine({
      checklists: [two()],
      persistence: { enabled: true, onLoad: () => Promise.resolve(blob) },
    })
    engine.boot()
    engine.destroy()
    await Promise.resolve()
    await Promise.resolve()
    expect(engine.getChecklist('c1')?.tasks[0]?.completed).toBe(false)
  })

  it('writes nothing before boot(), and writes after it', () => {
    const onSave = vi.fn()
    const engine = createChecklistsEngine({
      checklists: [two()],
      persistence: { enabled: true, onSave, onLoad: () => null },
    })
    engine.completeTask('c1', 't1')
    expect(onSave).not.toHaveBeenCalled()

    engine.boot()
    engine.completeTask('c1', 't2')
    expect(onSave).toHaveBeenCalled()
    const last = onSave.mock.calls[onSave.mock.calls.length - 1]
    expect(last?.[0].completed.c1).toContain('t2')
  })

  it('an expansion change alone does not write (it is not a persisted slice)', () => {
    const onSave = vi.fn()
    const engine = createChecklistsEngine({
      checklists: [two()],
      persistence: { enabled: true, onSave, onLoad: () => null },
    })
    engine.boot()
    onSave.mockClear()
    engine.toggleExpanded('c1')
    expect(onSave).not.toHaveBeenCalled()
  })
})

describe('completion notification', () => {
  const onlyOne = (): EngineChecklistConfig => ({
    id: 'c1',
    title: 'C',
    tasks: [{ id: 't1', title: 'T' }],
  })

  it('fires onChecklistComplete and config.onComplete exactly once', () => {
    const onComplete = vi.fn()
    const onChecklistComplete = vi.fn()
    const engine = createChecklistsEngine({
      checklists: [{ ...onlyOne(), onComplete }],
      onChecklistComplete,
    })
    engine.completeTask('c1', 't1')
    expect(onChecklistComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledTimes(1)

    // a redundant complete does not re-fire it
    engine.completeTask('c1', 't1')
    expect(onChecklistComplete).toHaveBeenCalledTimes(1)
  })

  it('does not re-fire across a simulated reload — notifiedComplete round-trips', () => {
    let saved: PersistedChecklistState | null = null
    const persistence = {
      enabled: true,
      onSave: (s: PersistedChecklistState) => {
        saved = s
      },
      onLoad: () => saved,
    }
    const first = createChecklistsEngine({ checklists: [onlyOne()], persistence })
    first.boot()
    first.completeTask('c1', 't1')
    expect(saved).not.toBeNull()

    const onChecklistComplete = vi.fn()
    const second = createChecklistsEngine({
      checklists: [onlyOne()],
      persistence,
      onChecklistComplete,
    })
    second.boot()
    expect(second.getChecklist('c1')?.isComplete).toBe(true)
    expect(onChecklistComplete).not.toHaveBeenCalled()
  })
})

describe('Decision 16 — the four silent regressions', () => {
  // The completion path used to dispatch a second action from inside the first,
  // so a verb that completed a checklist notified subscribers TWICE while every
  // other verb notified once — every consumer rendered twice on completion.
  // Recording completion inside the transition made it uniform.
  it('every verb notifies exactly once, completion included', () => {
    const completing = createChecklistsEngine({
      checklists: [{ id: 'c1', title: 'C', tasks: [{ id: 't1', title: 'T' }] }],
    })
    const a = vi.fn()
    completing.subscribe(a)
    completing.completeTask('c1', 't1')
    expect(completing.getChecklist('c1')?.isComplete).toBe(true)
    expect(a).toHaveBeenCalledTimes(1)

    const partial = createChecklistsEngine({ checklists: [two()] })
    const b = vi.fn()
    partial.subscribe(b)
    partial.completeTask('c1', 't1')
    expect(partial.getChecklist('c1')?.isComplete).toBe(false)
    expect(b).toHaveBeenCalledTimes(1)
  })

  it('a throwing subscriber does not stop the ones after it', () => {
    const engine = createChecklistsEngine({ checklists: [two()] })
    const after = vi.fn()
    engine.subscribe(() => {
      throw new Error('boom')
    })
    engine.subscribe(after)
    expect(() => engine.completeTask('c1', 't1')).not.toThrow()
    expect(after).toHaveBeenCalled()
  })

  it('changed is false on a redundant complete and true on the first', () => {
    const onTaskComplete = vi.fn()
    const engine = createChecklistsEngine({ checklists: [two()], onTaskComplete })
    engine.completeTask('c1', 't1')
    expect(onTaskComplete).toHaveBeenLastCalledWith('c1', 't1', true)
    engine.completeTask('c1', 't1')
    expect(onTaskComplete).toHaveBeenLastCalledWith('c1', 't1', false)
  })

  it('the same flag rides uncompleteTask and dismissChecklist', () => {
    const onTaskUncomplete = vi.fn()
    const onChecklistDismiss = vi.fn()
    const engine = createChecklistsEngine({
      checklists: [two()],
      onTaskUncomplete,
      onChecklistDismiss,
    })
    engine.uncompleteTask('c1', 't1') // never completed
    expect(onTaskUncomplete).toHaveBeenLastCalledWith('c1', 't1', false)
    engine.completeTask('c1', 't1')
    engine.uncompleteTask('c1', 't1')
    expect(onTaskUncomplete).toHaveBeenLastCalledWith('c1', 't1', true)

    engine.dismissChecklist('c1')
    expect(onChecklistDismiss).toHaveBeenLastCalledWith('c1', true)
    engine.dismissChecklist('c1')
    expect(onChecklistDismiss).toHaveBeenLastCalledWith('c1', false)
  })

  it('setChecklists with a NEW ARRAY of the same configs does not notify', () => {
    const engine = createChecklistsEngine({ checklists: [two()] })
    const listener = vi.fn()
    engine.subscribe(listener)
    const before = engine.getState()

    engine.setChecklists([two()]) // fresh literal, identical shape

    expect(listener).not.toHaveBeenCalled()
    expect(engine.getState()).toBe(before)
  })

  it('…but does notify when a task is actually added', () => {
    const engine = createChecklistsEngine({ checklists: [two()] })
    const listener = vi.fn()
    engine.subscribe(listener)

    const grown = two()
    grown.tasks.push({ id: 't3', title: 'Third' })
    engine.setChecklists([grown])

    expect(listener).toHaveBeenCalled()
    expect(engine.getChecklist('c1')?.tasks).toHaveLength(3)
  })

  it('setContext with a fresh {} does not notify, a changed user field does', () => {
    const engine = createChecklistsEngine({ checklists: [two()], context: { user: { id: 1 } } })
    const listener = vi.fn()
    engine.subscribe(listener)

    engine.setContext({ user: { id: 1 } })
    expect(listener).not.toHaveBeenCalled()

    engine.setContext({ user: { id: 2 } })
    expect(listener).toHaveBeenCalled()
  })

  it('a changed context re-evaluates task visibility', () => {
    const engine = createChecklistsEngine({
      checklists: [
        {
          id: 'c1',
          title: 'C',
          tasks: [{ id: 'gated', title: 'G', when: (ctx) => ctx.user.admin === true }],
        },
      ],
    })
    expect(engine.getChecklist('c1')?.tasks[0]?.visible).toBe(false)
    engine.setContext({ user: { admin: true } })
    expect(engine.getChecklist('c1')?.tasks[0]?.visible).toBe(true)
  })

  it('every verb is inert after destroy(), including setChecklists and setContext', () => {
    const engine = createChecklistsEngine({ checklists: [two()] })
    engine.destroy()
    const frozen = engine.getState()
    engine.setChecklists([{ id: 'other', title: 'O', tasks: [] }])
    engine.setContext({ user: { id: 9 } })
    engine.toggleExpanded('c1')
    engine.resetChecklist('c1')
    expect(engine.getState()).toBe(frozen)
  })
})

describe('the two exported snapshots', () => {
  it('initialChecklistsState() is one shared constant', () => {
    expect(initialChecklistsState()).toBe(initialChecklistsState())
    expect(initialChecklistsState().checklists.size).toBe(0)
  })

  it('seedChecklistsState() deep-equals a fresh engine and is NOT the module constant', () => {
    const cfg = two()
    const seeded = seedChecklistsState([cfg])
    const engine = createChecklistsEngine({ checklists: [cfg] })

    expect(seeded).not.toBe(initialChecklistsState())
    expect(seeded).toEqual(engine.getState())
    expect(seeded.checklists.get('c1')?.tasks).toHaveLength(2)
    expect(seeded.checklists.get('c1')?.tasks[1]?.locked).toBe(true)
  })

  it('seeding with no configs falls back to the shared constant', () => {
    expect(seedChecklistsState([])).toBe(initialChecklistsState())
  })

  it('seeding reads no storage', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    seedChecklistsState([two()])
    expect(getItem).not.toHaveBeenCalled()
  })

  it('the counting factory proves reading a seed constructs nothing', () => {
    const c = counting({ checklists: [two()] })
    seedChecklistsState([two()])
    expect(c.count()).toBe(0)
    c.factory()
    expect(c.count()).toBe(1)
  })
})

// C8 — the engine notifies completion from inside dispatch, so a consumer sees
// CHECKLIST before TASK, where the pre-extraction provider fired task first
// (its checklist event came from an effect, after the commit). The flip is
// accepted and pinned here rather than left for a consumer to discover.
describe('callback order across one completing completeTask (C8)', () => {
  it('fires onChecklistComplete BEFORE onTaskComplete', () => {
    const order: string[] = []
    const engine = createChecklistsEngine({
      checklists: [{ id: 'c1', title: 'C', tasks: [{ id: 't1', title: 'T' }] }],
      onChecklistComplete: () => order.push('checklist'),
      onTaskComplete: () => order.push('task'),
    })
    engine.completeTask('c1', 't1')
    expect(order).toEqual(['checklist', 'task'])
  })
})
