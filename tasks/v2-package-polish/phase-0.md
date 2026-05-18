# Phase 0 — Validation Gate (API Contracts)

**Duration:** Days 1–2 (~5–6 hours)
**Depends on:** Nothing
**Blocks:** Phase 1, Phase 5, Phase 7, Phase 8, Phase 13
**Risk Level:** HIGH — bad API choices here cascade across 4+ packages and force breaking changes mid-roadmap.
**Stack:** react

---

## Objective

Phase 0 is a Markdown-only design gate. It produces `tasks/v2-package-polish/phase-0-validation.md` — a single doc that locks the four cross-cutting TypeScript signatures (`useTourActions`, `target` union, `forceShow` matrix, trial-tier source) before any package code is written. No source files in `packages/*` change in this phase. Every later phase that depends on these contracts (1, 5, 7, 8, 13) reads them from this doc, so the doc must be unambiguous, sign-off-able, and resilient enough that a contract flip in Phase 8 doesn't unravel work in Phase 1.

## What Success Looks Like

1. `test -f /home/domidex/projects/tour-kit/tasks/v2-package-polish/phase-0-validation.md` exits 0 and the file has six top-level `##` sections matching the six tasks below
2. The doc contains four code blocks tagged ` ```ts` with the exact signatures of `useTourActions`, the `target` union, `forceShow`, and the trial-tier license schema delta — each compiles when pasted into `packages/core/src/types/*.ts` (verified by running `pnpm --filter @tour-kit/core typecheck` after a throwaway paste)
3. The doc's "Force-show behaviour matrix" section contains a markdown table with exactly 4 rows (frequency, cooldown, viewCount, isDismissed) and a yes/no for each
4. The doc's "Peer-dep audit" section lists `sonner`, `posthog-js`, `gtag` (`@types/gtag.js`), `@segment/analytics-next`, `@amplitude/analytics-browser`, `ical.js` — each row marked `peer-optional + runtime feature-detect`
5. The doc ends with a section titled `## Go/No-Go: Trial Tier Source` containing one of two recorded decisions verbatim: either "Polar API can emit `tier=\"trial\"` → Phase 8 uses server-emitted tier" or "Polar API cannot emit `tier=\"trial\"` → Phase 8 derives `daysLeft` client-side from `issuedAt + trialDays` config"
6. The doc's final line is a sign-off block (`Signed off by: @domidex01 — YYYY-MM-DD`) and is left blank until user approval

---

## What Failure Looks Like (and what to do)

- **`useTourActions` returns a different shape than `useTour`'s actions slice** → callers will need a second `useTour()` for state; explicitly add a `state` field to `UseTourActionsReturn` mirroring the controller surface (`isActive`, `currentStep`, `progress`). Document the duplication as intentional in the doc.
- **`target` union accepts both string and RefObject but the runtime resolver can't disambiguate** → drop `() => HTMLElement | null` from the union for v2 (keep string + RefObject only). Re-add the function form in a later minor if needed.
- **Force-show matrix unclear about whether it persists view counts** → spec it as `forceShow` always increments `viewCount` even when bypassing frequency. Record the rationale: admins previewing should still see real production telemetry deltas.
- **Polar API check returns "depends on plan tier" rather than a clean yes/no** → default to the client-derived fallback. Server-emitted trial can be added in a later minor without breaking the badge component.
- **Peer-dep audit reveals an existing consumer is using a Sonner version we'd pin against** → mark the version range loosely (`sonner@>=1.0`) and feature-detect against `sonner.toast` rather than version-checking. Document the version assumption.
- **User refuses to sign off at end of Day 2** → block all Phase 1 work; iterate the doc. Phase 0 is intentionally short so reflow cost is low.

---

## Architecture / Key Design Decisions

Phase 0 produces only a Markdown doc — no runtime artifacts. The doc itself is the architecture deliverable for downstream phases.

```
┌────────────────────────────────────────────────────────┐
│       phase-0-validation.md (single source of truth)   │
│                                                        │
│  §1 useTourActions signature  ───►  Phase 1.1          │
│  §2 target union              ───►  Phase 5.1          │
│  §3 forceShow matrix          ───►  Phase 1.3, 2.1     │
│  §4 peer-dep audit            ───►  Phase 7.1, 13.x    │
│  §5 trial-tier go/no-go       ───►  Phase 8.1          │
│  §6 sign-off                  ───►  unblocks Phase 1   │
└────────────────────────────────────────────────────────┘
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| TypeScript signatures in the doc | `interface` / `type` (snippets only — not compiled in this phase) | These are contracts for future PRs; they live in `packages/core/src/types/` once Phase 1 starts |
| Trial-tier license schema delta | Zod schema sketch | License input comes from Polar (external boundary) — when Phase 8 implements it, Zod will validate. Record the proposed `tier: z.enum(['free', 'pro', 'trial'])` in the doc |
| Force-show matrix | Markdown table | This is documentation, not code. The runtime bypass logic lands in Phase 1 |

**Other critical rules for this phase:**
- **No code changes:** Don't edit any `packages/*` file. Only `tasks/v2-package-polish/phase-0-validation.md` is touched.
- **Verify-don't-hope on signatures:** For each TypeScript snippet, paste it into a scratch `.ts` file under `/tmp` and run `pnpm tsc --noEmit /tmp/scratch.ts` to confirm it parses (no actual integration test — just syntactic validity).
- **Polar check is a real API call:** For task 0.6, hit the Polar API (`https://api.polar.sh/v1/customers/{id}/state`) on a known sandbox customer and inspect the JSON for any `trial` / `tier` field. Don't guess from docs.

---

## Tasks

### Task 0.1 — Re-walk dashboard-next gap audit (1–2h)

Open `examples/dashboard-next/` and re-read the four files that contain workarounds (`ReplayBridge.tsx`, the LS-clear+unregister+register block in `onboarding/page.tsx` or equivalent, the hand-composed CSAT modal, the fake launcher click). Diff against the inbound pain list in `big-plan.md`. Record any additional gaps not already covered by Phases 1–19 as a "Gap Addendum" subsection. Do **not** open new phases — log gaps that warrant new phases as a TODO at the bottom of `big-plan.md` for triage.

**Sanity check:** `grep -c "ReplayBridge\|LS-clear\|unregister.*register" examples/dashboard-next/**/*.tsx` returns a non-zero count, and that count is mirrored in the addendum.

---

### Task 0.2 — Spec `useTourActions(id)` (1h)

Write the TypeScript signature for the registry hook in `phase-0-validation.md`. Use the existing `UseTourReturn` shape from `packages/core/src/hooks/use-tour.ts` lines 13–50 as the reference. The new hook returns a **strict subset** of `UseTourReturn` — the imperative actions plus minimal state — to keep the surface usable from a sibling subtree without forcing a full `TourProvider` re-context.

```ts
// Confirmed shape in repo: packages/core/src/hooks/use-tour.ts
// Phase 0 design — pasted into the doc and signed off:

export interface UseTourActionsReturn {
  // Minimal state slice (read-only mirror of registry)
  isActive: boolean
  currentStepId: string | null
  progress: number // 0..1

  // Imperative actions — every method is a no-op if the tour is not registered
  start: () => void
  stop: () => void
  restart: () => void
  next: () => void
  prev: () => void
  goToStep: (stepId: string) => void
}

/**
 * Read/control a tour from anywhere in the React tree, including siblings of
 * the <Tour> instance. Standalone <Tour id="..."> components self-register at
 * mount via the tour registry (see Phase 1.1). Returns a frozen no-op object
 * when the tour id is unknown — does NOT throw, so call sites stay quiet
 * during route transitions when the tour isn't mounted.
 */
export function useTourActions(tourId: string): UseTourActionsReturn
```

Also record the deprecation path for `ReplayBridge` window events: emit a `console.warn` in v2.0, remove in v3.0. Note the codemod entry in `@tour-kit/codemods/transforms/replay-bridge-to-use-tour-actions.ts` slated for Phase 1.2.

**Sanity check:** Paste the interface into `/tmp/scratch-use-tour-actions.ts`; `pnpm tsc --noEmit --target ES2020 --moduleResolution node /tmp/scratch-use-tour-actions.ts` exits 0.

---

### Task 0.3 — Spec `target` union (1h)

Record the widened `target` prop type. Source-of-truth question: does the runtime resolver disambiguate `string` vs `RefObject` vs `() => HTMLElement | null`?

```ts
// Phase 0 decision — pasted into the doc:

export type TourTargetRef = React.RefObject<HTMLElement | null>
export type TourTargetGetter = () => HTMLElement | null

/**
 * Three accepted shapes for `target`:
 *   - selector string (legacy; runs `document.querySelector` on each step)
 *   - RefObject (recommended; survives portals + dynamic IDs)
 *   - getter function (escape hatch; lets callers query the DOM lazily)
 *
 * Runtime resolver order (Phase 5.1):
 *   1. If typeof target === 'string' → document.querySelector(target)
 *   2. If 'current' in target → target.current
 *   3. If typeof target === 'function' → target()
 */
export type TourTarget = string | TourTargetRef | TourTargetGetter
```

Decide and record whether the legacy `string` form will warn in dev when the page also has a `<TourStep target={ref} />` form — answer should be **no** (silent backwards-compat; documented as fallback only).

**Sanity check:** `pnpm tsc --noEmit /tmp/scratch-target-union.ts` exits 0; runtime resolver order is unambiguous (no overlap between `string`, `{current: ...}`, and a callable).

---

### Task 0.4 — Spec `forceShow(id)` behaviour matrix (0.5h)

Record what `forceShow` bypasses on `AnnouncementsProvider`. Existing context value lives at `packages/announcements/src/context/announcements-provider.tsx` lines 245–724 — `show()` already bypasses `audience` segment checks for admins, but respects `frequency`, `viewCount`, `isDismissed`, and the scheduler's `canShow()` gate. `forceShow` must be a true admin/demo escape hatch.

```ts
// Phase 0 decision — pasted into the doc as a markdown table:

/**
 * forceShow(id) — admin/demo override. Bypasses every gating check.
 * Still emits analytics (with metadata.trigger="forced") and still
 * increments viewCount (so admins see real telemetry deltas).
 */
forceShow: (id: string) => void
```

| Gate | `show()` respects? | `forceShow()` respects? |
|---|---|---|
| `frequency` rule (once, session, times, interval) | Yes | **No** |
| Scheduler cooldown (`canShow()`) | Yes | **No** |
| `viewCount` threshold | Yes | **No** |
| `isDismissed` flag | Yes (no-op) | **No** (re-shows) |
| `audience` (segment + array) | Yes | **No** |
| License gate (`<LicenseGate require="pro">`) | Yes | **Yes** (do not bypass — security boundary) |

**Sanity check:** Walk the existing `show()` implementation (lines 458–517 of `announcements-provider.tsx`) and confirm every gate above maps to a real branch in the code. If a gate doesn't exist (e.g., scheduler is a no-op for some configs), record that explicitly.

---

### Task 0.5 — Peer-dep audit (1h)

Spec the install footprint policy: every destination/adapter shipped in later phases is `peer-optional` with runtime feature-detect. Record the table in the doc:

| Library | Phase | Peer mode | Feature-detect snippet (confirmed from memory) |
|---|---|---|---|
| `sonner` | 7.1 | optional | `typeof window !== 'undefined' && 'toast' in (await import('sonner').catch(() => ({})))` |
| `posthog-js` | 13.2 | optional | `typeof window.posthog !== 'undefined'` (memory: confirmed posthog-js init pattern) |
| `gtag` / `@types/gtag.js` | 13.3 | optional + types peer | `typeof window.gtag === 'function' && Array.isArray(window.dataLayer)` (memory: confirmed gtag init pattern) |
| `@segment/analytics-next` | 14.1 | optional | dynamic-import + `'load' in mod.AnalyticsBrowser` |
| `@amplitude/analytics-browser` | 14.2 | optional | dynamic-import + `'init' in mod` |
| `ical.js` | 15.2 | optional (lazy-loaded) | dynamic-import only when `parseIcsFeed` is called |

Confirm there are **zero hard breakages** for existing consumers: search `package.json` files under `packages/*` for any current peer pin against these libraries — if a pre-existing peer is found, record it and decide whether to widen or move to optional.

**Sanity check:** `grep -rn "sonner\|posthog-js\|@segment/analytics-next\|@amplitude/analytics-browser\|ical.js" packages/*/package.json` returns no current production deps (peerDeps OK if widened, but no `dependencies` or hard `peerDependencies` without `peerDependenciesMeta.optional: true`).

---

### Task 0.6 — Trial-tier go/no-go (0.5h)

Make one live call against the Polar sandbox API to determine whether the customer-state endpoint can emit `tier="trial"`. Source-of-truth memory entry: `project_polar_api_findings.md` — Polar uses snake_case and a 72h cache TTL; check whether `tier` (or any field signalling trial state) ships in the customer-state JSON today.

Decision tree:
- **If yes** (Polar emits a trial-signalling field) → Phase 8 reads it from the validated license payload; license Zod schema gains `tier: z.enum(['free', 'pro', 'trial'])`. Record the field name verbatim.
- **If no** → Phase 8 derives `daysLeft` client-side from `issuedAt + trialDays` config the consumer passes to `<LicenseProvider>`. Record this fallback shape:

  ```ts
  // Client-derived trial fallback:
  interface LicenseProviderProps {
    licenseKey: string
    /** When set, render <TrialBadge /> using issuedAt + trialDays */
    trialDays?: number // e.g. 14
  }
  ```

Record the chosen path in the doc's final `## Go/No-Go: Trial Tier Source` section. **This is the binary decision the rest of the doc is checked against.**

**Sanity check:** `curl -s "$POLAR_API_BASE/v1/customers/.../state" -H "Authorization: Bearer $POLAR_KEY" | jq '.tier // "absent"'` returns either a trial-signalling value or `"absent"`. Record the raw JSON snippet (with PII redacted) in the doc.

---

## Deliverables

```
tasks/v2-package-polish/
└── phase-0-validation.md   # the single Markdown deliverable; six ## sections + sign-off
```

No `packages/*` changes. No tests added. No code shipped.

---

## Exit Criteria

- [ ] `tasks/v2-package-polish/phase-0-validation.md` exists and has six top-level `##` sections (one per task 0.1–0.6)
- [ ] Each of the four TypeScript snippets (`UseTourActionsReturn`, `TourTarget`, `forceShow`, license `tier` delta) compiles via `pnpm tsc --noEmit /tmp/scratch-*.ts` for each scratch paste
- [ ] Force-show behaviour matrix table has exactly 4 functional-gate rows + 1 license-gate row, with yes/no per column, and matches the real branches in `announcements-provider.tsx`
- [ ] Peer-dep audit table lists all six libraries with `peer-optional` mode; `grep` of `packages/*/package.json` confirms no current hard dep on any of them
- [ ] Gap Addendum subsection logs zero NEW phases (any new gaps are TODOs at the bottom of `big-plan.md`, not new phase headers)
- [ ] **Go/no-go on trial tier:** If Polar API can emit `tier="trial"` → proceed to Phase 8 as planned. If not → client-derived trial countdown from `issuedAt + trialDays` config; record decision in `phase-0-validation.md`.
- [ ] User explicitly approves the phase-0 doc (signs the `Signed off by:` line at the bottom) before Phase 1 starts

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 0 of Tour Kit v2 Package Polish — the Validation Gate. This is a **documentation-only phase**: you write one Markdown file and change no source code in `packages/*`.

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives (core, react, hints) plus pro packages (announcements, surveys, checklists, adoption, analytics, ai, scheduling, license, media). v2 closes demo-wiring gaps reported while building `examples/dashboard-next/`. Every phase ships as one PR with backwards-compatible types.

### Established in Prior Phases
- This is the first phase. Source-of-truth references:
  - `tasks/v2-package-polish/big-plan.md` (the roadmap)
  - `packages/core/src/hooks/use-tour.ts` lines 13–50 (existing `UseTourReturn` shape)
  - `packages/announcements/src/context/announcements-provider.tsx` lines 245–724 (existing `show()`/`dismiss()`/`reset()` logic)
  - Memory entry `project_polar_api_findings.md` (Polar API uses snake_case, lifetime activation limits, 72h cache TTL)

### Your Goal for This Phase
Produce `tasks/v2-package-polish/phase-0-validation.md` containing six signed-off sections that lock the cross-cutting API contracts for Phases 1, 5, 7, 8, and 13.

### Data Model Rules (follow exactly)
- **No code is shipped this phase.** All TypeScript appears as fenced snippets inside the Markdown doc.
- Snippets MUST be syntactically valid TS — paste each into `/tmp/scratch-<name>.ts` and run `pnpm tsc --noEmit --target ES2020 --moduleResolution node /tmp/scratch-<name>.ts`; the snippet is only "good" if it exits 0.
- For the license schema delta (task 0.6), use Zod-flavoured syntax: `z.enum(['free', 'pro', 'trial'])` rather than a TS union literal. Zod is the validation boundary for the Polar payload in Phase 8.

### Architecture
```
phase-0-validation.md (six ## sections)
  §1 Gap Addendum                  → no new phases, only TODOs at bottom of big-plan.md
  §2 useTourActions signature      → consumed by Phase 1.1
  §3 target union                  → consumed by Phase 5.1
  §4 forceShow behaviour matrix    → consumed by Phase 1.3, 2.1
  §5 Peer-dep audit table          → consumed by Phase 7.1, 13.x, 14.x, 15.2
  §6 Go/No-Go: Trial Tier Source   → consumed by Phase 8.1
  + sign-off line (blank until user signs)
```

### Confirmed Library APIs
No new libraries this phase. Existing repo patterns to reference verbatim in the doc:

```ts
// packages/core/src/hooks/use-tour.ts (existing v1 shape — reference for §2)
export interface UseTourReturn<TStep extends TourStep = TourStep> {
  isActive: boolean
  currentStep: TStep | null
  start: (tourIdOrStepIndex?: string | number, stepIndex?: number) => void
  next: () => void; prev: () => void; goTo: (stepIndex: number) => void
  goToStep: <TId extends TStep['id']>(stepId: TId) => Promise<void>
  // ...
}
```

```ts
// packages/announcements/src/context/announcements-provider.tsx::show (lines 458–517)
// — reference for §4's "what show() respects" column. Walk every branch:
//   1. !announcementState || !config → bail
//   2. audience segment check (filteredIds.has)
//   3. scheduler.canShow(config, state, userContext)
//   4. scheduler.shouldQueue → enqueue
//   5. dispatch SHOW + persist + emit analytics
```

```ts
// Memory-confirmed feature-detect snippets for §5:
// posthog-js: typeof window.posthog !== 'undefined'
// gtag:       typeof window.gtag === 'function' && Array.isArray(window.dataLayer)
```

### Files to Create

#### `tasks/v2-package-polish/phase-0-validation.md`
Single Markdown file with this structure:
```
# Phase 0 Validation — Cross-Cutting API Contracts

> Sign-off gate. Phase 1 starts only after the bottom line is signed.

## 1. Gap Addendum (dashboard-next re-walk)
- List concrete workarounds still present in examples/dashboard-next/
- Cross-reference each against Phases 1–19 in big-plan.md
- Log any unhandled gap as a `- [ ] TODO:` line; copy that line to the bottom of big-plan.md
- DO NOT propose new phases here

## 2. `useTourActions(id)` Signature
- One ```ts fenced block with `UseTourActionsReturn` interface (minimal state + imperative actions)
- One paragraph: why it's a subset of UseTourReturn, not a re-export
- Deprecation note: ReplayBridge window event → console.warn in v2.0, remove in v3.0
- Codemod entry: `@tour-kit/codemods/transforms/replay-bridge-to-use-tour-actions.ts` (Phase 1.2)

## 3. `target` Union Type
- One ```ts fenced block with `TourTarget` union (`string | RefObject<HTMLElement | null> | (() => HTMLElement | null)`)
- Runtime resolver order: string → RefObject (test `'current' in target`) → function
- Backwards-compat note: selector string never warns; documented as fallback only

## 4. `forceShow` Behaviour Matrix
- One ```ts fenced block with the `forceShow: (id: string) => void` method signature
- One Markdown table — exactly 5 rows: frequency / cooldown / viewCount / isDismissed / license-gate. Columns: `show() respects?` and `forceShow() respects?`. License-gate is the only Yes for forceShow.
- One sentence: forceShow still increments viewCount and still emits analytics with `metadata.trigger="forced"`

## 5. Peer-Dep Audit
- One Markdown table with columns: Library | Phase | Peer mode | Feature-detect snippet
- Rows: sonner, posthog-js, gtag/@types/gtag.js, @segment/analytics-next, @amplitude/analytics-browser, ical.js
- Every row is `peer-optional + runtime feature-detect`
- Run: `grep -rn "sonner\|posthog-js\|@segment/analytics-next\|@amplitude/analytics-browser\|ical.js" packages/*/package.json`. Record output in the doc; document any conflicts.

## 6. Go/No-Go: Trial Tier Source
- Record the live Polar sandbox API call: command + redacted JSON response
- One of two recorded decisions VERBATIM:
  - "Polar API can emit `tier=\"trial\"` → Phase 8 uses server-emitted tier; license Zod schema gains `tier: z.enum(['free', 'pro', 'trial'])`"
  - "Polar API cannot emit `tier=\"trial\"` → Phase 8 derives `daysLeft` client-side from `issuedAt + trialDays` config in `<LicenseProvider>` props"

---

Signed off by: ________________________ — YYYY-MM-DD
```

### Success Criteria
- `test -f tasks/v2-package-polish/phase-0-validation.md` exits 0
- `grep -c "^## " tasks/v2-package-polish/phase-0-validation.md` returns at least 6
- Each ```ts block compiles when pasted to `/tmp/scratch-<name>.ts` and checked with `pnpm tsc --noEmit`
- The §4 matrix has exactly 5 rows (4 functional + 1 license)
- The §5 audit table has 6 rows
- §6 contains one of the two verbatim decision sentences
- The doc ends with `Signed off by:` (blank until user signs)
- **No file under `packages/*` is modified.** Verify with `git status` — only `tasks/v2-package-polish/phase-0-validation.md` should appear.

### Expected File Structure at End
```
tasks/v2-package-polish/
├── big-plan.md              # unchanged (except optional TODOs at bottom from §1)
├── phase-0.md               # this plan (unchanged)
└── phase-0-validation.md    # NEW — the deliverable
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — this is Phase 0; inputs are big-plan.md, repo source files at the lines cited, and memory entry `project_polar_api_findings.md`.
- [PASS] Every sub-task has a clear, testable completion condition — each task has a `Sanity check` line with a one-liner command or grep.
- [PASS] Execution prompt is self-contained — prior facts copied inline, no "see Phase X"; data model rules explicit (no code shipped; snippets must pass `tsc --noEmit`); per-file guidance specifies exact section structure.
- [PASS] Exit criteria map 1:1 to deliverables — six exit checkboxes for the six doc sections + the sign-off line + the `git status` purity check.
- [PASS] Heavy external deps have a fake/stub strategy noted — no heavy deps in Phase 0; the only external call is one Polar sandbox `curl` in task 0.6 with explicit fallback if the response is ambiguous.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — no new libraries this phase; feature-detect snippets for posthog-js/gtag are recorded as memory-confirmed (Phase 0 task 0.5 only references them, doesn't implement them).
