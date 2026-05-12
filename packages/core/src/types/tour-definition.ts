import type { Placement } from './config'

/**
 * Recursive JSON-safe value. Used to type `audience.value` and any other
 * primitive payload that round-trips through a JSON file or CMS response.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

/**
 * Single condition inside the audience array form.
 *
 * This is a JSON-safe SUBSET of the runtime `AudienceCondition`: the runtime
 * `type` discriminator (`'user_property' | 'segment' | 'feature_flag' | 'custom'`)
 * is omitted because JSON-authored audiences don't need it — consumers attach
 * the discriminator at runtime when they bridge to `AudienceCondition[]`.
 */
export interface AudienceConditionDefinition {
  key: string
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'in'
    | 'not_in'
    | 'exists'
    | 'not_exists'
  value?: JsonValue
}

/**
 * Audience filter shape — discriminated by `Array.isArray()`.
 *
 * - Array branch: legacy inline conditions.
 * - Object branch: named segment lookup resolved by `useSegment`/`useSegments`.
 */
export type AudienceDefinition = AudienceConditionDefinition[] | { segment: string }

/**
 * JSON-authorable subset of `TourStep`. Fields excluded:
 * - `target` accepts only `string` (refs are not JSON-serializable)
 * - `title`/`description`/`content` are `unknown` — `ReactNode` at runtime,
 *   but the schema guarantees presence/optionality, not React-element shape
 * - lifecycle callbacks (`when`, `onShow`, `onEnter`, etc.) — runtime-only
 * - branching/advanceOn handlers — runtime-only
 *
 * Consumers parse JSON into `TourStepDefinition` and attach runtime-only
 * fields (refs, callbacks) before handing the result to `TourProvider`.
 */
export interface TourStepDefinition {
  id: string
  kind?: 'visible' | 'hidden'
  target: string
  title?: unknown
  description?: unknown
  content: unknown
  audience?: AudienceDefinition
  placement?: Placement
}

/**
 * JSON-authorable subset of `Tour`. Excludes lifecycle callbacks
 * (`onStart`, `onComplete`, `onStepChange`, `onBranchAction`, `onTourBranch`)
 * and the rich `keyboard`/`spotlight`/`persistence`/`a11y`/`scroll` configs —
 * those are attached at runtime by the consumer.
 */
export interface TourDefinition {
  id: string
  steps: TourStepDefinition[]
  audience?: AudienceDefinition
  autoStart?: boolean
  startAt?: number
}
