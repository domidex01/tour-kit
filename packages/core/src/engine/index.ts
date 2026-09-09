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
 * Since v2 §1.3 this entry can *run* a tour: `createTourEngine()` returns a
 * plain-JavaScript engine with no React, no DOM and no bundler required.
 * §1.2 shipped the door; §1.3 is what made it a capability rather than
 * infrastructure. §1.3b added what a binding needs to *show* one — trap focus
 * in a card, wire the keys, follow the target through scroll and resize, cut
 * the spotlight hole and auto-advance on a click — as plain functions a Vue,
 * Svelte or vanilla binding attaches around its own rendering.
 *
 * Since v2 §1.5 it also publishes the *binding contract*: `createEngineHandle`
 * and `pickActions`, the two pieces every one of the three providers is built
 * from. §1.5 is what named them — two non-React bindings needed exactly this
 * and nothing more.
 *
 * Still deliberately absent, and not an oversight: the port itself
 * (`TourEngineContext`), the four persistence/broadcast factories, and the
 * impls behind it (`navigateToStepImpl`, `handleBranchTargetImpl`,
 * `applyTransitionEffects`). They are the seam two adapters implement, not a
 * consumer API — §1.4 and §1.5 said which parts a binding actually needs, and
 * these were not on the list.
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
  RouteMatchMode,
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

// ── The engine (v2 §1.3) ────────────────────────────────────────────────────
// LEAF imports. `../lib/tour-engine/create-tour-engine` pulls the reducer,
// boot resolver, actions, transition effects and the four storage adapters —
// all React-free, all guarded by no-react-in-engine-{dist,types}.
export { createTourEngine } from '../lib/tour-engine/create-tour-engine'
export type {
  CreateTourEngineOptions,
  TourEngine,
} from '../lib/tour-engine/create-tour-engine'
export { resolveBootStart } from '../lib/tour-engine/boot'
export type {
  BootDecision,
  BootSource,
  ResolveBootStartInput,
} from '../lib/tour-engine/boot'

// ── The binding contract (v2 §1.5) ──────────────────────────────────────────
// What §1.4's React provider and §1.5's Vue/Svelte providers all sit on. The
// handle is React-free (it imports only `initialTourState` and types), and its
// three rules — nothing constructs during setup, `release()` not `destroy()`,
// stable verb identity — are the rules every binding needs, not React's alone.
// See `lib/tour-engine/engine-handle.ts` for why.
export {
  INITIAL_SNAPSHOT,
  createEngineHandle,
  pickActions,
} from '../lib/tour-engine/engine-handle'
export type { EngineHandle } from '../lib/tour-engine/engine-handle'
// v3 Phase 1 — the engine-agnostic half of the handle. `createEngineHandle` is
// this plus the seventeen tour verbs; a package with its own engine (hints,
// checklists…) composes `createHandle` with its own instead of writing a
// second lifecycle.
export { createHandle } from '../lib/tour-engine/engine-handle'
export type { EngineLike, Handle } from '../lib/tour-engine/engine-handle'
export type { TourEngineLiveOptions } from '../lib/tour-engine/create-tour-engine'
export type { TourEngineAnalytics } from '../lib/tour-engine/context'
// The option bag all three bindings take, and the two splits it feeds the
// engine. Derived from `CreateTourEngineOptions`, never redeclared — §1.5
// shipped three hand-maintained copies of these field lists before §1.5f.
export { engineOptionsFrom, liveOptionsFrom } from '../lib/tour-engine/binding-options'
export type { BindingOptions } from '../lib/tour-engine/binding-options'
// The one `matchRoute` comparison. Five adapters had their own copy.
export { matchRoutePattern } from '../lib/match-route'

// ── DOM behaviours (v2 §1.3b) ───────────────────────────────────────────────
// LEAF imports. These are view behaviours a binding ATTACHES, not engine
// state, which is why they live as flat `lib/` leaves rather than under
// `lib/tour-engine/`. Every one is React-free and DOM-only; each returns a
// detach/stop/release that is safe to call twice, and none subscribes to
// anything except `attachAdvanceOn`, which returns its own unsubscribe.
export { createFocusTrap } from '../lib/focus-trap'
export type { FocusTrap, FocusTrapOptions } from '../lib/focus-trap'
export { attachKeyboard } from '../lib/keyboard'
export type { AttachKeyboardOptions, KeyboardActions } from '../lib/keyboard'
export { trackRect } from '../lib/track-rect'
export type { RectTracker, TrackRectOptions } from '../lib/track-rect'
export { computeSpotlight, createSpotlight } from '../lib/spotlight'
export type {
  SpotlightController,
  SpotlightSnapshot,
  SpotlightCutoutStyle,
  SpotlightOverlayStyle,
  SpotlightStyles,
} from '../lib/spotlight'
export { attachAdvanceOn, bindStepAdvance, dispatchAdvanceEvent } from '../lib/advance-on'
export type { AdvanceOnTarget } from '../lib/advance-on'
export { attachTestBridge } from '../lib/test-bridge'
export type { AttachTestBridgeOptions, TestBridgeTarget } from '../lib/test-bridge'
