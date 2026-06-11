/**
 * Shared types for the capability marketing pages (/product-tours,
 * /feature-hints, /onboarding-checklists, /product-announcements,
 * /in-app-surveys). One page per buyer intent — see
 * utk-studio/plan/marketing-package-pages.md for the SEO layering rules.
 */

export type CapabilitySlug = 'tours' | 'hints' | 'checklists' | 'announcements' | 'surveys'

/**
 * Per-page funnel placements, extending the home `CtaPlacement` convention:
 * `<slug>_hero` → `<slug>_after_features` → `<slug>_footer` measures pull at
 * each scroll depth separately in GA4.
 */
export type CapabilityCtaPlacement = `${CapabilitySlug}_${'hero' | 'after_features' | 'footer'}`

export interface CapabilityFaqItem {
  question: string
  answer: string
}

/** One "status quo pain → outcome with userTourKit" mapping. */
export interface PainOutcome {
  pain: string
  painDetail: string
  outcome: string
  outcomeDetail: string
}

/** One card in the 6-up feature grid. */
export interface CapabilityFeature {
  title: string
  description: string
  /**
   * Optional supporting-package callout ("@tour-kit/media"). Supporting
   * packages surface as feature rows instead of getting their own thin
   * marketing pages (cannibalization rule).
   */
  packageBadge?: string
}

/** One row in the 3-row comparison excerpt. */
export interface ComparisonTeaserRow {
  label: string
  tourKit: string
  saas: string
  oss: string
}

/** Sibling capability page for the "Pairs well with" cross-link band. */
export interface SiblingCapability {
  label: string
  href: string
  description: string
}
