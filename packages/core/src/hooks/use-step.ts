import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { TourContext } from '../context/tour-context'
import { useElementPosition } from './use-element-position'

export interface UseStepReturn {
  isActive: boolean
  isVisible: boolean
  hasCompleted: boolean
  targetElement: HTMLElement | null
  targetRect: DOMRect | null
  show: () => void
  hide: () => void
  complete: () => void
}

export function useStep(stepId: string): UseStepReturn {
  const context = useContext(TourContext)

  if (!context) {
    throw new Error('useStep must be used within a TourProvider')
  }

  const { currentStep, goTo, tour, next } = context

  const step = tour?.steps.find((s) => s.id === stepId)
  const stepIndex = tour?.steps.findIndex((s) => s.id === stepId) ?? -1

  const isActive = currentStep?.id === stepId
  const [isVisible, setIsVisible] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)

  const target = step?.target
  const targetSelector = typeof target === 'string' ? target : null
  const targetRef = typeof target === 'object' ? target?.current : null

  const { element: targetElement, rect: targetRect } = useElementPosition(
    targetSelector ?? targetRef
  )

  useEffect(() => {
    if (isActive) {
      setIsVisible(true)
    }
  }, [isActive])

  const show = useCallback(() => {
    if (stepIndex >= 0) {
      goTo(stepIndex)
    }
  }, [goTo, stepIndex])

  const hide = useCallback(() => {
    setIsVisible(false)
  }, [])

  const complete = useCallback(() => {
    setHasCompleted(true)
    next()
  }, [next])

  return useMemo(
    () => ({
      isActive,
      isVisible,
      hasCompleted,
      targetElement,
      targetRect,
      show,
      hide,
      complete,
    }),
    [isActive, isVisible, hasCompleted, targetElement, targetRect, show, hide, complete]
  )
}
