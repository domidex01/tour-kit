/**
 * `createSurveysHandle()` — the binding contract (v3 Phase 3, Task 3.9).
 *
 * Composed from core's generic `createHandle<E, S>`; NOT from
 * `createEngineHandle`, which hand-forwards seventeen `TourEngine` verbs and is
 * a facade over that one engine. No second lifecycle is written here.
 *
 * `EngineLike` requires a synchronous `destroy()` and a `getState()` — the
 * surveys engine's `boot()` is async, which the handle neither knows nor needs
 * to: it constructs on the first verb and the binding awaits nothing.
 */
import { createHandle } from '@tour-kit/core/engine'
import type { Handle } from '@tour-kit/core/engine'
import {
  type SurveysEngine,
  type SurveysEngineOptions,
  createSurveysEngine,
  initialSurveysState,
  seedSurveysState,
} from './create-surveys-engine'
import type { EngineSurveyConfig, SurveysEngineState } from './types'

export type SurveysHandle<TConfig extends EngineSurveyConfig = EngineSurveyConfig> = Handle<
  SurveysEngine<TConfig>,
  SurveysEngineState
>

export function createSurveysHandle<TConfig extends EngineSurveyConfig = EngineSurveyConfig>(
  options: SurveysEngineOptions<TConfig> = {}
): SurveysHandle<TConfig> {
  // ONE seed object, shared by the handle's pre-verb snapshot and the engine's
  // own initial state. Phase 2 found that two equal-but-distinct seeds make
  // `Object.is` false, so every consumer renders twice on construction.
  const seed = options.surveys?.length ? seedSurveysState(options.surveys) : initialSurveysState

  return createHandle<SurveysEngine<TConfig>, SurveysEngineState>(
    () => createSurveysEngine({ ...options, initialState: seed }),
    seed
  )
}
