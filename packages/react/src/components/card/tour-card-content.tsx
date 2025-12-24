import type * as React from 'react'
import { cn } from '../../utils/cn'

interface TourCardContentProps {
  content: React.ReactNode
  className?: string
}

export function TourCardContent({ content, className }: TourCardContentProps) {
  return <div className={cn('py-3 text-sm text-muted-foreground', className)}>{content}</div>
}
