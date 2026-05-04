/**
 * Module-level URL-visit listener for `urlVisit` task completions.
 *
 * Lazily attaches a `popstate` listener and patches `history.pushState`/
 * `history.replaceState` on first registration. Detaches on last
 * deregistration. Patches stay in place after detach (harmless no-ops without
 * listeners — safer than risking clobbering other libraries' patches).
 *
 * Browser-only: every browser-API access is guarded by `typeof window`/
 * `typeof history` so importing the module under SSR (or vitest's
 * `vi.stubGlobal('window', undefined)`) does not throw.
 */

export const LOCATION_CHANGE_EVENT = 'tk:locationchange'

interface UrlVisitTask {
  id: string
  pattern: string | RegExp
  onMatch: () => void
}

interface ListenerState {
  registry: Map<string, UrlVisitTask>
  listenersAttached: boolean
}

const state: ListenerState = {
  registry: new Map(),
  listenersAttached: false,
}

function hasWindow(): boolean {
  return typeof window !== 'undefined' && typeof history !== 'undefined'
}

export function matchesPattern(pattern: string | RegExp, pathname: string): boolean {
  if (typeof pattern === 'string') return pathname.includes(pattern)
  return pattern.test(pathname)
}

function checkAllTasks(): void {
  if (!hasWindow()) return
  const pathname = window.location.pathname
  const matched: string[] = []
  for (const task of state.registry.values()) {
    if (matchesPattern(task.pattern, pathname)) {
      matched.push(task.id)
    }
  }
  if (matched.length === 0) return
  for (const id of matched) {
    const task = state.registry.get(id)
    if (!task) continue
    state.registry.delete(id)
    task.onMatch()
  }
  if (state.registry.size === 0) detachListeners()
}

function handleLocationChange(): void {
  checkAllTasks()
}

interface PatchableHistoryFn {
  __tkPatched?: boolean
}

function attachListeners(): void {
  if (!hasWindow()) return
  if (state.listenersAttached) return

  const pushFn = history.pushState as typeof history.pushState & PatchableHistoryFn
  if (!pushFn.__tkPatched) {
    const original = pushFn.bind(history)
    const patched: typeof history.pushState = function (
      this: History,
      ...args: Parameters<typeof history.pushState>
    ) {
      original(...args)
      window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT))
    }
    ;(patched as typeof history.pushState & PatchableHistoryFn).__tkPatched = true
    history.pushState = patched
  }

  const replaceFn = history.replaceState as typeof history.replaceState & PatchableHistoryFn
  if (!replaceFn.__tkPatched) {
    const original = replaceFn.bind(history)
    const patched: typeof history.replaceState = function (
      this: History,
      ...args: Parameters<typeof history.replaceState>
    ) {
      original(...args)
      window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT))
    }
    ;(patched as typeof history.replaceState & PatchableHistoryFn).__tkPatched = true
    history.replaceState = patched
  }

  window.addEventListener('popstate', handleLocationChange)
  window.addEventListener(LOCATION_CHANGE_EVENT, handleLocationChange)
  state.listenersAttached = true
}

function detachListeners(): void {
  if (!hasWindow()) return
  if (!state.listenersAttached) return
  window.removeEventListener('popstate', handleLocationChange)
  window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocationChange)
  state.listenersAttached = false
}

/**
 * Register a task to auto-complete when `location.pathname` matches `pattern`.
 * Returns a cleanup function that deregisters the task and (when the registry
 * empties) detaches all listeners.
 *
 * Calls `checkAllTasks()` immediately so registering a task while already on a
 * matching route fires `onMatch` synchronously.
 */
export function registerUrlVisitTask(
  id: string,
  pattern: string | RegExp,
  onMatch: () => void
): () => void {
  state.registry.set(id, { id, pattern, onMatch })
  attachListeners()
  checkAllTasks()
  return () => {
    state.registry.delete(id)
    if (state.registry.size === 0) detachListeners()
  }
}

/**
 * Test-only helper: clears module-level singleton state. Not exported via
 * the public package barrel — vitest specs import from
 * `../engine/url-visit-listener` directly.
 */
export function __resetForTests(): void {
  state.registry.clear()
  if (state.listenersAttached && hasWindow()) {
    window.removeEventListener('popstate', handleLocationChange)
    window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocationChange)
  }
  state.listenersAttached = false
}
