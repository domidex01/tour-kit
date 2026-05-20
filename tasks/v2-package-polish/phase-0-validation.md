# Phase 0 Validation — Cross-Cutting API Contracts

> Sign-off gate. Phase 1 starts only after the bottom line is signed.
>
> **Scope:** documentation-only. No source files in `packages/*` change. The
> only other file that may change is `tasks/v2-package-polish/big-plan.md`,
> and only if Task 0.1 surfaces a gap that needs a TODO at the bottom.

---

## 1. Gap Addendum (dashboard-next re-walk)

Sanity-check command (run from repo root):

```bash
rg -n "ReplayBridge|LS-clear|unregister.*register|localStorage.*tour|dispatchEvent.*tour" examples/dashboard-next
```

Output captured at validation time (2026-05-20):

```
examples/dashboard-next/components/tour-kit/onboarding-tour.tsx:14:function ReplayBridge() {
examples/dashboard-next/components/tour-kit/onboarding-tour.tsx:68:      <ReplayBridge />
examples/dashboard-next/components/tour-kit/demo-panel.tsx:269:                window.localStorage.removeItem('tour-kit:surveys:state')
```

Four concrete papercuts confirmed in `examples/dashboard-next`; each maps to an
already-scheduled phase. **No new phases are opened in this addendum.**

| # | Workaround in `examples/dashboard-next` | File:line | Covered by |
|---|---|---|---|
| 1 | `ReplayBridge` component shimming a cross-tree start via `window.dispatchEvent` / `addEventListener` of a `tour-kit-demo:replay-onboarding` CustomEvent | `components/tour-kit/onboarding-tour.tsx:8-22, 68` | Phase 1.1 — `useTourActions(id)` registry hook (this contract, §2 below) |
| 2 | CSAT "Show survey" demo trigger does `window.localStorage.removeItem('tour-kit:surveys:state')` + `csat.reset()` + `queueMicrotask(() => csat.show())` to bypass the 90-day frequency rule | `components/tour-kit/demo-panel.tsx:267-273` | Phase 1.3 — `forceShow(id)` on the surveys imperative API (this contract, §4 below) |
| 3 | Hand-composed CSAT modal: consumer wires `useSurvey('onboarding-csat')` + `<SurveyModal>` + raw `<QuestionRating>` + custom Skip/Submit `<Button>`s instead of importing a one-line `<CsatModal>` | `components/tour-kit/csat-survey-host.tsx` (whole file) | Phase 2 — first-class `<CsatModal>` / `<NpsModal>` / `<CesModal>` components |
| 4 | Checklist "Open checklist" demo trigger does `document.querySelector<HTMLButtonElement>('button[aria-label="Open checklist"]')?.click()` after `checklist.restore()` because there is no imperative open API | `components/tour-kit/demo-panel.tsx:222-228` | Phase 6 — imperative checklist ref / dock open API |

**Workaround count:** 4. **Phase coverage:** 4/4. **TODOs added to `big-plan.md`:** 0 — every workaround is already on the roadmap.

---

## 2. `useTourActions(id)` Signature

`UseTourActionsReturn` is a **strict subset** of `UseTourReturn` (declared in
`packages/core/src/hooks/use-tour.ts` lines 13–50): the minimal state slice
needed to render call-site UI plus the imperative actions. We deliberately
shrink rather than re-export so call sites in sibling subtrees don't pull the
full transition/loading/utility surface — those still come from `useTour()`
inside the `<TourProvider>` subtree. The duplication is intentional and
documented.

```ts
/**
 * Phase 0 Contract — packages/core/src/registry/use-tour-actions.ts (Phase 1.1)
 *
 * Read/control a tour from anywhere in the React tree, including siblings of
 * the <Tour> instance. Standalone <Tour id="..."> components self-register at
 * mount via the tour registry. Returns a frozen no-op object when the tour id
 * is unknown — does NOT throw, so call sites stay quiet during route
 * transitions when the tour isn't mounted.
 */
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

export declare function useTourActions(tourId: string): UseTourActionsReturn
```

**Compile check:** the snippet above passes
`pnpm tsc --noEmit --target ES2020 --moduleResolution node /tmp/scratch-use-tour-actions.ts`
(exit 0). Re-run `bash tasks/v2-package-polish/phase-0-doctest.sh` to verify.

### Deprecation path for `ReplayBridge`

The dashboard-next workaround (§1 row 1) uses a window `CustomEvent` shim. Once
Phase 1.1 ships, the same wiring becomes (rendered in a non-`ts` fence so the
doctest snippet extractor only picks up the contract block above):

```jsx
// v2.x — preferred (illustrative TSX; not type-checked by phase-0-doctest)
const tour = useTourActions('dashboard-onboarding')
return <button onClick={tour.restart}>Replay</button>
```

Lifecycle:

- **v2.0:** ship `useTourActions`. The old `window.dispatchEvent(new CustomEvent('tour-kit-demo:replay-onboarding'))` keeps working from consumer code (it's pure DOM); we don't emit a runtime warning because we never owned the event name.
- **v3.0:** ship a codemod that rewrites the pattern. Codemod entry slated for Phase 1.2: `@tour-kit/codemods/transforms/replay-bridge-to-use-tour-actions.ts`.

---

## 3. `target` Union Type

```ts
/**
 * Phase 0 Contract — `TourTarget` union consumed by `resolveTarget()` (Phase 5.1).
 *
 * In production code, `TourTargetRef` aliases `React.RefObject<HTMLElement | null>`.
 * The snippet below uses the structural shape so it compiles in isolation under
 * `tsc --noEmit --target ES2020 --moduleResolution node` without resolving React.
 */
export type TourTargetRef = { readonly current: HTMLElement | null }
export type TourTargetGetter = () => HTMLElement | null

/**
 * Three accepted shapes for `target`:
 *   - selector string (legacy; runs `document.querySelector` on each step)
 *   - RefObject (recommended; survives portals + dynamic IDs)
 *   - getter function (escape hatch; lets callers query the DOM lazily)
 */
export type TourTarget = string | TourTargetRef | TourTargetGetter
```

### Runtime resolver order

`resolveTarget(target)` in Phase 5.1 walks the three branches in this exact
order. The branches are **disjoint at runtime** — strings have no `current`,
ref objects have a `current` property, getters are callable.

1. `typeof target === 'string'` → `document.querySelector(target)`
2. `'current' in target` → `target.current`
3. `typeof target === 'function'` → `target()`

### Backwards-compat note

The legacy selector-string form is documented as a fallback only. It **does
not** emit a dev warning even when the page also uses `<TourStep target={ref}
/>`. Existing v1 apps must upgrade silently.

---

## 4. `forceShow` Behaviour Matrix

`forceShow(id)` is a true admin/demo escape hatch on `AnnouncementsProvider`
(and the parallel surveys API surfaced in Phase 1.3). It bypasses every
functional gate that `show()` respects, but **still emits analytics** (with
`metadata.trigger="forced"`) and **still increments `viewCount`** so admins
previewing real production telemetry see accurate deltas. The license soft
gate is preserved — `<LicenseGate require="pro">` still renders its
watermark/warning state instead of full content even under `forceShow`.

```ts
/**
 * Phase 0 Contract — added to AnnouncementsContextValue (Phase 1.3).
 * Bypasses every functional gating check; still emits analytics and
 * still increments viewCount.
 */
forceShow: (id: string) => void
```

| Gate | show() respects? | forceShow() respects? |
|---|---|---|
| frequency | Yes | No |
| cooldown | Yes | No |
| viewCount | Yes | No |
| isDismissed | Yes | No |
| audience | Yes | No |
| License gate | Yes | Yes |

**Branch confirmation in existing `show()` (lines 458–517 of
`packages/announcements/src/context/announcements-provider.tsx`):**

- `if (!announcementState || !config) return` — registration check (`forceShow` keeps this, the id has to be registered to be force-shown)
- audience: `if (config.audience && isSegmentAudience(config.audience) && !filteredIds.has(id)) return` → `forceShow` bypasses
- `if (!schedulerRef.current.canShow(...)) return` — frequency + cooldown + isDismissed live here → `forceShow` bypasses
- `if (schedulerRef.current.shouldQueue(...)) { enqueue; return }` → `forceShow` skips the queue and shows immediately
- analytics emit + `viewCount + 1` + `persistState` are kept (so admins see real telemetry deltas)

---

## 5. Peer-Dep Audit

Every destination/adapter shipped in later phases lands as `peer-optional`
with a runtime feature-detect. No hard `dependencies` on any of these
libraries are added across the workspace.

| Library | Phase | Peer mode | Feature-detect snippet |
|---|---|---|---|
| sonner | 7.1 | peer-optional + runtime feature-detect | `typeof window !== 'undefined' && 'toast' in (await import('sonner').catch(() => ({})))` |
| posthog-js | 13.2 | peer-optional + runtime feature-detect | `typeof window.posthog !== 'undefined'` (memory-confirmed posthog-js init pattern) |
| gtag / @types/gtag.js | 13.3 | peer-optional + runtime feature-detect (types peer) | `typeof window.gtag === 'function' && Array.isArray(window.dataLayer)` (memory-confirmed gtag init pattern; GA4 lacks `isInitialized()` so feature-detect both) |
| @segment/analytics-next | 14.1 | peer-optional + runtime feature-detect | dynamic import then `'load' in mod.AnalyticsBrowser` |
| @amplitude/analytics-browser | 14.2 | peer-optional + runtime feature-detect | dynamic import then `'init' in mod` |
| ical.js | 15.2 | peer-optional + runtime feature-detect (lazy) | dynamic import only when `parseIcsFeed(...)` is called |
| canvas-confetti | 6.2 | peer-optional + runtime feature-detect (lazy) | dynamic import only when `<ChecklistCompletion variant="confetti">` fires AND `useReducedMotion()` is false |

### Reproduced grep output

```bash
$ grep -rn "sonner\|posthog-js\|@segment/analytics-next\|@amplitude/analytics-browser\|ical.js\|canvas-confetti" packages/*/package.json
packages/analytics/package.json:112:    "@amplitude/analytics-browser": {
packages/analytics/package.json:118:    "posthog-js": {
packages/analytics/package.json:123:    "@amplitude/analytics-browser": "^2.36.7",
packages/analytics/package.json:132:    "posthog-js": "^1.362.0",
```

**Interpretation:**

- Lines 112 and 118 are keys inside `peerDependenciesMeta` — already marked `{ optional: true }`. Confirmed by re-reading lines 107–121 of `packages/analytics/package.json`.
- Lines 123 and 132 are entries inside `devDependencies` — required for `@tour-kit/analytics` to typecheck and test its plugin adapters locally. They are **not** runtime `dependencies`.
- **Zero current hard `dependencies` or non-optional `peerDependencies`** on any of the seven libraries above. Phases 6.2, 7.1, 13.x, 14.x, 15.2 can ship each library as `peer-optional` without breaking existing consumers.

### Sonner version-range note

When Phase 7.1 lands the Sonner pipe, the peer pin will be loose (`sonner@>=1.0`)
and the runtime check will feature-detect `mod.toast` rather than version-check
the import. This avoids forcing consumers off an older Sonner.

---

## 6. Go/No-Go: Trial Tier Source

**Live API attempt:** validation requires hitting
`https://api.polar.sh/v1/customer-portal/license-keys/validate` with a sandbox
key. The repo's `.env` is restricted by sandbox permissions, so a live `curl`
could not be made from this session. Falling back to memory.

**Memory fallback (authoritative — global memory #197, confirmed
2026-05-15):** Polar `/v1/customer-portal/license-keys/validate` response
top-level fields are:

```
id, created_at, modified_at, organization_id, customer_id, customer,
benefit_id, key, display_key, status, limit_activations, usage,
limit_usage, validations, last_validated_at, expires_at, activation
```

**Neither `tier` nor `trial` ships in the validate response today.** This is
corroborated by `project_polar_api_findings.md` (snake_case payload, lifetime
activation limits, 72h cache TTL) — that doc enumerates every field used by
the @tour-kit/license validator and none of them carry trial semantics.

> Note for the next reviewer: rerunning the live `curl` from a shell that has
> `POLAR_SANDBOX_KEY` + `POLAR_ORG_ID` exported is cheap (one call, <2s) and
> would replace this fallback note with a fresh JSON snippet. Recorded here:
> credentials unavailable; used memory fallback.

### Decision (verbatim)

Polar API cannot emit `tier="trial"` → Phase 8 derives `daysLeft` client-side from `issuedAt + trialDays` config in `<LicenseProvider>` props

### Fallback shape (Phase 8.1)

```ts
// Client-derived trial — no server-emitted tier field required.
// Zod boundary on the Polar payload stays as-is; trial state is computed
// from validator timestamps + consumer-supplied trialDays.
type LicenseProviderProps = {
  licenseKey: string
  /** Trial length in days. When set, <TrialBadge /> can render a countdown. */
  trialDays?: number // e.g. 14
  /**
   * Optional explicit trial start timestamp.
   * Defaults to the validator's first successful `created_at` (Polar) or
   * `last_validated_at` if `created_at` is missing.
   */
  trialIssuedAt?: number
}
```

The license Zod schema delta is therefore the empty change: no new fields
required. `<TrialBadge />` is the only new surface in Phase 8 that consumes
`trialDays + trialIssuedAt`.

---

Signed off by: ________________________ — YYYY-MM-DD
