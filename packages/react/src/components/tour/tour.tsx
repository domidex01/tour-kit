import { TourProvider, type TourStep as TourStepType, type Tour as TourType } from '@tour-kit/core'
import * as React from 'react'
import { TourCard } from '../card/tour-card'
import { TourOverlay } from '../overlay/tour-overlay'
import { TourStep } from './tour-step'

interface TourProps {
  id: string
  autoStart?: boolean
  config?: Omit<TourType, 'id' | 'steps'>
  onStart?: () => void
  onComplete?: () => void
  onSkip?: () => void
  onStepChange?: (step: TourStepType, index: number) => void
  children: React.ReactNode
}

export function Tour({
  id,
  autoStart = false,
  config,
  onStart,
  onComplete,
  onSkip,
  onStepChange,
  children,
}: TourProps) {
  const { steps, content } = React.useMemo(() => {
    const stepElements: TourStepType[] = []
    const contentElements: React.ReactNode[] = []

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === TourStep) {
        stepElements.push(child.props as TourStepType)
      } else {
        contentElements.push(child)
      }
    })

    return { steps: stepElements, content: contentElements }
  }, [children])

  const tour: TourType = {
    id,
    steps,
    autoStart,
    ...config,
    onStart: onStart ? () => onStart() : undefined,
    onComplete: onComplete ? () => onComplete() : undefined,
    onSkip: onSkip ? () => onSkip() : undefined,
    onStepChange: onStepChange ? (step, index) => onStepChange(step, index) : undefined,
  }

  return (
    <TourProvider tours={[tour]}>
      {content}
      <TourOverlay />
      <TourCard />
    </TourProvider>
  )
}
