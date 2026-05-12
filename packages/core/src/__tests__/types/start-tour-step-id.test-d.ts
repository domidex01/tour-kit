/**
 * US-1 mirror — `useTour().startTour(tourId, stepId?)` narrows `stepId` to the
 * target tour's step ids when `TStep` is supplied, and widens to `string |
 * number | undefined` by default.
 *
 * Removing any `@ts-expect-error` line MUST break typecheck:types.
 */
import type { TourStep } from '@tour-kit/core'
import type { useTour } from '@tour-kit/core'

type Steps = readonly [TourStep<'welcome'>, TourStep<'pricing'>]

declare const tour: ReturnType<typeof useTour<Steps[number]>>

// stepId omitted — always ok.
tour.startTour('demo')

// stepId as a valid literal — ok.
tour.startTour('demo', 'welcome')
tour.startTour('demo', 'pricing')

// stepId as a number — ok (numeric index escape hatch).
tour.startTour('demo', 0)
tour.startTour('demo', 7)

// @ts-expect-error 'biling' is not a known step id
tour.startTour('demo', 'biling')

// Default-widening path — no generic arg.
declare const dynamicTour: ReturnType<typeof useTour>
dynamicTour.startTour('any-tour', 'any-step')
dynamicTour.startTour('any-tour', 3)
dynamicTour.startTour('any-tour')
