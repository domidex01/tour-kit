/**
 * US-1 + US-3 — `useTour().goToStep(id)` exists at the top level (no
 * `.actions.` prefix) and narrows `id` to `TStep['id']` when a concrete step
 * type is supplied. Default-widening path still accepts arbitrary strings.
 *
 * Removing any `@ts-expect-error` line MUST break typecheck:types.
 */
import type { TourStep } from '@tour-kit/core'
import { useTour } from '@tour-kit/core'

// Narrowed-id generic instantiation.
type Steps = readonly [TourStep<'welcome'>, TourStep<'pricing'>]

declare const tour: ReturnType<typeof useTour<Steps[number]>>

tour.goToStep('welcome')
tour.goToStep('pricing')
// @ts-expect-error not assignable to 'welcome' | 'pricing'
tour.goToStep('biling')

// Default-widening path — no generic arg.
declare const dynamicTour: ReturnType<typeof useTour>
dynamicTour.goToStep('anything-goes')

// Surface check: goToStep is a top-level method, not nested under .actions.
type _GoToStepIsTopLevel = (typeof tour)['goToStep']
const _x: _GoToStepIsTopLevel = tour.goToStep
void _x
