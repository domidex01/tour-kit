/**
 * `@tour-kit/surveys/engine` — the React-free door.
 *
 * v3 Phase 3. Everything here runs in Node, Vue, Svelte or a plain `<script>`:
 * no React, no JSX runtime, no DOM, and no licence gate. A consumer drives the
 * queue, the six fatigue gates, the audience, the schedule and the scoring, and
 * renders whatever it likes.
 *
 * Two things are deliberately NOT re-exported from here:
 *   - `<SurveysProvider>` and every component — they are the React half
 *   - the licence gate — imported once, in the provider (Decision 9). The
 *     engine path is currently UNGATED; whether non-React consumers are gated
 *     is a commercial decision the v3 handoff still carries as Open question 1.
 *
 * The reducer, its action union, `drainQueue`, `updateSurvey`,
 * `createInitialSurveyState`, serialize/deserialize and the individual gate
 * predicates are WITHHELD, exactly as core withholds `tourReducer` and
 * checklists withholds `checklistsReducer`: they are the seam the engine and a
 * binding share, not a consumer API. `passesFrequencyGates` is published
 * because a consumer deciding its own show timing genuinely needs it.
 *
 * Re-exports and comments only. No declaration, no side-effect import.
 *
 * The optional scheduling peer is reached through a call-time `require`, which
 * degrades OPEN in every ESM build. An ESM consumer that wants real schedule
 * gating passes `isScheduleActive` from `@tour-kit/scheduling/engine` into the
 * factory (plan Decision 7b).
 */
export {
  DEFAULT_SURVEY_QUEUE_CONFIG,
  type AnswerValue,
  type DismissalReason,
  type DisplayMode,
  type EngineSurveyConfig,
  type FrequencyRule,
  type IsScheduleActive,
  type PriorityOrder,
  type StackBehavior,
  type StepValidation,
  type SurveyGateInput,
  type SurveyPriority,
  type SurveyQueueConfig,
  type SurveyQueueItem,
  type SurveyState,
  type SurveyStorageAdapter,
  type SurveyType,
  type SurveysEngine,
  type SurveysEngineOptions,
  type SurveysEngineState,
  type SurveysHandle,
  createSurveysEngine,
  createSurveysHandle,
  initialSurveysState,
  passesFrequencyGates,
  seedSurveysState,
} from '../lib/surveys-engine'
