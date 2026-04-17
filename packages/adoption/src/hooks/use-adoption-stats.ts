'use client'

import * as React from 'react'
import { useAdoptionContext } from '../context/adoption-context'
import { createInitialUsage } from '../engine'
import type { AdoptionStatus, FeatureWithUsage } from '../types'

export interface AdoptionStats {
  /** All features with their usage data */
  features: FeatureWithUsage[]
  /** Overall adoption rate (0-100) */
  adoptionRate: number
  /** Number of adopted features */
  adoptedCount: number
  /** Total number of features */
  totalCount: number
  /** Features grouped by status */
  byStatus: Record<AdoptionStatus, FeatureWithUsage[]>
  /** Features grouped by category */
  byCategory: Record<string, { adopted: number; total: number; rate: number }>
}

function groupByStatus(
  featuresWithUsage: FeatureWithUsage[]
): Record<AdoptionStatus, FeatureWithUsage[]> {
  const byStatus: Record<AdoptionStatus, FeatureWithUsage[]> = {
    not_started: [],
    exploring: [],
    adopted: [],
    churned: [],
  }
  for (const f of featuresWithUsage) {
    byStatus[f.usage.status].push(f)
  }
  return byStatus
}

function groupByCategory(
  featuresWithUsage: FeatureWithUsage[]
): Record<string, { adopted: number; total: number; rate: number }> {
  const byCategory: Record<string, { adopted: number; total: number; rate: number }> = {}
  for (const f of featuresWithUsage) {
    const category = f.category ?? 'uncategorized'
    if (!byCategory[category]) {
      byCategory[category] = { adopted: 0, total: 0, rate: 0 }
    }
    byCategory[category].total++
    if (f.usage.status === 'adopted') {
      byCategory[category].adopted++
    }
  }
  // Calculate rates
  for (const cat of Object.values(byCategory)) {
    cat.rate = cat.total > 0 ? (cat.adopted / cat.total) * 100 : 0
  }
  return byCategory
}

/**
 * Hook to get overall adoption statistics
 */
export function useAdoptionStats(): AdoptionStats {
  const { features, usageMap } = useAdoptionContext()

  return React.useMemo(() => {
    const featuresWithUsage: FeatureWithUsage[] = features.map((feature) => ({
      ...feature,
      usage: usageMap[feature.id] ?? createInitialUsage(feature.id),
    }))

    const adoptedCount = featuresWithUsage.filter((f) => f.usage.status === 'adopted').length
    const totalCount = features.length
    const adoptionRate = totalCount > 0 ? (adoptedCount / totalCount) * 100 : 0

    return {
      features: featuresWithUsage,
      adoptionRate,
      adoptedCount,
      totalCount,
      byStatus: groupByStatus(featuresWithUsage),
      byCategory: groupByCategory(featuresWithUsage),
    }
  }, [features, usageMap])
}
