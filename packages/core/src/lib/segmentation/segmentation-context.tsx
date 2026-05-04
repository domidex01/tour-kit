'use client'
import { type ReactNode, createContext, useContext, useMemo } from 'react'
import type { AudienceCondition } from '../../types/audience'

export type SegmentDefinition = AudienceCondition[] // AND-joined; OR via multiple named segments
export interface StaticSegment {
  type: 'static'
  userIds: ReadonlyArray<string>
}
export type SegmentSource = SegmentDefinition | StaticSegment

export interface SegmentationContextValue {
  segments: Record<string, SegmentSource>
  userContext?: Record<string, unknown>
  currentUserId?: string
}

const Ctx = createContext<SegmentationContextValue>({ segments: {} })

export interface SegmentationProviderProps extends SegmentationContextValue {
  children: ReactNode
}
export function SegmentationProvider({ children, ...value }: SegmentationProviderProps) {
  const memo = useMemo(() => value, [value.segments, value.userContext, value.currentUserId])
  return <Ctx.Provider value={memo}>{children}</Ctx.Provider>
}
export function useSegmentationContext() {
  return useContext(Ctx)
}
