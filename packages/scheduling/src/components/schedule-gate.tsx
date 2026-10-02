import type * as React from 'react'

interface ScheduleGateProps {
  children: React.ReactNode
}

/**
 * @deprecated Renders its children unchanged. It used to fence scheduling
 * behind the Pro licence; Tour Kit is MIT now, so there is nothing to gate.
 * Kept so existing imports still compile. It never evaluated a schedule — to
 * gate UI on schedule activity, use `isScheduleActive(schedule)` or
 * `useScheduleStatus` and branch in your own render.
 */
export function ScheduleGate({ children }: ScheduleGateProps) {
  return <>{children}</>
}
