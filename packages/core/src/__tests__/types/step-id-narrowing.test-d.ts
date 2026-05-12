/**
 * US-1 — const-authored tours narrow `goToStep('id')` to the literal step ids.
 *
 * Removing any `@ts-expect-error` line below MUST cause
 * `pnpm --filter @tour-kit/core typecheck:types` to exit non-zero. That is
 * the harness self-check the spec relies on.
 */
import type { StepIdOf, TourStep } from '@tour-kit/core'

// Canonical narrowing pattern from spec §2.2.2: const tuple + satisfies.
const steps = [
  { id: 'welcome', target: '#a', content: 'a' },
  { id: 'pricing', target: '#b', content: 'b' },
] as const satisfies ReadonlyArray<TourStep>

type Ids = StepIdOf<typeof steps>

// Forward assignability: literal-in-union assigns ok.
const ok: Ids = 'welcome'
void ok

// @ts-expect-error misspelling — removing this line MUST break typecheck:types.
const bad: Ids = 'biling'
void bad

// Reverse assignability: `Ids` is exactly `'welcome' | 'pricing'`, no wider.
declare const onlyTwo: Ids
const _w: 'welcome' | 'pricing' = onlyTwo
void _w

// And the union must not be `string` — proves the default `TId = string` did
// NOT swallow our literal narrowing.
type _NotStringUnion = string extends Ids ? 'wide' : 'narrow'
const _proof: _NotStringUnion = 'narrow'
void _proof
