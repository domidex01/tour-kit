/**
 * The option bag every binding accepts, and the two splits it feeds the engine.
 *
 * v2 §1.4 wrote `optionsFrom` / `liveFrom` inside `tour-provider.tsx`; §1.5
 * copied them, byte for byte, into `@tour-kit/vue` and `@tour-kit/svelte`, and
 * duplicated the option interface beside them. Three hand-maintained field
 * lists over one type is a drift machine: `CreateTourEngineOptions` gains a
 * field, two of the three lists get updated, and nothing fails.
 *
 * So both splits live here, and the source type is **derived** from
 * `CreateTourEngineOptions` rather than declared — the same trick
 * `TourEngineLiveOptions` already uses. A new engine option shows up in
 * `BindingOptions` automatically; a renamed one stops compiling here rather
 * than silently going unread in two bindings.
 *
 * @module tour-engine/binding-options
 */
import type { KeyboardConfig } from '../../types/config'
import type { CreateTourEngineOptions, TourEngineLiveOptions } from './create-tour-engine'

/**
 * What a binding takes from its consumer.
 *
 * `tours` is required; everything the engine can default is optional. The two
 * keys past `CreateTourEngineOptions` are the binding's own concerns — a
 * headless consumer renders their own card, so nothing else would wire the
 * keyboard, and the test bridge is a binding-level dev affordance.
 *
 * `storage` is deliberately absent: it is an engine construction detail a
 * consumer sets through `persistence`, and exposing it on every binding's
 * public props would freeze an internal shape.
 */
export interface BindingOptions
  extends Partial<Omit<CreateTourEngineOptions, 'tours' | 'storage'>> {
  tours: CreateTourEngineOptions['tours']
  /**
   * `false` disables keyboard navigation; an object customises it. Default: on.
   *
   * React consumers get `Escape` for free because `<TourCard>` calls
   * `useKeyboardNavigation()` itself. A headless consumer renders their own
   * card, so the binding wires the keys or nobody does.
   */
  keyboard?: boolean | KeyboardConfig
  /** Dev-only `window.__tourKit__`. Default `false`. */
  enableTestBridge?: boolean
}

/**
 * The construction split — read ONCE, at `ensure()` time.
 *
 * `persistence` and `routePersistence` are in here rather than in
 * {@link liveOptionsFrom} on purpose. The engine builds four storage adapters
 * from them at construction and those adapters carry pending throttled writes,
 * so honouring a mid-tour config swap means rebuilding all four and deciding
 * what happens to the writes in flight. Nobody has asked; the docs never
 * suggest it. Upgrade path if they do: `engine.setPersistence(config)` beside
 * `setOptions`.
 */
export function engineOptionsFrom(src: BindingOptions): CreateTourEngineOptions {
  return {
    tours: src.tours,
    router: src.router,
    routePersistence: src.routePersistence,
    persistence: src.persistence,
    autoNavigate: src.autoNavigate,
    analytics: src.analytics ?? undefined,
    onNavigationRequired: src.onNavigationRequired,
    onStepError: src.onStepError,
    onTourPaused: src.onTourPaused,
  }
}

/**
 * The live split — pushed whenever the consumer's props change identity.
 *
 * Every built-in router adapter is a `useMemo` (or a Vue getter) over host
 * router state, so freezing `router` at construction navigates through a dead
 * adapter after the first route change.
 */
export function liveOptionsFrom(src: BindingOptions): TourEngineLiveOptions {
  return {
    router: src.router,
    autoNavigate: src.autoNavigate,
    analytics: src.analytics ?? undefined,
    onNavigationRequired: src.onNavigationRequired,
    onStepError: src.onStepError,
    onTourPaused: src.onTourPaused,
  }
}
