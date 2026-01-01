import type * as React from 'react'
import { cn } from '../../utils/cn'

interface TourCardContentProps {
  content: React.ReactNode
  className?: string
  unstyled?: boolean
}

export function TourCardContent({ content, className, unstyled = false }: TourCardContentProps) {
  const cssVarStyles: React.CSSProperties = unstyled
    ? {}
    : {
        padding: '0.75rem 0',
        color: 'var(--tour-muted-fg, #737373)',
      }

  return (
    <div
      className={cn(!unstyled && 'py-3 text-sm text-muted-foreground', className)}
      style={cssVarStyles}
    >
      {content}
    </div>
  )
}
