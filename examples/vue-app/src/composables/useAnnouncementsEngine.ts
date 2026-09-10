import {
  type AnnouncementsEngineState,
  type AnnouncementsHandle,
  type EngineAnnouncementConfig,
  createAnnouncementsHandle,
} from '@tour-kit/announcements/engine'
import { isScheduleActive } from '@tour-kit/scheduling/engine'
import {
  type InjectionKey,
  type ShallowRef,
  inject,
  onMounted,
  onScopeDispose,
  provide,
  shallowRef,
} from 'vue'

export interface AnnouncementsKit {
  handle: AnnouncementsHandle<EngineAnnouncementConfig>
  state: ShallowRef<AnnouncementsEngineState<EngineAnnouncementConfig>>
}

export const ANNOUNCEMENTS_KEY: InjectionKey<AnnouncementsKit> = Symbol('announcements')

/**
 * The React binding's shape in Vue's lifecycle vocabulary.
 *
 * Nothing constructs in `setup()`. `createAnnouncementsHandle` builds the
 * engine on the first VERB, and `handle.getState()` serves the seeded snapshot
 * until then — so the configs are already visible on the first render and the
 * page needs no `typeof window` check anywhere. `ensure().boot()` waits for the
 * client's `onMounted`, which is what makes this SSR-safe.
 *
 * TWO THINGS THE REACT PROVIDER DOES FOR YOU AND THIS DOES BY HAND:
 *
 * `setSegments()` — segment audiences fail CLOSED until admitted. React reads
 * `useSegments()` from `<SegmentationProvider>`; there is no Vue equivalent
 * yet, so this page passes a literal. A real consumer wires it from whatever
 * segment source it has.
 *
 * `isScheduleActive` — the engine reaches the optional `@tour-kit/scheduling`
 * peer through a call-time `require`, which DEGRADES OPEN when `require` is
 * absent. A Vite build is exactly that case, so without this injection
 * `config.schedule` would be read and silently ignored. Passing the evaluator
 * from `@tour-kit/scheduling/engine` is the only way an ESM consumer gets real
 * schedule gating.
 */
export function provideAnnouncementsEngine(
  announcements: EngineAnnouncementConfig[],
  segments: Record<string, boolean> = {}
): AnnouncementsKit {
  const handle = createAnnouncementsHandle<EngineAnnouncementConfig>({
    announcements,
    segments,
    isScheduleActive,
    storage: typeof window !== 'undefined' ? window.localStorage : null,
  })

  const state = shallowRef(handle.getState())
  const off = handle.subscribe(() => {
    state.value = handle.getState()
  })

  onMounted(() => handle.ensure().boot())
  onScopeDispose(() => {
    off()
    handle.release()
  })

  const kit: AnnouncementsKit = { handle, state }
  provide(ANNOUNCEMENTS_KEY, kit)
  return kit
}

export function useAnnouncementsKit(): AnnouncementsKit {
  const kit = inject(ANNOUNCEMENTS_KEY)
  if (!kit) throw new Error('useAnnouncementsKit must be used under provideAnnouncementsEngine()')
  return kit
}
