import type * as React from 'react'
import { ProGate } from '@tour-kit/license'

interface ScheduleGateProps {
  children: React.ReactNode
}

export function ScheduleGate({ children }: ScheduleGateProps) {
  return <ProGate package="@tour-kit/scheduling">{children}</ProGate>
}
