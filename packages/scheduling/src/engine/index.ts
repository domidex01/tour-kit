/**
 * `@tour-kit/scheduling/engine` — the React-free door (v3 Phase 0).
 *
 * Everything here is reachable from the main entry at the same path with the
 * same signature; nothing moved. What this entry adds is a runtime and a
 * `.d.ts` chain that never name `react`, `react-dom`, `@tour-kit/license` or
 * `@tour-kit/analytics`, so a Vue, Svelte or Node consumer can evaluate a
 * schedule with none of them installed.
 *
 * Rules, each with a test behind it (`no-react-in-engine-dist.test.ts`,
 * `subpath-resolution.test.ts`):
 * - Re-exports and comments only. No declaration, no side-effect import —
 *   `sideEffects: false` in the manifest is only true while nothing runs here.
 * - Never `../components/schedule-gate` (React + LicenseGate), never
 *   `../hooks/*` (React, and `@tour-kit/analytics` behind them), never
 *   `../index`.
 * - The built file names NO bare specifier at all. This package depends on
 *   nothing at runtime, and the guard pins that stronger property rather than
 *   enumerating what it must not import.
 *
 * `export *` is safe here, where the core rule is "import leaves, never the
 * mixed barrels": that rule is about barrels that mix React in, and neither of
 * these does. `../utils` is values-only (24 functions + `DAY_GROUPS`) and
 * `../types` is types plus two constants (`DAY_NAMES`,
 * `BUSINESS_HOURS_PRESETS`), with zero name overlap between them — so the two
 * star-exports cannot collide.
 *
 * There is no `createSchedulingEngine` and there should not be: this package
 * has no engine object, it is twenty-four pure functions and three constants.
 * Naming things the recipe's way when they are not the recipe's shape is how
 * v2 §1.5 shipped three copies of the spotlight machine.
 */
export * from '../utils'
export * from '../types'
