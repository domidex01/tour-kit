import { ProGate } from '@tour-kit/license'
import type * as React from 'react'

interface ScheduleGateProps {
  children: React.ReactNode
}

export function ScheduleGate({ children }: ScheduleGateProps) {
  return <ProGate package="@tour-kit/scheduling">{children}</ProGate>
}
