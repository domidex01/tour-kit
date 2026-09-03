// v2 §1.1 — React-free core types: parity + authoring-safety guards.
//
// Vitest doesn't run `*.test-d.ts` files at runtime — they're compiled by
// `pnpm --filter @tour-kit/core typecheck:types`. The `@ts-expect-error`
// directives FAIL the build if the offending statement still compiles.
//
// Everything here imports through the PUBLIC barrel (`../../index`) on
// purpose: the acceptance criteria say the four new primitives are exported
// from `@tour-kit/core`, not merely declared somewhere in `src/types`.

import type { Dispatch, ReactElement, ReactNode, RefObject } from 'react'
import { expectTypeOf } from 'vitest'
import type {
  SegmentationProviderProps,
  TourDispatch,
  TourElementLike,
  TourNode,
  TourRef,
  TourTarget,
  VisibleTourStep,
} from '../../index'

declare const el: ReactElement

// ─── Drift guard: React's ReactNode must stay inside TourNode ───────────────
// This is the whole maintenance answer for hand-mirroring React's union. The
// day React adds a member TourNode doesn't cover, `typecheck:types` fails —
// same idiom as `_AssertCoversPlacement` in `lib/schemas/step.schema.ts`.
expectTypeOf<ReactNode>().toExtend<TourNode>()

// A React element satisfies the structural element shape.
expectTypeOf<ReactElement>().toExtend<TourElementLike>()

// ─── Ref parity: TourRef<T> is structurally React.RefObject<T> ──────────────
expectTypeOf<RefObject<HTMLElement | null>>().toExtend<TourRef<HTMLElement | null>>()
expectTypeOf<TourRef<HTMLElement | null>>().toExtend<RefObject<HTMLElement | null>>()

// ─── Dispatch parity: TourDispatch<A> is structurally React.Dispatch<A> ─────
type TestAction = { type: 'NEXT' }
expectTypeOf<Dispatch<TestAction>>().toExtend<TourDispatch<TestAction>>()
expectTypeOf<TourDispatch<TestAction>>().toExtend<Dispatch<TestAction>>()

// ─── Authoring still compiles ───────────────────────────────────────────────
const _jsxContent: VisibleTourStep = { id: 's1', target: '#x', content: el }
const _stringContent: VisibleTourStep = { id: 's2', target: '#x', content: 'text' }
const _mixedArrayContent: VisibleTourStep = { id: 's3', target: '#x', content: [el, 'x'] }
const _keyedTitle: VisibleTourStep = {
  id: 's4',
  target: '#x',
  content: 'x',
  title: { key: 'welcome' },
}
const _jsxTitle: VisibleTourStep = { id: 's5', target: '#x', content: 'x', title: el }

// ─── Authoring errors survive the widening ──────────────────────────────────
// @ts-expect-error — a symbol is not renderable content
const _symbolContent: VisibleTourStep = { id: 'b1', target: '#x', content: Symbol() }

// @ts-expect-error — a bare function is not renderable content
const _functionContent: VisibleTourStep = { id: 'b2', target: '#x', content: () => {} }

// `{ key }` must NOT be a TourNode, or `TourNode | LocalizedText` stops
// discriminating and `isI18nKey` narrowing silently breaks.
// @ts-expect-error — `{ key }` is LocalizedText, not renderable content
const _keyedIsNotANode: TourNode = { key: 'welcome' }

// ─── A useRef from React 18 *or* React 19 is still a valid step target ──────
// React 19's shape, as returned by `useRef<HTMLDivElement | null>(null)`.
declare const ref19: RefObject<HTMLDivElement | null>
// React 18's shape, written out because no `@types/react@18` is installed in
// the workspace to import it from.
declare const ref18: { readonly current: HTMLDivElement | null }
const _target19: TourTarget = ref19
const _target18: TourTarget = ref18

// ─── SegmentationProviderProps survives the file move ───────────────────────
declare const segProps: SegmentationProviderProps
expectTypeOf(segProps.children).toExtend<ReactNode>()

// Keep references so unused-var noise doesn't drown out the type errors.
void _jsxContent
void _stringContent
void _mixedArrayContent
void _keyedTitle
void _jsxTitle
void _symbolContent
void _functionContent
void _keyedIsNotANode
void _target19
void _target18
