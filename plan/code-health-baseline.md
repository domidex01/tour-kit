# Code Health Pass — Baseline (Phase 0)

**Captured:** 2026-04-30 on `chore/code-health` at SHA `a0b1922` (= `main`).
**Tooling:** pnpm 9.15.4, Node v24.2.0, vitest 4.1.x (per-package), `size-limit@^11` + `@size-limit/preset-small-lib@^11`.

This file is a frozen contract. Every later phase claiming a delta must reference these numbers. **Do not rerun the baseline mid-train.**

---

## LOC baseline (cross-package duplicate boilerplate)

Source: `git ls-files <patterns> | xargs wc -l` (see exact patterns in `improvement-phase-0.md` Task 0.2).

**Total: 901 lines across 28 files.** The improvement-big-plan estimated "~700 LOC of duplicated boilerplate"; the deletable subset (≈22 files) is a refinement of this 28-file population once canonical copies are kept in `@tour-kit/core`.

### `unified-slot.tsx` ×7 (557 LOC)

| Package | LOC |
|---|---:|
| `packages/adoption/src/lib/unified-slot.tsx`      |  84 |
| `packages/announcements/src/lib/unified-slot.tsx` |  87 |
| `packages/checklists/src/lib/unified-slot.tsx`    |  84 |
| `packages/hints/src/lib/unified-slot.tsx`         |  87 |
| `packages/media/src/lib/unified-slot.tsx`         |  87 |
| `packages/react/src/lib/unified-slot.tsx`         | 109 |
| `packages/surveys/src/lib/unified-slot.tsx`       |  87 |

### `ui-library-context.tsx` ×7 (156 LOC)

| Package | LOC |
|---|---:|
| `packages/adoption/src/lib/ui-library-context.tsx`      | 20 |
| `packages/announcements/src/lib/ui-library-context.tsx` | 20 |
| `packages/checklists/src/lib/ui-library-context.tsx`    | 20 |
| `packages/hints/src/lib/ui-library-context.tsx`         | 20 |
| `packages/media/src/lib/ui-library-context.tsx`         | 20 |
| `packages/react/src/lib/ui-library-context.tsx`         | 36 |
| `packages/surveys/src/lib/ui-library-context.tsx`       | 20 |

### `utils.ts` ×7 (66 LOC)

| Package | LOC |
|---|---:|
| `packages/adoption/src/lib/utils.ts`      | 10 |
| `packages/ai/src/lib/utils.ts`            |  6 |
| `packages/announcements/src/lib/utils.ts` | 10 |
| `packages/hints/src/lib/utils.ts`         | 10 |
| `packages/media/src/lib/utils.ts`         | 10 |
| `packages/react/src/lib/utils.ts`         | 10 |
| `packages/surveys/src/lib/utils.ts`       | 10 |

> Note: `packages/checklists/` lacks `src/lib/utils.ts` but ships `src/components/cn.ts` (6 LOC) — an alternate name for the same `clsx + twMerge` helper.

### `slot.tsx` ×6 (48 LOC)

| Package | LOC |
|---|---:|
| `packages/adoption/src/lib/slot.tsx`      | 8 |
| `packages/announcements/src/lib/slot.tsx` | 8 |
| `packages/checklists/src/lib/slot.tsx`    | 8 |
| `packages/hints/src/lib/slot.tsx`         | 8 |
| `packages/media/src/lib/slot.tsx`         | 8 |
| `packages/react/src/lib/slot.tsx`         | 8 |

> Note: `packages/surveys/` lacks `src/lib/slot.tsx` (the package only consumes `unified-slot` directly).

### `cn.ts` (6 LOC)

| File | LOC |
|---|---:|
| `packages/checklists/src/components/cn.ts` | 6 |

---

## Coverage baseline

Source: `pnpm -r --no-bail run test:coverage` (see `/tmp/coverage-baseline.txt`).

| Package | Stmts % | Branch % | Funcs % | Lines % | Threshold result |
|---|---:|---:|---:|---:|---|
| `@tour-kit/adoption`      | 83.68 | 77.07 | 89.15 | 87.35 | PASS |
| `@tour-kit/analytics`     | 92.91 | 86.76 | 96.87 | 93.02 | PASS |
| `@tour-kit/announcements` | 76.39 | 66.07 | 77.55 | 76.57 | FAIL — branches 66.07 (<75), functions/statements/lines also under 80 |
| `@tour-kit/checklists`    | 92.44 | 82.89 | 92.10 | 95.48 | PASS |
| `@tour-kit/core`          | 82.06 | 70.92 | 85.08 | 84.44 | FAIL — branches 70.92 (<80) |
| `@tour-kit/hints`         | 95.80 | 82.98 | 100.00 | 96.96 | PASS |
| `@tour-kit/license`       | 96.50 | 86.33 | 96.96 | 96.72 | PASS |
| `@tour-kit/media`         | 60.05 | 49.64 | 42.68 | 60.36 | FAIL — every metric under threshold |
| `@tour-kit/react`         | 86.17 | 83.20 | 83.83 | 87.87 | PASS |
| `@tour-kit/scheduling`    | 56.60 | 44.58 | 70.45 | 56.65 | FAIL — every metric under threshold |
| `@tour-kit/surveys`       | 78.04 | 69.92 | 73.33 | 79.82 | FAIL — branches 69.92 (<75), others <80 |
| `@tour-kit/ai`            | n/a | n/a | n/a | n/a | NOT RUN — package has no `test:coverage` script |

**Summary:** 6 of 12 packages pass their existing thresholds; 5 fail; 1 lacks a coverage script. **Phase 0 deliberately does not fix any of these** — that work belongs to Phase 4 (test-coverage backfill). Numbers above are the contract Phase 4 has to beat.

---

## Bundle-size baseline

### Raw `du -sh packages/*/dist`

| Package | `dist/` total |
|---|---:|
| `@tour-kit/adoption`      | 448K |
| `@tour-kit/ai`            | 424K |
| `@tour-kit/analytics`     | 5.0M |
| `@tour-kit/announcements` | 572K |
| `@tour-kit/checklists`    | 364K |
| `@tour-kit/core`          | 508K |
| `@tour-kit/hints`         | 228K |
| `@tour-kit/license`       | 220K |
| `@tour-kit/media`         | 344K |
| `@tour-kit/react`         | 712K |
| `@tour-kit/scheduling`    | 188K |
| `@tour-kit/surveys`       | 516K |

### `index.js` raw + gzip + size-limit (with deps, minified, brotlied)

`size-limit` is the contract for Phase 6's CI gate. The `gzip -c index.js` column is the file-only number (no transitive deps); `size-limit` is the realistic shippable size including all bundled deps.

| Package | Raw bytes | gzipped (file only) | size-limit (with deps, brotlied) | Budget | Pass |
|---|---:|---:|---:|---:|:---:|
| `@tour-kit/core`          |  33,612 | 11,014 |  12,049 |   8,000 | FAIL |
| `@tour-kit/react`         |   7,192 |  2,654 |  32,728 |  12,000 | FAIL |
| `@tour-kit/hints`         |   7,496 |  2,865 |  27,376 |   5,000 | FAIL |
| `@tour-kit/adoption`      |  50,131 | 10,334 | 121,462 | 146,000 | PASS |
| `@tour-kit/checklists`    |  24,892 |  7,974 |  85,663 | 103,000 | PASS |
| `@tour-kit/announcements` |  18,658 |  5,497 |  88,502 | 107,000 | PASS |
| `@tour-kit/media`         |  12,699 |  3,718 | 140,256 | 169,000 | PASS |
| `@tour-kit/surveys`       |  18,531 |  5,532 |  91,824 | 111,000 | PASS |
| `@tour-kit/analytics`     | 224,185 | 64,243 | 238,468 | 287,000 | PASS |
| `@tour-kit/scheduling`    |  10,113 |  3,355 |  57,754 |  70,000 | PASS |
| `@tour-kit/license`       |  10,629 |  3,525 |  56,962 |  69,000 | PASS |
| `@tour-kit/ai`            |  11,650 |  4,193 |  93,213 | 112,000 | PASS |

### Budget calibration notes

- **`core` / `react` / `hints`** — limits are taken **verbatim from `CLAUDE.md`** (8 / 12 / 5 KB). All three currently exceed. This is by design: the budgets are aspirational targets the cleanup train must hit. Phase 1 (tsup minify flip + `treeshake: 'recommended'`) is expected to close most of the gap by reclaiming React peer-dep and dev-only code; Phases 2–5 (dedup hoist, dead-code drop) finish it. **Phase 6** flips the CI gate from "warn" to "block".
- **All other packages** — limits are **~20% over the size-limit measurement at this baseline** (rounded to the next whole KB). This satisfies the "gate doesn't fire on day one" rule for everything outside CLAUDE.md.
- **`@tour-kit/analytics` deviation** — the `improvement-phase-0.md` example JSON proposed a 5 KB limit, but the actual baseline is 238.47 KB (the package bundles transitive analytics-vendor deps). The 5 KB number was an obvious aspirational typo; per the plan's own padding rule, the real budget is **287 KB**. Phase 6 should confirm whether vendor deps should be `external` in tsup before locking this in long-term.

### Deviations from `improvement-phase-0.md` example budgets

| Package | Plan example | Final budget | Reason |
|---|---:|---:|---|
| `@tour-kit/adoption`      |  10 KB |  146 KB | Real with-deps size is 121.46 KB; example was for file-only gzip |
| `@tour-kit/checklists`    |  12 KB |  103 KB | same |
| `@tour-kit/announcements` |  12 KB |  107 KB | same |
| `@tour-kit/media`         |   8 KB |  169 KB | same |
| `@tour-kit/surveys`       |  12 KB |  111 KB | same |
| `@tour-kit/analytics`     |   5 KB |  287 KB | same; baseline 238 KB makes 5 KB infeasible |
| `@tour-kit/scheduling`    |   5 KB |   70 KB | same |
| `@tour-kit/license`       |   5 KB |   69 KB | same |
| `@tour-kit/ai`            |  15 KB |  112 KB | same |

CLAUDE.md-bound entries (`core`, `react`, `hints`) match the plan's example exactly.

---

## Determinism check

Two consecutive `pnpm exec size-limit --json` runs against the same `dist/` produced **byte-identical JSON output** (`diff /tmp/size-limit-run-a.json /tmp/size-limit-run-b.json` → empty).

```
Run A — 12 entries, sizes pinned to the byte (e.g. core=12049, react=32728, hints=27376).
Run B — 12 entries, identical to Run A.
diff   — no output.
```

**Conclusion:** size-limit is deterministic across runs at fixed `dist/`. **No tolerance band needed for Phase 6's CI gate.** If post-build numbers ever drift between identical inputs, Phase 6 should pin `treeshake: 'recommended'` in every tsup config — but that contingency is not active today.

> Notes on size-limit exit semantics observed at baseline: `pnpm exec size-limit --json` exits **1** when any limit is exceeded (today: core/react/hints), but the JSON it writes to stdout is well-formed and identical across runs. The Phase 0 verify script (`scripts/verify-phase-0.sh`) tolerates the non-zero exit on the determinism check — Phase 6 will tighten this when the gate flips from "warn" to "block".

---

## Observed but deferred (not fixed in Phase 0)

These are findings made while measuring. Each is **out of scope for Phase 0** (no source edits) and is logged here so a later phase can pick it up:

- `@tour-kit/ai` has no `test:coverage` script — Phase 4 should add one to keep the coverage matrix complete.
- 5 packages fail their own coverage thresholds (announcements, core, media, scheduling, surveys) — Phase 4 backfills.
- `unified-slot.tsx` is not a strict copy across packages: `react` is 109 LOC, `adoption`/`checklists` are 84 LOC, the rest are 87 LOC. Phase 2's hoist must consolidate to a single canonical `core` copy and verify all consumers still type-check.
- `analytics` ships transitive vendor deps (238 KB brotlied with deps) — Phase 1's minify flip alone will not close this; an `external` audit in tsup is likely needed.
- `@tour-kit/react` is 32.73 KB with-deps brotlied vs 12 KB target — the dominant overhead is its peer-dep React surface plus shadcn-style component scaffolding; Phase 2's slot/context dedup recovers some, but most of the gap is genuine surface area.
