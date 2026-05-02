# Phase 1 — Go/No-Go Memo

**Date:** 2026-05-02
**Owner:** domidex01

## 0.1 BroadcastChannel
- Status: PASS
- Reason: Native `BroadcastChannel` is `typeof === 'function'` in Vitest 4.1.2 jsdom on Node v24.2.0; smoke test (`spikes/broadcast-smoke.test.ts`) runs `1 passed` in 1.86s. No polyfill needed.

## 0.2 Hidden-step impact
- Status: PASS
- Estimated refactor: 3.5h (cap 4h). Single-line edit to `evaluateStepWhen` + new optional `kind?: 'standard' \| 'hidden'` on `TourStep`. No reducer or callsite churn — all 22 `currentStepIndex` consumers in `tour-provider.tsx` either delegate visibility decisions to `findNext/NearestVisibleStepIndex`, or are pure read/dispatch paths that don't care about step kind. Full classification table in `notes/phase-1/hidden-step-impact.md`.

## 0.3 Theme predicate perf
- Status: PASS
- Renders per trait flip: 1 (cap 2). actualDuration 0.387 ms relevant flip, 0.132 ms irrelevant flip (cap 16 ms — 41× headroom). Strategy: `useMemo([traits.t42])` + `data-tk-theme` attribute swap. No `useSyncExternalStore` fallback needed. Gate test `spikes/theme-predicate-perf.test.tsx` enforces both bounds in CI.

## 0.4 Bundle baseline
- Status: PASS-WITH-NOTE
- Min headroom: **1.4 KB** on `@tour-kit/core` (cap soft target ≥ 1.5 KB; cap hard fail ≥ 0.5 KB). All 12 packages pinned in `notes/phase-1/size-baseline.json` with measured bytes vs `.size-limit.json` ceilings. Plan `client-only-gaps-big-plan.md` § Bundle Budget Tracking is now TBD-free.
- Action item: Phase 1.1 must either bump core `.size-limit.json` ceiling from 21 KB → 22 KB **or** deliver flow-session ≤ 0.4 KB gzip via tree-shaking. Tracked inline in the Bundle Budget table.
- Headroom for the other gated packages: react 2.2 KB, hints 2.5 KB, announcements 18.0 KB, surveys 18.5 KB, checklists 17.2 KB.

---

Decision: GO
