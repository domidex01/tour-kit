import { cn } from '../../utils/cn'

interface TourProgressProps {
  current: number
  total: number
  variant?: 'dots' | 'bar' | 'text'
  className?: string
}

export function TourProgress({ current, total, variant = 'dots', className }: TourProgressProps) {
  if (variant === 'text') {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>
        {current} of {total}
      </span>
    )
  }

  if (variant === 'bar') {
    const percentage = (current / total) * 100
    return (
      <div className={cn('h-1.5 w-20 overflow-hidden rounded-full bg-secondary', className)}>
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }

  return (
    <div className={cn('flex gap-1', className)}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            i + 1 === current ? 'bg-primary' : 'bg-secondary'
          )}
        />
      ))}
    </div>
  )
}
