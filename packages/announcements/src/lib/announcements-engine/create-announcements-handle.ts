/**
 * `createAnnouncementsHandle()` — the binding contract (v3 Phase 3, Task 3.4).
 *
 * Composed from core's generic `createHandle<E, S>`; NOT from
 * `createEngineHandle`, which hand-forwards seventeen `TourEngine` verbs and is
 * a facade over that one engine (recipe step 6, gap 15). No second lifecycle is
 * written here.
 *
 * The handle gives a binding three things `createAnnouncementsEngine` cannot:
 * construction on the FIRST VERB rather than during render (StrictMode
 * double-invokes render, and child effects run before parent effects), a
 * deferred `release()` that a verb in the same tick can take back, and a
 * snapshot to serve before the engine exists.
 */
import { createHandle } from '@tour-kit/core/engine'
import type { Handle } from '@tour-kit/core/engine'
import {
  type AnnouncementsEngine,
  type AnnouncementsEngineOptions,
  createAnnouncementsEngine,
  seedAnnouncementsState,
} from './create-announcements-engine'
import type { AnnouncementsEngineState, EngineAnnouncementConfig } from './types'

export type AnnouncementsHandle<TConfig extends EngineAnnouncementConfig> = Handle<
  AnnouncementsEngine<TConfig>,
  AnnouncementsEngineState<TConfig>
>

export function createAnnouncementsHandle<TConfig extends EngineAnnouncementConfig>(
  options: AnnouncementsEngineOptions<TConfig> = {}
): AnnouncementsHandle<TConfig> {
  // ONE seed object, shared by the handle's pre-verb snapshot and the engine's
  // own initial state. Phase 2 found that building two makes every consumer
  // render twice: the values are equal but `Object.is` is false, so
  // `useSyncExternalStore` re-renders the moment the engine is constructed.
  const seed = seedAnnouncementsState<TConfig>(options.announcements ?? [], options.segments)

  return createHandle<AnnouncementsEngine<TConfig>, AnnouncementsEngineState<TConfig>>(
    () => createAnnouncementsEngine({ ...options, initialState: seed }),
    seed
  )
}
