# Phase 0 — Testing: Validation Gate (API Contracts)

**Scope:** A single Markdown deliverable `tasks/v2-package-polish/phase-0-validation.md` plus (optional) a TODO line appended to `tasks/v2-package-polish/big-plan.md`. Zero `packages/*` source changes.
**Key Pattern:** Research/validation phase — there is no runtime to mock. The "tests" are doc-shape assertions (section counts, table-row counts, verbatim sign-off strings) plus syntactic validation of every fenced TS snippet via `tsc --noEmit` on scratch files.
**Dependencies:** `pnpm` workspace (`tsc` already installed via `@tour-kit/core`), `rg` (or `grep`), `jq`, optional `curl` for the Polar sandbox call. No test runner — these are CI-style shell assertions.

---

## 1. User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As Phase 1 author, I want a signed-off `useTourActions` signature so I can implement the registry hook without reflowing types mid-PR | `grep -A 12 "^## 2\." phase-0-validation.md` contains an `export interface UseTourActionsReturn` block and an `export function useTourActions` declaration | The TS block extracted to `/tmp/scratch-use-tour-actions.ts` is accepted by `pnpm tsc --noEmit --target ES2020 --moduleResolution node /tmp/scratch-use-tour-actions.ts` (exit 0) |
| US-2 | As Phase 5 author, I want the `TourTarget` union with a runtime resolution order so I can write `resolveTarget()` and unit-test it deterministically | `grep -A 20 "^## 3\." phase-0-validation.md` contains a `type TourTarget = string \| ...RefObject... \| ...() =>` block AND an ordered resolution list | TS block compiles with `tsc --noEmit`; resolution-order list has 3 numbered items (string → RefObject → function) |
| US-3 | As Phase 1 + Phase 2 author, I want a row-by-row force-show bypass matrix so I can build a pinned-array CI test from it | The §4 Markdown table has exactly 5 functional rows (frequency, cooldown, viewCount, isDismissed, audience) plus the license-gate row | Row count = 6 total; license-gate cell under `forceShow()` reads `Yes` (soft gate preserved); all five functional `forceShow()` cells read `No` |
| US-4 | As Phase 7/13/14/15 authors, I want a peer-dep audit confirming none of the optional adapters are hard deps today so I can ship them as `peer-optional` without consumer breakage | §5 peer-dep table lists ≥6 libraries with `peer-optional + runtime feature-detect` mode; `rg -n "sonner\|posthog-js\|@segment/analytics-next\|@amplitude/analytics-browser\|ical.js\|canvas-confetti" packages/*/package.json` is reproduced in the doc | Audit table has ≥6 rows; reproduced grep output shows zero hard `dependencies` entries |
| US-5 | As Phase 8 author, I want the binary go/no-go on whether Polar emits `tier="trial"` so I know whether to extend the Zod schema or derive client-side | `grep -c "^## 6\." phase-0-validation.md` returns 1, and the section ends with one of the two recorded decision sentences verbatim | One of the two literal decision sentences ("Polar API can emit..." OR "Polar API cannot emit...") appears once and only once in §6 |
| US-6 | As the reviewer, I want a sign-off line so Phase 1 cannot start by accident before the contracts are approved | Last non-blank line of the doc matches `Signed off by: ____ — YYYY-MM-DD` (or filled-in equivalent) | `awk 'NF{line=$0} END{print line}' phase-0-validation.md` begins `Signed off by:` |

---

## 2. Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|---|---|---|---|
| `phase-0-validation.md` document structure | No mock — the doc is the artifact | `grep -c "^## " phase-0-validation.md` ≥ 6 (six top-level sections, one per task) | US-1..US-6 |
| §2 `useTourActions` TS snippet | Extract via `awk`/`sed` into a scratch file; compile with `tsc --noEmit` | snippet exits 0; declares `export interface UseTourActionsReturn` and `export function useTourActions` | US-1 |
| §3 `TourTarget` union TS snippet | Same scratch-paste pattern | snippet exits 0; declares `type TourTarget = string \| ...RefObject... \| ...() =>` and a 3-step resolution order | US-2 |
| §4 force-show matrix table | No mock — Markdown shape check | Table has exactly 5 functional rows + 1 license row; columns header reads `\| Gate \| show() respects? \| forceShow() respects? \|`; license-gate `forceShow()` cell is `Yes` | US-3 |
| §5 peer-dep audit | No mock — reproduce the `rg` output inline; check it has no hard deps | `dependencies` and non-optional `peerDependencies` for sonner/posthog-js/etc. = 0 entries | US-4 |
| §6 Polar sandbox API call | If credentials present: real `curl` against `api.polar.sh/v1/customer-portal/license-keys/validate`. If absent: fall back to memory `project_polar_api_findings.md` and record "credentials unavailable; used memory fallback" verbatim | Decision sentence is one of the two literal options; raw JSON snippet (or fallback note) is included | US-5 |
| Sign-off line | No mock — final non-blank-line check | Doc's final non-blank line begins `Signed off by:` | US-6 |

---

## 3. Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Doc-shape checks (unit equivalent) | `grep`, `rg`, `awk` | <1s | Locally before requesting sign-off; in CI as `pnpm phase-0-doctest` |
| TS snippet compile | `pnpm tsc --noEmit` on `/tmp/scratch-*.ts` | <3s per snippet | Locally before sign-off |
| Polar API live call | `curl` + `jq` with `$POLAR_SANDBOX_KEY` + `$POLAR_ORG_ID` | <2s | Once, by phase author; result pasted into §6 |

No integration tier and no E2E — Phase 0 ships only a document.

---

## 4. No Fake Implementations (Research/Validation Phase)

Phase 0 is a Markdown-first design gate. There is no runtime code, no React component tree, and no library to fake. Every "test" is a deterministic shell check against the doc or a one-shot `tsc --noEmit` against a fenced snippet. The Polar API call is real (or explicitly skipped with a fallback note) — mocking it would defeat the purpose, which is to record what the real wire shape contains.

---

## 5. Test File List

```
tasks/v2-package-polish/
└── phase-0-doctest.sh                # NEW — one shell script with the six US-N assertions
                                        # (extracts snippets to /tmp, runs tsc, greps the doc)
```

Optional: wire `pnpm phase-0-doctest` in the workspace root `package.json` as `"phase-0-doctest": "bash tasks/v2-package-polish/phase-0-doctest.sh"`.

| File | Tier | Tests | Description |
|------|------|-------|-------------|
| `tasks/v2-package-polish/phase-0-doctest.sh` | Doc + snippet | 6 US-N checks | Greps section counts, validates force-show matrix cells, counts exactly one Polar decision sentence; extracts each TS snippet and runs `tsc --noEmit`; checks the final non-blank sign-off line. |

---

## 6. Setup (no `conftest.py` — shell-only)

Replace the conventional `conftest.py` with a small shell harness. Additions only (no existing `phase-0-doctest.sh` to overwrite).

`tasks/v2-package-polish/phase-0-doctest.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

DOC="tasks/v2-package-polish/phase-0-validation.md"
test -f "$DOC" || { echo "FAIL: $DOC missing"; exit 1; }

# US-1..US-6 — six top-level ## sections, one per task
sections=$(grep -c "^## " "$DOC")
[ "$sections" -ge 6 ] || { echo "FAIL: expected ≥6 ## sections, got $sections"; exit 1; }

# Extract §2 useTourActions snippet → /tmp/scratch-use-tour-actions.ts
awk '/^## 2\./,/^## 3\./' "$DOC" | awk '/^```ts/{flag=1;next}/^```/{flag=0}flag' > /tmp/scratch-use-tour-actions.ts
test -s /tmp/scratch-use-tour-actions.ts || { echo "FAIL: §2 TS snippet missing"; exit 1; }
grep -q "export interface UseTourActionsReturn" /tmp/scratch-use-tour-actions.ts || { echo "FAIL: §2 missing UseTourActionsReturn"; exit 1; }
grep -q "export function useTourActions" /tmp/scratch-use-tour-actions.ts || { echo "FAIL: §2 missing useTourActions export"; exit 1; }
pnpm tsc --noEmit --target ES2020 --moduleResolution node /tmp/scratch-use-tour-actions.ts

# Extract §3 TourTarget snippet
awk '/^## 3\./,/^## 4\./' "$DOC" | awk '/^```ts/{flag=1;next}/^```/{flag=0}flag' > /tmp/scratch-target-union.ts
test -s /tmp/scratch-target-union.ts || { echo "FAIL: §3 TS snippet missing"; exit 1; }
grep -q "type TourTarget" /tmp/scratch-target-union.ts || { echo "FAIL: §3 missing TourTarget type"; exit 1; }
pnpm tsc --noEmit --target ES2020 --moduleResolution node /tmp/scratch-target-union.ts

# §4 matrix — count functional rows + license row
section4=$(awk 'BEGIN{sec=0} /^## 4\./{sec=1; next} /^## [0-9]+\./ && sec{exit} sec{print}' "$DOC")
matrix_rows=$(printf '%s\n' "$section4" | grep -cE "^\| (frequency|cooldown|viewCount|isDismissed|audience|License gate)")
[ "$matrix_rows" -eq 6 ] || { echo "FAIL: expected 6 matrix rows (5 functional + 1 license), got $matrix_rows"; exit 1; }
bad_force_cells=$(printf '%s\n' "$section4" | awk -F'|' '/^\| (frequency|cooldown|viewCount|isDismissed|audience) / { cell=$4; gsub(/[[:space:]]/, "", cell); if (cell != "No") bad++ } END{print bad+0}')
[ "$bad_force_cells" -eq 0 ] || { echo "FAIL: all functional forceShow cells must be No"; exit 1; }
license_force_cell=$(printf '%s\n' "$section4" | awk -F'|' '/^\| License gate / { cell=$4; gsub(/[[:space:]]/, "", cell); print cell }')
[ "$license_force_cell" = "Yes" ] || { echo "FAIL: License gate forceShow cell must be Yes"; exit 1; }

# §5 peer-dep audit ≥ 6 libraries
peer_rows=$(awk '/^## 5\./,/^## 6\./' "$DOC" | grep -cE "^\| (sonner|posthog-js|gtag|@segment|@amplitude|ical|canvas-confetti)")
[ "$peer_rows" -ge 6 ] || { echo "FAIL: peer-dep audit needs ≥6 libraries, got $peer_rows"; exit 1; }

# §5 grep purity — no current hard deps
! rg -n '"sonner"\|"posthog-js"\|"@segment/analytics-next"\|"@amplitude/analytics-browser"\|"ical.js"\|"canvas-confetti"' packages/*/package.json \
  | grep -E '"dependencies"' \
  || { echo "FAIL: at least one optional lib is in dependencies"; exit 1; }

# US-5 — §6 contains exactly one of the two verbatim decision sentences
decision_yes='Polar API can emit `tier="trial"`'
decision_no='Polar API cannot emit `tier="trial"`'
section6=$(awk 'BEGIN{sec=0} /^## 6\./{sec=1; next} /^## [0-9]+\./ && sec{exit} sec{print}' "$DOC")
yes_count=$(printf '%s\n' "$section6" | grep -F -c "$decision_yes" || true)
no_count=$(printf '%s\n' "$section6" | grep -F -c "$decision_no" || true)
decision_count=$((yes_count + no_count))
[ "$decision_count" -eq 1 ] || { echo "FAIL: §6 must contain exactly one Polar decision sentence, got $decision_count"; exit 1; }

# US-6 — sign-off line is the final non-blank line
last_nonblank=$(awk 'NF{line=$0} END{print line}' "$DOC")
case "$last_nonblank" in
  Signed\ off\ by:*) ;;
  *) echo "FAIL: final non-blank line must begin 'Signed off by:'"; exit 1 ;;
esac

echo "OK: phase-0 doc gate passes"
```

---

## 7. Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Tests are shell, not Vitest | One bash script with `set -euo pipefail` | Phase 0 has no JS to import; spinning up Vitest just to grep a Markdown file would add noise without value. |
| TS snippet validation uses `tsc --noEmit` directly | Extract fenced block → write to `/tmp/scratch-<name>.ts` → compile | The snippet must be syntactically valid TS in isolation. Compiling it in-place verifies it; reviewers can run the same command locally. |
| Polar API call is recorded verbatim, redacted | The author records the raw JSON snippet (with key/customer fields redacted) into §6 | Whoever reads this in 6 months needs to see what Polar actually shipped at decision time, not a paraphrase. |
| Fallback when Polar credentials are unavailable | Use memory entry `project_polar_api_findings.md` (#187) AND record "credentials unavailable; used memory fallback" verbatim | Honesty over completeness — invented contract details would be worse than no contract details. |
| §4 row count is asserted as a single regex | One `grep -cE` over the section | The matrix is the most-read part of the doc; if a row goes missing, downstream phases will silently bypass the wrong gate. The CI catch must be unambiguous. |
| §5 grep purity check inverts `rg` | `! rg ... \| grep dependencies` | A new hard dep slipping into `dependencies` would invalidate the peer-optional plan in Phases 7/13/14/15. |
| Sign-off check reads the final non-blank line | `awk 'NF{line=$0} END{print line}' "$DOC"` then prefix-match `Signed off by:` | Anchors the sign-off as the actual final content; `tail -3` can falsely pass if trailing notes are added below the sign-off. |

---

## 8. Example Test Case

This phase has no representative test module in the conventional sense — the script above is the entire suite. Below is the §2 extract + compile fragment, isolated:

```bash
# Extract §2 (useTourActions) fenced TS block and compile it.
# Demonstrates: AWK range extraction, fenced-block isolation, tsc --noEmit gate.

DOC="tasks/v2-package-polish/phase-0-validation.md"
SNIPPET=/tmp/scratch-use-tour-actions.ts

awk '/^## 2\./,/^## 3\./' "$DOC" \
  | awk '/^```ts/{flag=1;next}/^```/{flag=0}flag' \
  > "$SNIPPET"

# Must compile in isolation — no project tsconfig, no module graph.
pnpm tsc --noEmit --target ES2020 --moduleResolution node "$SNIPPET"

# Must declare the expected exports (regex guards against silent renames).
grep -q "export interface UseTourActionsReturn" "$SNIPPET"
grep -q "export function useTourActions" "$SNIPPET"
```

---

## 9. Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test harness:

---

You are writing the Phase 0 documentation-gate test harness for Tour Kit v2 Package Polish.

### What This Project Is

Tour Kit is a pnpm + Turborepo monorepo of 12 packages providing headless React product-tour primitives. Phase 0 is a **documentation-only validation gate** — its deliverable is `tasks/v2-package-polish/phase-0-validation.md`, a single Markdown doc with six top-level `## ` sections locking the cross-cutting TypeScript signatures for Phases 1, 5, 7, 8, and 13. No `packages/*` source code changes in Phase 0.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | `useTourActions` signature signed off | §2 fenced TS block + `tsc --noEmit` | `tsc` exit 0; declares `UseTourActionsReturn` interface + `useTourActions` function |
| US-2 | `TourTarget` union with resolution order signed off | §3 fenced TS block + `tsc --noEmit`; numbered resolution list | `tsc` exit 0; resolution order has 3 items (string → RefObject → function) |
| US-3 | `forceShow` bypass matrix row-by-row | §4 Markdown table | 5 functional rows + 1 license row; license `forceShow()` = Yes, others = No |
| US-4 | Peer-dep audit with feature-detect snippets | §5 Markdown table | ≥6 libraries listed `peer-optional`; reproduced `rg` shows zero hard deps |
| US-5 | Polar trial-tier go/no-go recorded | §6 contains one of two literal decision sentences | Exactly one of "Polar API can emit..." OR "Polar API cannot emit..." appears verbatim |
| US-6 | Sign-off line present | Last non-blank line of doc | Begins `Signed off by:` |

### Why Fakes Are Required

None. Phase 0 has no runtime to mock. The Polar API call is real (or explicitly skipped with a documented fallback to memory `project_polar_api_findings.md` #187). The TypeScript snippets are compiled, not stubbed.

### What NOT to Test

- Don't test the runtime semantics of `useTourActions`, `TourTarget`, or `forceShow` here — those are Phase 1, 5, and 1 respectively. Phase 0 only verifies the **contract** is captured.
- Don't validate any `packages/*` source files. Phase 0 changes none of them.
- Don't add Vitest. Shell + `tsc --noEmit` is the right granularity; introducing a test runner adds noise.
- Don't gate the doc on lint or prose-quality checks. Reviewers handle prose; the script handles shape.

### Critical: No Fake Implementations

This is a research/validation phase. See §4 of this plan for the rationale.

### Test Files to Create

```
tasks/v2-package-polish/
└── phase-0-doctest.sh    # NEW — single bash script with US-1..US-6 assertions
```

### File: tasks/v2-package-polish/phase-0-doctest.sh

Use the full skeleton in §6 of this plan. Make it executable (`chmod +x`). Wire it into the workspace root `package.json` as `"phase-0-doctest": "bash tasks/v2-package-polish/phase-0-doctest.sh"`.

### Per-File Coverage Guidance

#### `tasks/v2-package-polish/phase-0-doctest.sh`
Six assertions in order, one per user story:

1. **US-1 + US-2** — extract §2 and §3 fenced `ts` blocks, write to `/tmp/scratch-*.ts`, run `pnpm tsc --noEmit --target ES2020 --moduleResolution node`. Both must exit 0.
2. **US-3** — `awk` over §4, count rows matching `frequency|cooldown|viewCount|isDismissed|audience|License gate` → must equal 6; assert all five functional `forceShow()` cells are `No` and the license-gate `forceShow()` cell is `Yes`.
3. **US-4** — `awk` over §5, count rows matching the six library names → must be ≥ 6. Then `! rg ... | grep dependencies` to assert no hard dep slipped in.
4. **US-5** — extract §6, count both verbatim decision sentences, and fail unless the combined count is exactly 1.
5. **US-6** — read the final non-blank line and require it to begin `Signed off by:`.

Each failed assertion echoes a `FAIL:` line with the specific check and exits non-zero. Last line on success is `OK: phase-0 doc gate passes`.

### Data Model Notes

- Phase 0 has no data model. Snippets in the doc are **contracts** for later phases — they live in the doc only and are copy-pasted into `packages/core/src/types/*.ts` starting in Phase 1.
- `tsc --noEmit --target ES2020 --moduleResolution node` is the canonical compile command for in-doc snippets. Don't add a tsconfig; isolation is the point.

### Success Criteria

- `bash tasks/v2-package-polish/phase-0-doctest.sh` exits 0
- `grep -c "^## " tasks/v2-package-polish/phase-0-validation.md` ≥ 6
- Both extracted TS snippets compile under `tsc --noEmit`
- §4 has exactly 5 functional + 1 license row
- §5 has ≥6 peer-optional libraries; `rg` output shows zero hard deps
- §6 contains exactly one of the two verbatim decision sentences
- Doc's final non-blank line begins `Signed off by:`
- **No `packages/*` files modified** — `git diff --stat packages/ | wc -l` returns 0 in the doc PR

### Expected File Structure at End

```
tasks/v2-package-polish/
├── big-plan.md                  # unchanged (or +1 TODO line at the bottom from Task 0.1)
├── phase-0.md                   # this phase's plan (unchanged)
├── phase-0-validation.md        # the deliverable (sign-off pending)
├── phase-0-tests.md             # this test plan (unchanged after writing)
└── phase-0-doctest.sh           # NEW — the assertion harness
```

---

## 10. Run Commands

```bash
# Local doc gate — run before requesting sign-off
bash tasks/v2-package-polish/phase-0-doctest.sh

# Extract a single snippet manually (debugging)
SNIPPET=/tmp/scratch-use-tour-actions.ts
awk '/^## 2\./,/^## 3\./' tasks/v2-package-polish/phase-0-validation.md \
  | awk '/^```ts/{flag=1;next}/^```/{flag=0}flag' \
  > "$SNIPPET"
pnpm tsc --noEmit --target ES2020 --moduleResolution node "$SNIPPET"

# Validate sign-off is the final line
awk 'NF{line=$0} END{print line}' tasks/v2-package-polish/phase-0-validation.md | grep "^Signed off by:"

# Run as a workspace script (after wiring it in)
pnpm phase-0-doctest
```
