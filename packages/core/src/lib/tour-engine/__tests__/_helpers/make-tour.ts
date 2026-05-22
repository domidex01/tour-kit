import type { HiddenTourStep, TourStep, VisibleTourStep } from '../../../../types/step'
import type { Tour } from '../../../../types/tour'

export const visibleStep = (id: string, extras: Partial<VisibleTourStep> = {}): VisibleTourStep =>
  ({
    id,
    target: '#x',
    content: 'hi',
    ...extras,
  }) as VisibleTourStep

export const hiddenStep = (id: string, extras: Partial<HiddenTourStep> = {}): HiddenTourStep =>
  ({
    id,
    kind: 'hidden',
    ...extras,
  }) as HiddenTourStep

export const makeTour = (id: string, steps: TourStep[], extras: Partial<Tour> = {}): Tour => ({
  id,
  steps,
  ...extras,
})
