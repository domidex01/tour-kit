'use client'

import type * as React from 'react'
import { useFeature } from '../hooks'

interface IfNotAdoptedProps {
  /** Feature ID to check */
  featureId: string
  /** Content to render if feature is not adopted */
  children: React.ReactNode
  /** Content to render if feature IS adopted */
  fallback?: React.ReactNode
}

/**
 * Conditionally render content based on feature adoption status
 */
export function IfNotAdopted({ featureId, children, fallback = null }: IfNotAdoptedProps) {
  const { isAdopted } = useFeature(featureId)

  if (isAdopted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Conditionally render content only if feature IS adopted
 */
export function IfAdopted({ featureId, children, fallback = null }: IfNotAdoptedProps) {
  const { isAdopted } = useFeature(featureId)

  if (!isAdopted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
