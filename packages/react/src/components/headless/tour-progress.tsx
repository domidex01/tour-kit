'use client'

import type * as React from 'react'

export interface TourProgressHeadlessProps {
  current: number
  total: number
  variant?: 'dots' | 'bar' | 'text'
  className?: string
  style?: React.CSSProperties
  /** Render prop */
  render?: (props: TourProgressRenderProps) => React.ReactNode
}

export interface TourProgressRenderProps {
  current: number
  total: number
  percentage: number
}

export function TourProgressHeadless({
  current,
  total,
  variant = 'dots',
  className,
  style,
  render,
}: TourProgressHeadlessProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0
  const renderProps: TourProgressRenderProps = { current, total, percentage }

  if (render) {
    return <>{render(renderProps)}</>
  }

  if (variant === 'text') {
    return (
      <span className={className} style={style}>
        {current} of {total}
      </span>
    )
  }

  if (variant === 'bar') {
    return (
      <div className={className} style={style}>
        <div style={{ width: `${percentage}%` }} />
      </div>
    )
  }

  // Dots variant (default)
  return (
    <div className={className} style={style}>
      {Array.from({ length: total }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Static progress dots never reorder
        <div key={i} data-active={i + 1 === current} />
      ))}
    </div>
  )
}
