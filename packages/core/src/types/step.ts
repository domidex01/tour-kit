import type React from 'react'
import type { Branch } from './branch'
import type { Placement } from './config'
import type { TourCallbackContext } from './state'

/**
 * Single step in a tour
 */
export interface TourStep {
  id: string
  /**
   * Step kind. Hidden steps run lifecycle callbacks (`onEnter`, `onShow`) and
   * branching logic (`onNext`) without mounting a DOM element. Useful for
   * trait-based forks or completion gates.
   *
   * Hidden steps must NOT declare any of `target`, `content`, `title`,
   * `placement`, or `advanceOn` — `validateTour` throws at provider mount
   * otherwise.
   *
   * @default 'visible'
   */
  kind?: 'visible' | 'hidden'
  target: string | React.RefObject<HTMLElement | null>
  title?: React.ReactNode
  content: React.ReactNode
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

export type StepOptions = Omit<TourStep, 'id'>
