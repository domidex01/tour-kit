# Spike 0.3 — Theme Predicate Performance

**Date:** 2026-05-02
**Owner:** domidex01
**Phase:** 1.0 (Validation Gate)
**Hypothesis:** A `useMemo`-gated predicate evaluation against a 100-trait fixture produces ≤ 2 React renders per relevant trait flip and ≤ 16 ms `actualDuration`, validating the theme-foundation strategy for Phase 4a/b without introducing `useSyncExternalStore`.

---

## Why this isn't a `/tmp/spike-theme-perf` Vite app

The phase plan suggested a throwaway `pnpm create vite` harness, but a Vitest test under `packages/core/src/__tests__/spikes/` satisfies the same fail-safe (it's deletable in one `rm` before Phase 1.x PRs) **and** is reproducible from CI. Manual browser measurement carries operator variance; React Profiler in jsdom returns the same numbers on every run.

> Trade-off accepted: jsdom doesn't reflow layout, so `actualDuration` is purely the React render commit time, not the full paint. That is sufficient for the gate criterion (≤ 2 React renders) and is *more* sensitive — if the React render exceeds 16 ms we never even reach paint.

The measurement test (`perf-measure.test.tsx`) was emitted, run once, captured below, then deleted. The kept gate test (`theme-predicate-perf.test.tsx`) is the executable contract.

---

## Strategy under test

```tsx
// 100-trait fixture
const initialTraits = Object.fromEntries(
  Array.from({ length: 100 }, (_, i) => [`t${i}`, false])
)

function ThemeProvider({ traits, children }: { traits: Traits; children: React.ReactNode }) {
  const themeId = useMemo(
    () => (traits.t42 ? 'dark' : 'light'),
    [traits.t42]
  )
  return <div data-tk-theme={themeId}>{children}</div>
}
```

Key choices:

1. **`useMemo` deps are *just the read fields*** (`[traits.t42]`), not the whole `traits` object. Object identity changes on every flip; `traits.t42` only changes when the relevant trait flips.
2. **`data-tk-theme` is a single attribute swap** — CSS `[data-tk-theme="dark"]` selectors do all the styling work. No props cascade through children.
3. **No context** — the theme value is encoded in the DOM attribute. Children read it via CSS, not React.

---

## Raw measurements (React Profiler, Vitest jsdom, React 19)

```json
{
  "mount":          { "phase": "mount",  "actualDurationMs": 5.879 },
  "flipRelevant":   [{ "phase": "update", "actualDurationMs": 0.387 }],
  "flipIrrelevant": [{ "phase": "update", "actualDurationMs": 0.132 }]
}
```

| Event | Renders | actualDuration (ms) | Cap | Verdict |
| --- | ---: | ---: | ---: | --- |
| Initial mount with 100 traits | 1 | 5.879 | n/a | informational |
| Flip relevant trait (`t42`: false → true) | **1** | **0.387** | ≤ 16 | **PASS** |
| Flip irrelevant trait (`t99`: false → true) | **1** | **0.132** | ≤ 16 | **PASS** |

Both flip cases produce a single update render per flip — well under the ≤ 2 budget. `data-tk-theme` flips from `light` to `dark` exactly when `t42` changes; flipping `t99` keeps the memoized `themeId` stable, so the render is essentially free (no DOM mutation, just a same-attribute reconciliation).

**Caveat — what `useMemo` does and does not do here:** the memo stabilizes the *value* of `themeId`, not the render. When the parent's `traits` state updates, `ThemeProvider` still re-renders; the cheap 0.132 ms cost on an irrelevant flip is React skipping the DOM mutation, not skipping the function call. To fully bail out the subtree (zero re-renders on irrelevant flips), Phase 1.1's production implementation should also wrap `ThemeProvider` in `React.memo` and pass the memoized `themeId` as a primitive prop. The gate budget is met either way; the bailout is a Phase 1.1 polish, not a 1.0 blocker.

Margin: 0.387 ms per flip vs 16 ms cap = **41× headroom**.

---

## Chosen strategy: `useMemo` + `data-tk-theme`

No fallback to `useSyncExternalStore` is needed. The `useMemo` baseline:

- meets the ≤ 2 renders / flip budget,
- meets the ≤ 16 ms `actualDuration` budget by 41×,
- avoids the additional store subscription complexity,
- works server-side (no `subscribe` callback, no client-only hook).

`useSyncExternalStore` would be relevant only if we needed shared theme state across roots without re-rendering the React tree at all — which Phase 4 spec does *not* require (it scopes themes per `<TourProvider>`).

---

## Gate test (kept in repo, deleted before Phase 1.x PRs)

`packages/core/src/__tests__/spikes/theme-predicate-perf.test.tsx` — 2 cases:

1. Relevant flip ≤ 2 renders, < 16 ms each, `data-tk-theme` becomes `"dark"`.
2. Irrelevant flip ≤ 2 renders, < 16 ms each, `data-tk-theme` stays `"light"` (memoized value identity preserved — see caveat above re: full subtree bailout).

Both pass:

```
RUN  v4.1.2 /home/domidex/projects/tour-kit/packages/core
Test Files  1 passed (1)
Tests       2 passed (2)
Duration    1.91 s
```

---

## Cleanup

The gate test (`theme-predicate-perf.test.tsx`) and the broadcast smoke (`broadcast-smoke.test.ts`) live under `packages/core/src/__tests__/spikes/`. **Both are deleted before the first Phase 1.x feature PR merges** (Phase 0 fail-safe #1).

---

Decision: GO
