// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createChecklistsEngine, seedChecklistsState } from '../create-checklists-engine'
import { loadState, resolveStorage, saveState } from '../persistence'
import type { EngineChecklistConfig } from '../types'

const cfg: EngineChecklistConfig = {
  id: 'c1',
  title: 'Getting started',
  tasks: [
    { id: 't1', title: 'First' },
    { id: 't2', title: 'Second', dependsOn: ['t1'] },
  ],
}

describe('the engine on a server', () => {
  // Without this the whole file silently proves nothing if the pragma is ever
  // dropped — it becomes a duplicate jsdom run that passes for the wrong reason.
  it('is really running in node', () => {
    expect(typeof globalThis.window, 'this file is not running in node').toBe('undefined')
  })

  it('constructs, registers, completes, boots and destroys without touching a DOM global', () => {
    const onTaskComplete = vi.fn()
    const engine = createChecklistsEngine({
      checklists: [cfg],
      persistence: { enabled: true },
      onTaskComplete,
    })

    expect(engine.getChecklist('c1')?.tasks).toHaveLength(2)
    expect(engine.getChecklist('c1')?.tasks[1]?.locked).toBe(true)

    engine.completeTask('c1', 't1')
    expect(engine.getChecklist('c1')?.tasks[1]?.locked).toBe(false)
    expect(engine.getProgress('c1').percentage).toBe(50)
    expect(onTaskComplete).toHaveBeenCalledWith('c1', 't1', true)

    expect(() => {
      engine.boot()
      engine.setContext({ user: { id: 1 } })
      engine.toggleExpanded('c1')
      engine.dismissChecklist('c1')
      engine.destroy()
    }).not.toThrow()
  })

  it('persists nothing — there is no storage to resolve', () => {
    expect(resolveStorage(undefined)).toBeNull()
    expect(resolveStorage('sessionStorage')).toBeNull()
    expect(loadState({ enabled: true })).toBeNull()
    expect(() =>
      saveState({ enabled: true }, { completed: {}, dismissed: [], timestamp: 0 })
    ).not.toThrow()
  })

  it('an action that would navigate opens nothing and still auto-completes', () => {
    const engine = createChecklistsEngine({
      checklists: [
        {
          id: 'c1',
          title: 'C',
          tasks: [
            { id: 'go', title: 'Go', action: { type: 'navigate', url: '/x' } },
            {
              id: 'out',
              title: 'Out',
              action: { type: 'navigate', url: 'https://x.test', external: true },
            },
          ],
        },
      ],
    })
    expect(() => {
      engine.executeAction('c1', 'go')
      engine.executeAction('c1', 'out')
    }).not.toThrow()
    expect(engine.getChecklist('c1')?.tasks[0]?.completed).toBe(true)
    expect(engine.getChecklist('c1')?.tasks[1]?.completed).toBe(true)
  })

  it('seedChecklistsState is the same server-safe snapshot a binding renders from', () => {
    const seeded = seedChecklistsState([cfg])
    expect(seeded.checklists.get('c1')?.tasks).toHaveLength(2)
    expect(seeded).toEqual(createChecklistsEngine({ checklists: [cfg] }).getState())
  })
})
