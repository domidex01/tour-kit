import type * as React from 'react'
import { ProWatermark } from '../lib/pro-watermark'

interface ScheduleGateProps {
  children: React.ReactNode
}

export function ScheduleGate({ children }: ScheduleGateProps) {
  return <ProWatermark>{children}</ProWatermark>
}
