import { LicenseGate } from '@tour-kit/license'
import type * as React from 'react'

interface ScheduleGateProps {
  children: React.ReactNode
}

/**
 * Renders children only when the consumer holds a valid Pro license.
 *
 * This is a thin convenience wrapper over `<LicenseGate require="pro">` — it
 * does NOT evaluate a schedule. To gate UI on schedule activity, evaluate
 * `isScheduleActive(schedule)` (or `useScheduleStatus`) and branch in your own
 * render. `ScheduleGate` only fences the scheduling feature behind the Pro tier.
 */
export function ScheduleGate({ children }: ScheduleGateProps) {
  return <LicenseGate require="pro">{children}</LicenseGate>
}
