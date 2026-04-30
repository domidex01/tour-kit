// ============================================
// PROVIDER & CONTEXT
// ============================================
export { AdoptionProvider } from './context/adoption-provider'
export { useAdoptionContext } from './context/adoption-context'

// ============================================
// HOOKS
// ============================================
export { useFeature, type UseFeatureReturn } from './hooks/use-feature'
export { useAdoptionStats, type AdoptionStats } from './hooks/use-adoption-stats'
export { useNudge, type UseNudgeReturn } from './hooks/use-nudge'

// ============================================
// COMPONENTS
// ============================================
export {
  AdoptionNudge,
  type AdoptionNudgeProps,
  type NudgeRenderProps,
} from './components/adoption-nudge'
export { FeatureButton, type FeatureButtonProps } from './components/feature-button'
export { IfNotAdopted, IfAdopted } from './components/if-not-adopted'
export { NewFeatureBadge, type NewFeatureBadgeProps } from './components/new-feature-badge'

// ============================================
// UI VARIANTS (for customization)
// ============================================
export {
  adoptionNudgeVariants,
  featureButtonVariants,
  newFeatureBadgeVariants,
  type AdoptionNudgeVariants,
  type FeatureButtonVariants,
  type NewFeatureBadgeVariants,
} from './components/ui'

// ============================================
// UTILITIES
// ============================================
export { cn } from '@tour-kit/core'
export { Slot, Slottable, UnifiedSlot, type UnifiedSlotProps } from './lib/slot'

// UI Library Provider (Base UI support)
export {
  UILibraryProvider,
  useUILibrary,
  type UILibrary,
  type UILibraryProviderProps,
} from './lib/ui-library-context'

// ============================================
// ENGINE (for advanced usage)
// ============================================
export { emitFeatureEvent } from './engine/usage-tracker'

// ============================================
// ANALYTICS HELPERS
// ============================================
export {
  useAdoptionAnalytics,
  buildFeatureAdoptedEvent,
  buildFeatureChurnedEvent,
  buildFeatureUsedEvent,
  buildNudgeClickedEvent,
  buildNudgeDismissedEvent,
  buildNudgeShownEvent,
} from './analytics'

// ============================================
// TYPES
// ============================================
export type {
  Feature,
  FeatureTrigger,
  AdoptionCriteria,
  FeatureResources,
  FeatureUsage,
  AdoptionStatus,
  FeatureWithUsage,
  StorageConfig,
  NudgeConfig,
  AdoptionProviderProps,
} from './types'

// ============================================
// DASHBOARD COMPONENTS
// ============================================
export {
  AdoptionDashboard,
  AdoptionStatCard,
  AdoptionStatsGrid,
  AdoptionTable,
  AdoptionCategoryChart,
  AdoptionStatusBadge,
  AdoptionFilters,
} from './components/dashboard'

export type {
  AdoptionDashboardProps,
  AdoptionStatCardProps,
  AdoptionStatsGridProps,
  AdoptionTableProps,
  AdoptionCategoryChartProps,
  AdoptionStatusBadgeProps,
  AdoptionFiltersProps,
  AdoptionFiltersState,
} from './components/dashboard'
