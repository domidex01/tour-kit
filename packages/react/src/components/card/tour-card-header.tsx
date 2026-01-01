import type * as React from 'react'
import { cn } from '../../utils/cn'
import { TourClose } from '../navigation/tour-close'

interface TourCardHeaderProps {
  title?: React.ReactNode
  titleId: string
  showClose?: boolean
  className?: string
  unstyled?: boolean
}

export function TourCardHeader({
  title,
  titleId,
  showClose = true,
  className,
  unstyled = false,
}: TourCardHeaderProps) {
  if (!title && !showClose) return null

  const headerCssVarStyles: React.CSSProperties = unstyled
    ? {}
    : {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.5rem',
      }

  const titleCssVarStyles: React.CSSProperties = unstyled
    ? {}
    : {
        margin: 0,
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.25,
      }

  return (
    <div
      className={cn(!unstyled && 'flex items-start justify-between gap-2', className)}
      style={headerCssVarStyles}
    >
      {title && (
        <h3
          id={titleId}
          className={cn(!unstyled && 'font-semibold leading-none tracking-tight')}
          style={titleCssVarStyles}
        >
          {title}
        </h3>
      )}
      {showClose && <TourClose unstyled={unstyled} />}
    </div>
  )
}
