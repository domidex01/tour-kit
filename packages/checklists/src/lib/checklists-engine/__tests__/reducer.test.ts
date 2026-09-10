import { describe, expect, it } from 'vitest'
import {
  type ReducerContext,
  checklistsReducer,
  createChecklistState,
  markNewlyComplete,
} from '../reducer'
import type {
  ChecklistContextData,
  ChecklistsEngineState,
  EngineChecklistConfig,
  PersistedChecklistState,
} from '../types'

const context: ChecklistContextData = {
  user: {},
  data: {},
  completedTasks: [],
  completedTours: [],
}

const cfg: EngineChecklistConfig = {
  id: 'c1',
  title: 'Getting started',
  tasks: [
    { id: 't1', title: 'First' },
    { id: 't2', title: 'Second', dependsOn: ['t1'] },
  ],
}

const empty = (): ChecklistsEngineState => ({
  checklists: new Map(),
  completed: {},
  dismissed: new Set(),
  completedAt: {},
  notifiedComplete: new Set(),
})

const rctx: ReducerContext = { configs: [cfg], context }

/** SET_CHECKLISTS is also the builder every other case starts from. */
const seeded = () => checklistsReducer(empty(), { type: 'SET_CHECKLISTS' }, rctx)

const c1 = (s: ChecklistsEngineState) => {
  const found = s.checklists.get('c1')
  if (!found) throw new Error('c1 missing')
  return found
}

describe('checklistsReducer — one case per action', () => {
  it('SET_CHECKLISTS builds the map and locks a task whose dependency is unmet', () => {
    const s = seeded()
    expect(s.checklists.size).toBe(1)
    expect(c1(s).tasks[0]?.locked).toBe(false)
    expect(c1(s).tasks[1]?.locked).toBe(true)
    expect(c1(s).totalCount).toBe(2)
  })

  it('COMPLETE_TASK completes the task, unlocks its dependant and stamps completedAt', () => {
    const s = checklistsReducer(
      seeded(),
      { type: 'COMPLETE_TASK', checklistId: 'c1', taskId: 't1', at: 1234 },
      rctx
    )
    expect(c1(s).tasks[0]?.completed).toBe(true)
    expect(c1(s).tasks[0]?.completedAt).toBe(1234)
    expect(c1(s).tasks[1]?.locked).toBe(false)
    expect(c1(s).completedCount).toBe(1)
    expect(s.completed.c1?.has('t1')).toBe(true)
  })

  it('UNCOMPLETE_TASK removes the completion and clears its timestamp', () => {
    const done = checklistsReducer(
      seeded(),
      { type: 'COMPLETE_TASK', checklistId: 'c1', taskId: 't1', at: 1234 },
      rctx
    )
    const s = checklistsReducer(
      done,
      { type: 'UNCOMPLETE_TASK', checklistId: 'c1', taskId: 't1' },
      rctx
    )
    expect(c1(s).tasks[0]?.completed).toBe(false)
    expect(c1(s).tasks[0]?.completedAt).toBeUndefined()
    expect(c1(s).tasks[1]?.locked).toBe(true)
    expect(s.completedAt.c1?.t1).toBeUndefined()
  })

  it('DISMISS_CHECKLIST and RESTORE_CHECKLIST move isDismissed both ways', () => {
    const dismissed = checklistsReducer(
      seeded(),
      { type: 'DISMISS_CHECKLIST', checklistId: 'c1' },
      rctx
    )
    expect(dismissed.dismissed.has('c1')).toBe(true)
    expect(c1(dismissed).isDismissed).toBe(true)

    const restored = checklistsReducer(
      dismissed,
      { type: 'RESTORE_CHECKLIST', checklistId: 'c1' },
      rctx
    )
    expect(restored.dismissed.has('c1')).toBe(false)
    expect(c1(restored).isDismissed).toBe(false)
  })

  it('SET_EXPANDED collapses and re-expands', () => {
    const collapsed = checklistsReducer(
      seeded(),
      { type: 'SET_EXPANDED', checklistId: 'c1', expanded: false },
      rctx
    )
    expect(c1(collapsed).isExpanded).toBe(false)
    const open = checklistsReducer(
      collapsed,
      { type: 'SET_EXPANDED', checklistId: 'c1', expanded: true },
      rctx
    )
    expect(c1(open).isExpanded).toBe(true)
  })

  it('completion is recorded by markNewlyComplete, not by an action', () => {
    // The reducer arm alone leaves `notifiedComplete` untouched — recording is a
    // separate step so the engine can tell a fresh completion from a hydrated
    // one. See `markNewlyComplete`.
    const done = checklistsReducer(
      checklistsReducer(
        seeded(),
        { type: 'COMPLETE_TASK', checklistId: 'c1', taskId: 't1', at: 1 },
        rctx
      ),
      { type: 'COMPLETE_TASK', checklistId: 'c1', taskId: 't2', at: 2 },
      rctx
    )
    expect(c1(done).isComplete).toBe(true)
    expect(done.notifiedComplete.has('c1')).toBe(false)

    const marked = markNewlyComplete(done)
    expect(marked.notifiedComplete.has('c1')).toBe(true)
  })

  it('an unknown action returns the same object', () => {
    const s = seeded()
    // @ts-expect-error — the default arm is reachable from JS callers only
    expect(checklistsReducer(s, { type: 'NOPE' }, rctx)).toBe(s)
  })
})

describe('checklistsReducer — the identity no-ops return the SAME object', () => {
  it('COMPLETE_TASK on an already-complete task', () => {
    const done = checklistsReducer(
      seeded(),
      { type: 'COMPLETE_TASK', checklistId: 'c1', taskId: 't1', at: 1 },
      rctx
    )
    expect(
      checklistsReducer(
        done,
        { type: 'COMPLETE_TASK', checklistId: 'c1', taskId: 't1', at: 2 },
        rctx
      )
    ).toBe(done)
  })

  it('SET_EXPANDED to the value it already holds', () => {
    const s = seeded()
    expect(
      checklistsReducer(s, { type: 'SET_EXPANDED', checklistId: 'c1', expanded: true }, rctx)
    ).toBe(s)
  })

  it('SET_EXPANDED on a checklist that is not registered', () => {
    const s = seeded()
    expect(
      checklistsReducer(s, { type: 'SET_EXPANDED', checklistId: 'nope', expanded: false }, rctx)
    ).toBe(s)
  })

  it('DISMISS_CHECKLIST when already dismissed, RESTORE when not dismissed', () => {
    const dismissed = checklistsReducer(
      seeded(),
      { type: 'DISMISS_CHECKLIST', checklistId: 'c1' },
      rctx
    )
    expect(
      checklistsReducer(dismissed, { type: 'DISMISS_CHECKLIST', checklistId: 'c1' }, rctx)
    ).toBe(dismissed)
    const s = seeded()
    expect(checklistsReducer(s, { type: 'RESTORE_CHECKLIST', checklistId: 'c1' }, rctx)).toBe(s)
  })

  it('markNewlyComplete twice', () => {
    const once = markNewlyComplete(
      checklistsReducer(
        checklistsReducer(
          seeded(),
          { type: 'COMPLETE_TASK', checklistId: 'c1', taskId: 't1', at: 1 },
          rctx
        ),
        { type: 'COMPLETE_TASK', checklistId: 'c1', taskId: 't2', at: 2 },
        rctx
      )
    )
    expect(markNewlyComplete(once)).toBe(once)
  })

  it('markNewlyComplete is the SAME object when nothing is complete', () => {
    const s = seeded()
    expect(markNewlyComplete(s)).toBe(s)
  })

  // The property the engine's reload silence rests on: a hydrated
  // `notifiedComplete` is left alone, so the diff across this step is empty.
  it('markNewlyComplete adds nothing to a checklist hydrated as already notified', () => {
    const hydrated = checklistsReducer(
      seeded(),
      {
        type: 'LOAD_PERSISTED',
        state: {
          completed: { c1: ['t1', 't2'] },
          dismissed: [],
          timestamp: 1,
          notifiedComplete: ['c1'],
        },
      },
      rctx
    )
    expect(c1(hydrated).isComplete).toBe(true)
    expect(markNewlyComplete(hydrated)).toBe(hydrated)
  })

  it('UNCOMPLETE_TASK on a task that was never completed', () => {
    const s = seeded()
    expect(
      checklistsReducer(s, { type: 'UNCOMPLETE_TASK', checklistId: 'c1', taskId: 't1' }, rctx)
    ).toBe(s)
  })
})

describe('LOAD_PERSISTED', () => {
  const blob: PersistedChecklistState = {
    completed: { c1: ['t1'] },
    dismissed: [],
    timestamp: 99,
    completedAt: { c1: { t1: 4242 } },
    notifiedComplete: [],
  }

  it('hydrates completions, timestamps and the derived task state', () => {
    const s = checklistsReducer(seeded(), { type: 'LOAD_PERSISTED', state: blob }, rctx)
    expect(c1(s).tasks[0]?.completed).toBe(true)
    expect(c1(s).tasks[0]?.completedAt).toBe(4242)
    expect(c1(s).tasks[1]?.locked).toBe(false)
    expect(s.completed.c1?.has('t1')).toBe(true)
  })

  // Decision 6 — the phase's one deliberate behaviour change. The pre-extraction
  // provider hard-coded `true` here (checklist-provider.tsx:200), so a panel
  // rendered with defaultExpanded={false} re-expanded the moment a persisted
  // blob arrived, because its own layout effect had already run.
  it('preserves a live collapse instead of clobbering it back to expanded', () => {
    const collapsed = checklistsReducer(
      seeded(),
      { type: 'SET_EXPANDED', checklistId: 'c1', expanded: false },
      rctx
    )
    const hydrated = checklistsReducer(collapsed, { type: 'LOAD_PERSISTED', state: blob }, rctx)
    expect(c1(hydrated).isExpanded).toBe(false)
  })

  it('still expands a checklist it has never seen before', () => {
    const hydrated = checklistsReducer(empty(), { type: 'LOAD_PERSISTED', state: blob }, rctx)
    expect(c1(hydrated).isExpanded).toBe(true)
  })

  // C10 — the map is rebuilt from `configs`, never from the blob's keys.
  it('drops a checklist the blob names but the configs do not, and rebuilds a config-only one clean', () => {
    const s = checklistsReducer(
      seeded(),
      {
        type: 'LOAD_PERSISTED',
        state: { completed: { ghost: ['x'] }, dismissed: ['ghost'], timestamp: 1 },
      },
      rctx
    )
    expect(s.checklists.has('ghost')).toBe(false)
    expect(s.checklists.has('c1')).toBe(true)
    expect(c1(s).completedCount).toBe(0)
    // the raw completion record still round-trips even with no config for it
    expect(s.completed.ghost?.has('x')).toBe(true)
  })
})

describe('the RESET arms deliberately force isExpanded back to true (quirk 15.1)', () => {
  it('RESET_CHECKLIST clears progress and re-expands', () => {
    const collapsedAndDone = checklistsReducer(
      checklistsReducer(
        checklistsReducer(
          seeded(),
          { type: 'COMPLETE_TASK', checklistId: 'c1', taskId: 't1', at: 1 },
          rctx
        ),
        { type: 'SET_EXPANDED', checklistId: 'c1', expanded: false },
        rctx
      ),
      { type: 'COMPLETE_TASK', checklistId: 'c1', taskId: 't2', at: 2 },
      rctx
    )
    const s = checklistsReducer(
      collapsedAndDone,
      { type: 'RESET_CHECKLIST', checklistId: 'c1' },
      rctx
    )
    expect(c1(s).completedCount).toBe(0)
    expect(c1(s).isExpanded).toBe(true)
    expect(s.completed.c1).toBeUndefined()
    expect(s.notifiedComplete.has('c1')).toBe(false)
  })

  it('RESET_CHECKLIST on an unknown id is a no-op', () => {
    const s = seeded()
    expect(checklistsReducer(s, { type: 'RESET_CHECKLIST', checklistId: 'nope' }, rctx)).toBe(s)
  })

  it('RESET_ALL wipes every record and re-expands', () => {
    const done = checklistsReducer(
      checklistsReducer(
        seeded(),
        { type: 'COMPLETE_TASK', checklistId: 'c1', taskId: 't1', at: 1 },
        rctx
      ),
      { type: 'SET_EXPANDED', checklistId: 'c1', expanded: false },
      rctx
    )
    const s = checklistsReducer(done, { type: 'RESET_ALL' }, rctx)
    expect(s.completed).toEqual({})
    expect(s.completedAt).toEqual({})
    expect(s.dismissed.size).toBe(0)
    expect(c1(s).isExpanded).toBe(true)
    expect(c1(s).completedCount).toBe(0)
  })
})

describe('SET_CHECKLISTS', () => {
  it('recomputes from the hydrated completions rather than resetting them', () => {
    const hydrated = checklistsReducer(
      seeded(),
      {
        type: 'LOAD_PERSISTED',
        state: { completed: { c1: ['t1'] }, dismissed: [], timestamp: 1 },
      },
      rctx
    )
    const withNewTask: EngineChecklistConfig = {
      ...cfg,
      tasks: [...cfg.tasks, { id: 't3', title: 'Third' }],
    }
    const s = checklistsReducer(
      { ...hydrated },
      { type: 'SET_CHECKLISTS' },
      {
        configs: [withNewTask],
        context,
      }
    )
    expect(c1(s).tasks).toHaveLength(3)
    expect(c1(s).tasks[0]?.completed).toBe(true)
    expect(c1(s).completedCount).toBe(1)
  })

  it('preserves a collapse and a dismissal across re-registration', () => {
    const collapsed = checklistsReducer(
      checklistsReducer(
        seeded(),
        { type: 'SET_EXPANDED', checklistId: 'c1', expanded: false },
        rctx
      ),
      { type: 'DISMISS_CHECKLIST', checklistId: 'c1' },
      rctx
    )
    const s = checklistsReducer(collapsed, { type: 'SET_CHECKLISTS' }, rctx)
    expect(c1(s).isExpanded).toBe(false)
    expect(c1(s).isDismissed).toBe(true)
  })
})

describe('createChecklistState', () => {
  it('excludes an invisible task from both numerator and denominator', () => {
    const withHidden: EngineChecklistConfig = {
      id: 'c1',
      title: 'C',
      tasks: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B', when: () => false },
      ],
    }
    const s = createChecklistState(withHidden, context, new Set(['a']), false, true, undefined)
    expect(s.totalCount).toBe(1)
    expect(s.completedCount).toBe(1)
    expect(s.progress).toBe(100)
    expect(s.isComplete).toBe(true)
  })

  it('is not complete when it has no visible tasks at all', () => {
    const allHidden: EngineChecklistConfig = {
      id: 'c1',
      title: 'C',
      tasks: [{ id: 'a', title: 'A', when: () => false }],
    }
    const s = createChecklistState(allHidden, context, new Set(), false, true, undefined)
    expect(s.totalCount).toBe(0)
    expect(s.progress).toBe(0)
    expect(s.isComplete).toBe(false)
  })
})
