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
export { cn } from './lib/utils'
export { Slot, Slottable } from './lib/slot'

// ============================================
// ENGINE (for advanced usage)
// ============================================
export { emitFeatureEvent } from './engine/usage-tracker'

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
