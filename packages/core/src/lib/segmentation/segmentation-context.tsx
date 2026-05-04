'use client'
import { createContext, useContext, useMemo } from 'react'
import type { SegmentationContextValue, SegmentationProviderProps } from './types'

const Ctx = createContext<SegmentationContextValue>({ segments: {} })

export function SegmentationProvider({
  children,
  segments,
  userContext,
  currentUserId,
}: SegmentationProviderProps) {
  // Destructure props at the parameter level so the memo closure captures
  // exactly what the deps list declares — equivalent to the plan's
  // `[value.segments, value.userContext, value.currentUserId]` (big plan
  // line 341), but lints cleanly under useExhaustiveDependencies.
  const memo = useMemo<SegmentationContextValue>(
    () => ({ segments, userContext, currentUserId }),
    [segments, userContext, currentUserId]
  )
  return <Ctx.Provider value={memo}>{children}</Ctx.Provider>
}

export function useSegmentationContext() {
  return useContext(Ctx)
}

// Re-export the canonical types so consumers can import them from this module
// or via the segmentation barrel. Single source of truth lives in `./types`.
export type {
  SegmentDefinition,
  StaticSegment,
  SegmentSource,
  SegmentationContextValue,
  SegmentationProviderProps,
} from './types'
