import type * as React from 'react'
import { cn } from '../../utils/cn'
import { TourClose } from '../navigation/tour-close'

interface TourCardHeaderProps {
  title?: React.ReactNode
  titleId: string
  showClose?: boolean
  className?: string
}

export function TourCardHeader({
  title,
  titleId,
  showClose = true,
  className,
}: TourCardHeaderProps) {
  if (!title && !showClose) return null

  return (
    <div className={cn('flex items-start justify-between gap-2', className)}>
      {title && (
        <h3 id={titleId} className="font-semibold leading-none tracking-tight">
          {title}
        </h3>
      )}
      {showClose && <TourClose />}
    </div>
  )
}
