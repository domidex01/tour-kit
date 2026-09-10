import { isScheduleActive } from '@tour-kit/scheduling/engine'
import {
  type EngineSurveyConfig,
  type SurveysEngineOptions,
  type SurveysEngineState,
  type SurveysHandle,
  createSurveysHandle,
} from '@tour-kit/surveys/engine'
import {
  type InjectionKey,
  type ShallowRef,
  inject,
  onMounted,
  onScopeDispose,
  provide,
  shallowRef,
} from 'vue'

export interface SurveysKit {
  handle: SurveysHandle<EngineSurveyConfig>
  state: ShallowRef<SurveysEngineState>
}

export const SURVEYS_KEY: InjectionKey<SurveysKit> = Symbol('surveys')

/**
 * The React binding's shape in Vue's lifecycle vocabulary.
 *
 * Same construct-on-first-verb rule as the announcements composable. Two
 * surveys-specific notes:
 *
 * `boot()` is ASYNC — it hydrates from storage — so `onMounted` fires it and
 * does not await it. `onScopeDispose` calls `release()`, and the engine's own
 * cancellation means a teardown mid-read never lands a stale state.
 *
 * `setTourActive()` is the seam that replaced React's `useTourContextOptional`.
 * This page has no tour running, but a real Vue consumer would forward its own
 * tour state through it so surveys stay out of the way.
 */
export function provideSurveysEngine(
  surveys: EngineSurveyConfig[],
  onScoreCalculated?: SurveysEngineOptions<EngineSurveyConfig>['onScoreCalculated']
): SurveysKit {
  const handle = createSurveysHandle<EngineSurveyConfig>({
    surveys,
    isScheduleActive,
    onScoreCalculated,
    storage: typeof window !== 'undefined' ? window.localStorage : null,
  })

  const state = shallowRef(handle.getState())
  const off = handle.subscribe(() => {
    state.value = handle.getState()
  })

  onMounted(() => {
    void handle.ensure().boot()
  })
  onScopeDispose(() => {
    off()
    handle.release()
  })

  const kit: SurveysKit = { handle, state }
  provide(SURVEYS_KEY, kit)
  return kit
}

export function useSurveysKit(): SurveysKit {
  const kit = inject(SURVEYS_KEY)
  if (!kit) throw new Error('useSurveysKit must be used under provideSurveysEngine()')
  return kit
}
