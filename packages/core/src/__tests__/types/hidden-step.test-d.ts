// Phase 3 (refactor train) — Hidden-step type tightening.
//
// Vitest doesn't run `*.test-d.ts` files at runtime — they're compiled by
// `pnpm --filter @tour-kit/core typecheck:types`. The `@ts-expect-error`
// directives FAIL the build if the offending statement still compiles.

import { expectTypeOf } from 'vitest'
import type { HiddenTourStep, TourStep, VisibleTourStep } from '../../types/step'

// ─── Visible authoring compiles ─────────────────────────────────────────────
const visible: VisibleTourStep = {
  id: 'v1',
  target: '#anchor',
  content: 'Hi',
  title: 'Welcome',
  placement: 'bottom',
  advanceOn: { event: 'click', selector: '#next' },
}
expectTypeOf(visible).toMatchTypeOf<VisibleTourStep>()

// Visible step without optional UI fields still compiles
const visibleMinimal: VisibleTourStep = { id: 'v2', target: '#x', content: 'x' }
expectTypeOf(visibleMinimal).toMatchTypeOf<VisibleTourStep>()

// ─── Hidden authoring without UI fields compiles ────────────────────────────
const hidden: HiddenTourStep = { id: 'h1', kind: 'hidden' }
expectTypeOf(hidden).toMatchTypeOf<HiddenTourStep>()

// Hidden step with lifecycle / branching callbacks compiles
const hiddenWithLifecycle: HiddenTourStep = {
  id: 'h2',
  kind: 'hidden',
  onEnter: async () => {},
  onNext: 'next-step',
}
expectTypeOf(hiddenWithLifecycle).toMatchTypeOf<HiddenTourStep>()

// ─── Hidden authoring with forbidden UI fields fails ────────────────────────
// @ts-expect-error — hidden step cannot have `target`
const _bad1: HiddenTourStep = { id: 'h3', kind: 'hidden', target: '#x' }

// @ts-expect-error — hidden step cannot have `content`
const _bad2: HiddenTourStep = { id: 'h4', kind: 'hidden', content: 'x' }

// @ts-expect-error — hidden step cannot have `title`
const _bad3: HiddenTourStep = { id: 'h5', kind: 'hidden', title: 'Nope' }

// @ts-expect-error — hidden step cannot have `placement`
const _bad4: HiddenTourStep = { id: 'h6', kind: 'hidden', placement: 'bottom' }

// prettier-ignore
// @ts-expect-error — hidden step cannot have `advanceOn`
const _bad5: HiddenTourStep = { id: 'h7', kind: 'hidden', advanceOn: { event: 'click' } }

// ─── Mixed TourStep[] accepts both branches ─────────────────────────────────
const _mixed: TourStep[] = [visible, hidden, hiddenWithLifecycle, visibleMinimal]
expectTypeOf<TourStep[]>().toMatchTypeOf<TourStep[]>()

// Keep references so unused-var noise doesn't drown out the type errors.
void _bad1
void _bad2
void _bad3
void _bad4
void _bad5
void _mixed
