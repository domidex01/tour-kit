import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createChecklistsEngine } from '../create-checklists-engine'
import type { EngineChecklistConfig } from '../types'
import { attachUrlVisitTasks } from '../url-visit-tasks'

// Instrumented, not faked: the real registry still runs, we only count how
// often the leaf re-registers. That count is the whole point of the file —
// "does not rebuild on an expand" has no other observable.
const registerSpy = vi.hoisted(() => vi.fn())
vi.mock('../url-visit-listener', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../url-visit-listener')>()
  return {
    ...actual,
    registerUrlVisitTask: (id: string, pattern: string | RegExp, onMatch: () => void) => {
      registerSpy(id, pattern)
      return actual.registerUrlVisitTask(id, pattern, onMatch)
    },
  }
})

const withUrlVisit = (): EngineChecklistConfig => ({
  id: 'c1',
  title: 'C',
  tasks: [
    { id: 'plain', title: 'Plain' },
    {
      id: 'visit',
      title: 'Visit the dashboard',
      completedWhen: { type: 'urlVisit', urlPattern: '/dashboard' },
    },
  ],
})

const go = (path: string) => {
  window.history.pushState({}, '', path)
}

beforeEach(() => {
  registerSpy.mockClear()
  go('/')
})

afterEach(() => {
  go('/')
})

describe('attachUrlVisitTasks', () => {
  it('registers only the urlVisit tasks, not every task', () => {
    const engine = createChecklistsEngine({ checklists: [withUrlVisit()] })
    const detach = attachUrlVisitTasks(engine)

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy).toHaveBeenCalledWith('c1:visit', '/dashboard')

    detach()
  })

  it('completes the task when the route matches', () => {
    const engine = createChecklistsEngine({ checklists: [withUrlVisit()] })
    const detach = attachUrlVisitTasks(engine)

    expect(engine.getChecklist('c1')?.tasks[1]?.completed).toBe(false)
    go('/dashboard/main') // substring match
    expect(engine.getChecklist('c1')?.tasks[1]?.completed).toBe(true)

    detach()
  })

  it('does not register a urlVisit task that is already completed', () => {
    const engine = createChecklistsEngine({ checklists: [withUrlVisit()] })
    engine.completeTask('c1', 'visit')
    registerSpy.mockClear()

    const detach = attachUrlVisitTasks(engine)
    expect(registerSpy).not.toHaveBeenCalled()

    detach()
  })

  it('re-registers when the completed set moves', () => {
    const engine = createChecklistsEngine({ checklists: [withUrlVisit()] })
    const detach = attachUrlVisitTasks(engine)
    registerSpy.mockClear()

    engine.completeTask('c1', 'plain') // a different task — completed identity moves
    expect(registerSpy).toHaveBeenCalledTimes(1)

    detach()
  })

  it('re-registers when a checklist carrying a urlVisit task is added after attach', () => {
    // annotated: an inline literal with `tasks: []` infers `never[]` and pins
    // TConfig too narrowly for the setChecklists below (Decision 2's generic).
    const engine = createChecklistsEngine<EngineChecklistConfig>({
      checklists: [{ id: 'c0', title: 'C0', tasks: [] }],
    })
    const detach = attachUrlVisitTasks(engine)
    expect(registerSpy).not.toHaveBeenCalled()

    const grown: EngineChecklistConfig[] = [{ id: 'c0', title: 'C0', tasks: [] }, withUrlVisit()]
    engine.setChecklists(grown)
    expect(registerSpy).toHaveBeenCalledWith('c1:visit', '/dashboard')

    detach()
  })

  it('does NOT re-register on an expand/collapse', () => {
    const engine = createChecklistsEngine({ checklists: [withUrlVisit()] })
    const detach = attachUrlVisitTasks(engine)
    registerSpy.mockClear()

    engine.toggleExpanded('c1')
    engine.toggleExpanded('c1')
    engine.dismissChecklist('c1')

    expect(registerSpy).not.toHaveBeenCalled()

    detach()
  })

  it('the returned detach is idempotent, and after it a route change completes nothing', () => {
    const engine = createChecklistsEngine({ checklists: [withUrlVisit()] })
    const detach = attachUrlVisitTasks(engine)

    detach()
    detach()

    go('/dashboard')
    expect(engine.getChecklist('c1')?.tasks[1]?.completed).toBe(false)

    // and it has stopped listening to the engine too
    registerSpy.mockClear()
    engine.completeTask('c1', 'plain')
    expect(registerSpy).not.toHaveBeenCalled()
  })

  it('a task whose pattern already matches at attach time completes immediately without looping', () => {
    go('/dashboard')
    const engine = createChecklistsEngine({ checklists: [withUrlVisit()] })
    const detach = attachUrlVisitTasks(engine)

    expect(engine.getChecklist('c1')?.tasks[1]?.completed).toBe(true)
    // one register for the initial build, one for the rebuild the completion
    // triggers — and then it settles rather than re-entering
    expect(registerSpy.mock.calls.length).toBeLessThanOrEqual(2)

    detach()
  })

  it('honours a RegExp pattern', () => {
    const engine = createChecklistsEngine({
      checklists: [
        {
          id: 'c1',
          title: 'C',
          tasks: [
            {
              id: 'billing',
              title: 'Billing',
              completedWhen: { type: 'urlVisit', urlPattern: /^\/billing/ },
            },
          ],
        },
      ],
    })
    const detach = attachUrlVisitTasks(engine)

    go('/account/billing') // does not start with /billing
    expect(engine.getChecklist('c1')?.tasks[0]?.completed).toBe(false)
    go('/billing/plan')
    expect(engine.getChecklist('c1')?.tasks[0]?.completed).toBe(true)

    detach()
  })

  it('ignores the non-urlVisit completedWhen arms', () => {
    const engine = createChecklistsEngine({
      checklists: [
        {
          id: 'c1',
          title: 'C',
          tasks: [
            { id: 'a', title: 'A', completedWhen: { tourCompleted: 'x' } },
            { id: 'b', title: 'B', completedWhen: { custom: () => true } },
          ],
        },
      ],
    })
    const detach = attachUrlVisitTasks(engine)
    expect(registerSpy).not.toHaveBeenCalled()
    detach()
  })
})
