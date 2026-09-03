import type { LocalizedText } from '../lib/localized-text'
import type { AudienceCondition } from './audience'
import type { Branch } from './branch'
import type { Placement } from './config'
import type { TourNode } from './primitives'
import type { TourCallbackContext } from './state'
import type { TourTarget } from './target'

/**
 * Structural alias of `MediaSlotProps` from `@tour-kit/media`. Re-declared
 * inline here so `@tour-kit/core` does not take a (type-only or otherwise)
 * dependency on `@tour-kit/media` — core sits at the bottom of the dep graph.
 *
 * The shape MUST stay assignment-compatible with `MediaSlotProps`. Update both
 * sites if the public surface changes.
 */
export interface TourStepMedia {
  src: string
  type?: 'auto' | 'youtube' | 'vimeo' | 'loom' | 'wistia' | 'video' | 'gif' | 'lottie' | 'image'
  poster?: string
  aspectRatio?: '16/9' | '4/3' | '1/1' | '9/16' | '21/9' | 'auto'
  className?: string
  alt?: string
  title?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
}

/**
 * Audience prop shape — discriminated by `Array.isArray()`.
 *
 * - Array branch: legacy inline conditions evaluated via `matchesAudience`.
 * - Object branch: named segment lookup via `useSegment` / `useSegments`.
 *
 * Adding the object branch is a pure widening — pre-Phase-3 consumers using
 * `audience: AudienceCondition[]` keep compiling unchanged.
 */
export type AudienceProp = AudienceCondition[] | { segment: string }

/**
 * Fields shared by both visible and hidden steps. Hidden steps run lifecycle
 * callbacks and branching without mounting any DOM — everything UI-rendering
 * lives on `VisibleTourStep` instead.
 */
interface BaseTourStep<TId extends string = string> {
  id: TId
  /**
   * Filter this step out for users who don't match. Accepts the legacy
   * `AudienceCondition[]` array (evaluated via `matchesAudience`) or the
   * `{ segment: 'name' }` object (resolved via `useSegments`).
   */
  audience?: AudienceProp
  // Multi-page support
  route?: string
  routeDelay?: number
  /** Route matching mode (default: 'exact') */
  routeMatch?: 'exact' | 'startsWith' | 'contains'
  /**
   * How to handle navigation when the step's `route` differs from the current
   * route.
   *
   * - `'auto'` (default): provider calls `router.navigate(step.route)` and
   *   awaits the target via `waitForStepTarget` before dispatching `GO_TO_STEP`.
   *   On timeout, throws `TourRouteError({ code: 'TARGET_NOT_FOUND' })`.
   * - `'prompt'`: provider raises `onNavigationRequired` for a
   *   `<TourRoutePrompt>` UI; consumer drives the navigation.
   * - `'manual'`: provider does nothing; consumer must call
   *   `useTourRoute().goToStepRoute()` explicitly.
   *
   * @default 'auto'
   */
  routeChangeStrategy?: 'auto' | 'prompt' | 'manual'
  when?: (context: TourCallbackContext) => boolean | Promise<boolean>
  waitForTarget?: boolean
  waitTimeout?: number
  onBeforeShow?: (
    context: TourCallbackContext
  ) => boolean | undefined | Promise<boolean | undefined>
  /** Runs before the step mounts (visible) or auto-advances (hidden). */
  onEnter?: (context: TourCallbackContext) => void | Promise<void>
  onShow?: (context: TourCallbackContext) => void
  onBeforeHide?: (
    context: TourCallbackContext
  ) => boolean | undefined | Promise<boolean | undefined>
  onHide?: (context: TourCallbackContext) => void
  /**
   * Override the next navigation behavior
   * Determines where to go when the user clicks "Next" or the tour advances
   */
  onNext?: Branch
  /**
   * Override the previous navigation behavior
   * Determines where to go when the user clicks "Back"
   * Set to null to disable going back from this step
   */
  onPrev?: Branch
  /**
   * Named actions that can be triggered from step content
   * Use with useBranch().triggerAction() from your step components
   *
   * @example
   * ```tsx
   * onAction: {
   *   'select-developer': 'developer-path-step',
   *   'select-designer': 'designer-path-step',
   *   'skip-onboarding': 'complete'
   * }
   * ```
   */
  onAction?: Record<string, Branch>
}

/**
 * A step that mounts a tooltip / spotlight against a target element.
 *
 * `target` and `content` are required so authors get a compile-time error if
 * they forget either — `validateTour` enforces the same at runtime.
 */
export interface VisibleTourStep<TId extends string = string> extends BaseTourStep<TId> {
  /** @default 'visible' */
  kind?: 'visible'
  target: TourTarget
  /**
   * Step title. Accepts a plain string (interpolated via `interpolate`),
   * a `{ key: string }` dictionary lookup (resolved via `useT()`), or any
   * `TourNode` for arbitrary JSX. Strings without `{{var}}` tokens render
   * unchanged — the widening is back-compat-safe.
   */
  title?: TourNode | LocalizedText
  /**
   * Optional short description rendered above `content`. i18n-friendly:
   * accepts string (interpolated) or `{ key }` (translated).
   */
  description?: LocalizedText
  content: TourNode
  /**
   * Optional media (video / GIF / Lottie / image) rendered above the step
   * description by `<TourCard>`. Auto-detects the embed provider via URL
   * pattern matching unless `type` is explicit.
   */
  media?: TourStepMedia
  placement?: Placement
  offset?: [number, number]
  showNavigation?: boolean
  showClose?: boolean
  showProgress?: boolean
  className?: string
  spotlightPadding?: number
  spotlightRadius?: number
  interactive?: boolean
  advanceOn?: {
    event: 'click' | 'input' | 'custom'
    selector?: string
    handler?: () => boolean
  }
}

/**
 * A step that runs lifecycle callbacks and branching without rendering UI.
 *
 * Useful for trait-based forks (`onEnter` reads context, `onNext` returns a
 * branch) and completion gates. Authoring a hidden step with any UI field
 * (`target`, `content`, `title`, `placement`, `advanceOn`) fails at compile
 * time via `?: never`, mirroring the runtime check in `validateTour`.
 */
export interface HiddenTourStep<TId extends string = string> extends BaseTourStep<TId> {
  kind: 'hidden'
  target?: never
  content?: never
  title?: never
  placement?: never
  advanceOn?: never
}

/**
 * Single step in a tour — `VisibleTourStep | HiddenTourStep` discriminated by
 * the `kind` field. Hidden steps run lifecycle callbacks (`onEnter`, `onShow`)
 * and branching logic (`onNext`) without mounting a DOM element.
 *
 * `TId` defaults to `string` so existing call sites (`TourStep`, `TourStep[]`)
 * keep working unchanged. Authors who want compile-time step-id narrowing pass
 * a literal-string union: `TourStep<'welcome' | 'pricing'>`. The canonical
 * inference pattern is `[...] as const satisfies ReadonlyArray<TourStep>`
 * combined with `StepIdOf<typeof steps>` (see below).
 */
export type TourStep<TId extends string = string> = VisibleTourStep<TId> | HiddenTourStep<TId>

export type StepOptions<TId extends string = string> = Omit<VisibleTourStep<TId>, 'id'>

/**
 * Type guard narrowing a `TourStep` to the visible branch of the union.
 * Useful for `Array.find` / `filter` callbacks where TypeScript otherwise
 * keeps the result as the full union.
 */
export function isVisibleStep<TId extends string>(
  step: TourStep<TId>
): step is VisibleTourStep<TId> {
  return step.kind !== 'hidden'
}

/**
 * Extract the literal-id union from a const-tuple of steps.
 *
 * @example
 * ```ts
 * const steps = [
 *   { id: 'welcome', target: '#a', content: 'a' },
 *   { id: 'pricing', target: '#b', content: 'b' },
 * ] as const satisfies ReadonlyArray<TourStep>
 *
 * type Ids = StepIdOf<typeof steps>  // 'welcome' | 'pricing'
 * ```
 */
export type StepIdOf<T extends ReadonlyArray<{ id: string }>> = T[number]['id']
