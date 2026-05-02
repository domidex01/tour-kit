/**
 * Side of target element for positioning
 */
export type Side = 'top' | 'bottom' | 'left' | 'right'

/**
 * Alignment along the side
 */
export type Alignment = 'start' | 'center' | 'end'

/**
 * Combined placement (side + optional alignment)
 */
export type Placement = Side | `${Side}-${Alignment}`

/**
 * Point coordinates
 */
export interface Position {
  x: number
  y: number
}

/**
 * Rectangle dimensions
 */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Keyboard navigation configuration
 */
export interface KeyboardConfig {
  enabled?: boolean
  nextKeys?: string[]
  prevKeys?: string[]
  exitKeys?: string[]
  trapFocus?: boolean
}

/**
 * Spotlight/overlay configuration
 */
export interface SpotlightConfig {
  enabled?: boolean
  color?: string
  padding?: number
  borderRadius?: number
  animate?: boolean
  animationDuration?: number
  clickToExit?: boolean
}

/**
 * Storage interface for custom adapters
 */
export interface Storage {
  getItem: (key: string) => string | null | Promise<string | null>
  setItem: (key: string, value: string) => void | Promise<void>
  removeItem: (key: string) => void | Promise<void>
}

/**
 * Active flow session configuration — single tour at a time, scoped to one tab.
 * Differs from `useRoutePersistence`, which is multi-tour cross-route state.
 *
 * @remarks
 * Opt-in: undefined by default. When set, `useFlowSession` will persist the
 * active tour's `(tourId, stepIndex)` so a hard reload resumes it in place.
 */
export interface FlowSessionConfig {
  storage: 'sessionStorage' | 'localStorage'
  /** TTL in ms. Default: 1h for sessionStorage, 24h for localStorage. */
  ttlMs?: number
  /**
   * Storage key (under the configured `keyPrefix`).
   * Default: `'flow:active'` — full key shape `${keyPrefix}:flow:active`.
   * The persisted blob carries its own `tourId`, so a single fixed key is
   * sufficient for the active-tour resume case (one active tour per tab).
   */
  key?: string
}

/**
 * Cross-tab pause/resume gate (BroadcastChannel-based).
 * Pauses the tour in this tab when another tab posts `tour:active`.
 *
 * @remarks
 * Opt-in: undefined by default. Recommended when using `flowSession.storage = 'localStorage'`
 * so a tour started in tab A doesn't double-show after the user closed it in tab B.
 */
export interface CrossTabConfig {
  enabled: boolean
  /** Channel name. Default: `'tourkit:active-flow'`. */
  channel?: string
}

/**
 * Persistence configuration
 */
export interface PersistenceConfig {
  enabled?: boolean
  storage?: 'localStorage' | 'sessionStorage' | 'cookie' | Storage
  keyPrefix?: string
  rememberStep?: boolean
  trackCompleted?: boolean
  dontShowAgain?: boolean
  /**
   * Active flow session — single tour at a time, scoped to one tab.
   * Differs from `useRoutePersistence`, which is multi-tour cross-route state.
   */
  flowSession?: FlowSessionConfig
  /**
   * Cross-tab pause/resume gate (BroadcastChannel-based).
   * Pauses tour in this tab when another tab posts `tour:active`.
   */
  crossTab?: CrossTabConfig
}

/**
 * Accessibility configuration
 */
export interface A11yConfig {
  announceSteps?: boolean
  ariaLive?: 'polite' | 'assertive' | 'off'
  focusTrap?: boolean
  restoreFocus?: boolean
  reducedMotion?: 'respect' | 'always-animate' | 'never-animate'
}

/**
 * Scroll behavior configuration
 */
export interface ScrollConfig {
  enabled?: boolean
  behavior?: 'auto' | 'smooth'
  block?: 'start' | 'center' | 'end' | 'nearest'
  offset?: number
}

/**
 * Text direction for RTL/LTR layouts
 */
export type Direction = 'ltr' | 'rtl' | 'auto'

/**
 * Global TourKit configuration
 */
export interface TourKitConfig {
  keyboard?: KeyboardConfig
  spotlight?: SpotlightConfig
  persistence?: PersistenceConfig
  a11y?: A11yConfig
  scroll?: ScrollConfig
  /**
   * Text direction for RTL/LTR support
   * - 'ltr': Left-to-right (default)
   * - 'rtl': Right-to-left (Arabic, Hebrew, Persian, etc.)
   * - 'auto': Detect from document.dir
   * @default 'auto'
   */
  dir?: Direction
}

// Default configurations
export const defaultKeyboardConfig: Required<KeyboardConfig> = {
  enabled: true,
  nextKeys: ['ArrowRight', 'Enter'],
  prevKeys: ['ArrowLeft'],
  exitKeys: ['Escape'],
  trapFocus: true,
}

export const defaultSpotlightConfig: Required<SpotlightConfig> = {
  enabled: true,
  color: 'rgba(0, 0, 0, 0.5)',
  padding: 8,
  borderRadius: 4,
  animate: true,
  animationDuration: 300,
  clickToExit: false,
}

export const defaultPersistenceConfig: Required<
  Omit<PersistenceConfig, 'storage' | 'flowSession' | 'crossTab'>
> & {
  storage: 'localStorage'
  flowSession?: FlowSessionConfig
  crossTab?: CrossTabConfig
} = {
  enabled: true,
  storage: 'localStorage',
  keyPrefix: 'tourkit',
  rememberStep: true,
  trackCompleted: true,
  dontShowAgain: false,
}

export const defaultA11yConfig: Required<A11yConfig> = {
  announceSteps: true,
  ariaLive: 'polite',
  focusTrap: true,
  restoreFocus: true,
  reducedMotion: 'respect',
}

export const defaultScrollConfig: Required<ScrollConfig> = {
  enabled: true,
  behavior: 'smooth',
  block: 'center',
  offset: 20,
}
