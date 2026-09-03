/**
 * `@tour-kit/core/engine` — the React-free door (v2 §1.2).
 *
 * Everything re-exported here is reachable from the main `@tour-kit/core`
 * entry at the same path with the same signature; nothing moved. What this
 * entry adds is a `.d.ts` chain that never names `react`, `react-dom`, `clsx`,
 * `tailwind-merge` or `zod`, so a Vue/Svelte consumer can typecheck against
 * the engine with `skipLibCheck: false` and none of those installed.
 *
 * Rules this file lives by, each with a test behind it:
 *
 * - **Re-exports and comments only.** No declaration, no side-effect import.
 *   `sideEffects: false` in the manifest is a promise, and a bundler keeps it
 *   only while this file has nothing to run. If you want a helper here, it
 *   belongs in `lib/`.
 * - **Import leaves, never the mixed barrels.** `./lib/i18n` re-exports
 *   `LocaleProvider`/`useT` beside the pure `resolvePlural`, and
 *   `./lib/segmentation` re-exports `SegmentationProvider`/`useSegment` beside
 *   the pure `parseUserIdsFromCsv`. Either one drags React into the shared
 *   chunk this entry and the main entry both read.
 * - **No `cn`, no zod schemas.** `cn` pulls `clsx` + `tailwind-merge`; the
 *   schemas already have their own door at `@tour-kit/core/schemas`.
 *
 * Deliberately absent, and not an oversight: `lib/tour-engine/*`
 * (`navigateToStepImpl`, `handleBranchTargetImpl`, `TourEngineContext`) and
 * `lib/flow-session`'s `serialize`/`parse`. Both are React-free and tempting,
 * but they are internal shapes that §1.3 redesigns when `createTourEngine()`
 * lands — publishing them now would freeze an API a week before it changes.
 *
 * Scope note: until §1.3 adds `createTourEngine()`, this entry exports types,
 * DOM helpers, predicates and validators — no way to *run* a tour. It is
 * infrastructure for §1.3, landed early because it is cheap and additive, not
 * a shippable framework-agnostic capability.
 */

// ── Types (type-only; erased at runtime) ────────────────────────────────────
export type {
  // Branch types
  BranchTarget,
  BranchToTour,
  BranchSkip,
  BranchWait,
  BranchContext,
  BranchResolver,
  Branch,
  UseBranchReturn,
  // Config types
  Side,
  Alignment,
  Placement,
  Position,
  Rect,
  KeyboardConfig,
  SpotlightConfig,
  Storage,
  PersistenceConfig,
  FlowSessionConfig,
  CrossTabConfig,
  A11yConfig,
  ScrollConfig,
  Direction,
  TourKitConfig,
  // Step / target types
  TourStep,
  VisibleTourStep,
  HiddenTourStep,
  StepOptions,
  StepIdOf,
  AudienceProp,
  TourStepMedia,
  TourTarget,
  TourTargetRef,
  TourTargetGetter,
  // React-free structural primitives (v2 §1.1) — structural mirrors of
  // ReactNode / RefObject / Dispatch, so no `React.` namespace is needed.
  TourNode,
  TourElementLike,
  TourRef,
  TourDispatch,
  // Tour + state
  Tour,
  TourOptions,
  TourState,
  TourCallbackContext,
  TourActions,
  TourContextValue,
  // Hints
  HotspotPosition,
  HintConfig,
  HintState,
  HintsState,
  HintsActions,
  HintsContextValue,
  // Router
  RouterAdapter,
  MultiPagePersistenceConfig,
} from '../types'

// Serialized tour shape — the JSON a dashboard or CLI hands the engine.
// Not reachable from `../types`, hence the explicit path; it imports only
// `./config`, so it costs nothing.
export type {
  JsonValue,
  AudienceConditionDefinition,
  AudienceDefinition,
  TourStepDefinition,
  TourDefinition,
} from '../types/tour-definition'

export type { AudienceCondition } from '../types/audience'

export type {
  DiagnosticContext,
  DiagnosticGate,
  EligibilityReport,
  GateCode,
  GateName,
  GateReason,
} from '../types/diagnostic'

// ── Type defaults + discriminators (runtime values) ─────────────────────────
export {
  defaultKeyboardConfig,
  defaultSpotlightConfig,
  defaultPersistenceConfig,
  defaultA11yConfig,
  defaultScrollConfig,
  initialTourState,
  resolveTarget,
  isVisibleStep,
} from '../types'

// ── DOM / storage / a11y utilities ──────────────────────────────────────────
export {
  getElement,
  isElementVisible,
  isElementPartiallyVisible,
  waitForElement,
  getFocusableElements,
  getScrollParent,
  getElementRect,
  getViewportDimensions,
  parsePlacement,
  getOppositeSide,
  getDocumentDirection,
  mirrorSide,
  mirrorAlignment,
  mirrorPlacementForRTL,
  scrollIntoView,
  scrollTo,
  getScrollPosition,
  lockScroll,
  createStorageAdapter,
  createNoopStorage,
  createCookieStorage,
  createMemoryStorage,
  safeJSONParse,
  createPrefixedStorage,
  announce,
  generateId,
  prefersReducedMotion,
  getStepAnnouncement,
  createTour,
  createNamedTour,
  createStep,
  createNamedStep,
  logger,
  MAX_BRANCH_DEPTH,
  isBranchToTour,
  isBranchSkip,
  isBranchWait,
  isSpecialTarget,
  isBranchResolver,
  resolveBranch,
  resolveTargetToIndex,
  isLoopDetected,
  throttleRAF,
  throttleTime,
  throttleLeading,
} from '../utils'
export type {
  LogLevel,
  LoggerConfig,
  ThrottledFunction,
  ThrottledFunctionWithFlush,
} from '../utils'

// ── Validation + cross-page navigation ──────────────────────────────────────
export { TourValidationError, validateTour } from '../lib/validate-tour'
export { TourRouteError, waitForStepTarget } from '../lib/wait-for-step-target'
export type { WaitForStepTargetOptions } from '../lib/wait-for-step-target'

// ── Text: interpolation, i18n key discrimination, plural resolution ─────────
export { interpolate } from '../lib/interpolate'
export type { InterpolateOptions } from '../lib/interpolate'
export { isI18nKey } from '../lib/localized-text'
export type { LocalizedText } from '../lib/localized-text'
// LEAF import — `../lib/i18n` would drag `LocaleProvider` and `useT`.
export { resolvePlural } from '../lib/i18n/plural'

// ── Targeting: audience, frequency, segments ────────────────────────────────
export {
  evaluateAudience,
  explainAudience,
  isSegmentAudience,
  matchesAudience,
  validateConditions,
} from '../lib/audience'
export {
  canShowByFrequency,
  canShowAfterDismissal,
  getViewLimit,
} from '../lib/frequency'
export type { FrequencyRule, FrequencyState } from '../lib/frequency'
// LEAF imports — `../lib/segmentation` would drag `SegmentationProvider`.
export { parseUserIdsFromCsv } from '../lib/segmentation/csv'
export type {
  SegmentDefinition,
  StaticSegment,
  SegmentSource,
} from '../lib/segmentation/types'

// ── Diagnostics ─────────────────────────────────────────────────────────────
export { BUILTIN_GATE_ORDER, explainTour } from '../lib/diagnostic'
