'use client'

import type * as React from 'react'

export interface TourNavigationHeadlessProps {
  isFirstStep: boolean
  isLastStep: boolean
  onPrev: () => void
  onNext: () => void
  onSkip?: () => void
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  /** Labels */
  prevLabel?: string
  nextLabel?: string
  finishLabel?: string
  skipLabel?: string
  /** Render prop */
  render?: (props: TourNavigationRenderProps) => React.ReactNode
}

export interface TourNavigationRenderProps {
  isFirstStep: boolean
  isLastStep: boolean
  onPrev: () => void
  onNext: () => void
  onSkip?: () => void
  prevLabel: string
  nextLabel: string
  finishLabel: string
  skipLabel: string
}

export function TourNavigationHeadless({
  isFirstStep,
  isLastStep,
  onPrev,
  onNext,
  onSkip,
  className,
  style,
  children,
  prevLabel = 'Back',
  nextLabel = 'Next',
  finishLabel = 'Finish',
  skipLabel = 'Skip',
  render,
}: TourNavigationHeadlessProps) {
  const renderProps: TourNavigationRenderProps = {
    isFirstStep,
    isLastStep,
    onPrev,
    onNext,
    onSkip,
    prevLabel,
    nextLabel,
    finishLabel,
    skipLabel,
  }

  if (render) {
    return <>{render(renderProps)}</>
  }

  return (
    <div className={className} style={style}>
      {children || (
        <>
          {onSkip && !isLastStep && (
            <button type="button" onClick={onSkip}>
              {skipLabel}
            </button>
          )}
          {!isFirstStep && (
            <button type="button" onClick={onPrev}>
              {prevLabel}
            </button>
          )}
          <button type="button" onClick={onNext}>
            {isLastStep ? finishLabel : nextLabel}
          </button>
        </>
      )}
    </div>
  )
}
