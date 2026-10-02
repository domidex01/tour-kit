/**
 * `@tour-kit/analytics/engine` — the React-free door (v3 Phase 0).
 *
 * Everything here is reachable from the main entry at the same path with the
 * same signature; nothing moved. What this entry adds is a runtime and a
 * `.d.ts` chain that never name `react` or `react-dom`, so a Vue, Svelte or
 * Node consumer can build and typecheck against the tracker and the plugins
 * with neither installed.
 *
 * Rules, each with a test behind it (`no-react-in-engine-dist.test.ts`,
 * `subpath-resolution.test.ts`):
 * - Re-exports and comments only. No declaration, no side-effect import —
 *   `sideEffects: false` in the manifest is only true while nothing runs here.
 * - Never `./core/context` (React) and never `./index`.
 * - `logger` reaches this closure through `@tour-kit/core/engine`, never the
 *   bare main entry (0.1a); a bare import puts core's React barrel in a
 *   Vue consumer's resolution graph.
 * - `createEventQueue` stays internal; it is the tracker's seam, not an API.
 */
export { TourAnalytics, createAnalytics } from '../core/tracker'
export { consolePlugin } from '../plugins/console'
export { posthogPlugin } from '../plugins/posthog'
export { mixpanelPlugin } from '../plugins/mixpanel'
export { amplitudePlugin } from '../plugins/amplitude'
export { googleAnalyticsPlugin } from '../plugins/google-analytics'
export type { TourEvent, TourEventName, TourEventData } from '../types/events'
export type { AnalyticsPlugin, AnalyticsConfig } from '../types/plugin'
