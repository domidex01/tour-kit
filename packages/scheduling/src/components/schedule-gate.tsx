import { LicenseGate } from '@tour-kit/license'
import type * as React from 'react'

interface ScheduleGateProps {
  children: React.ReactNode
}

export function ScheduleGate({ children }: ScheduleGateProps) {
  return <LicenseGate require="pro">{children}</LicenseGate>
}
