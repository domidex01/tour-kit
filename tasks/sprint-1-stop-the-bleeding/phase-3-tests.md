# Phase 3 — Testing: Add `"sideEffects": false` to `@tour-kit/adoption` (B-5)

**Scope:** `packages/adoption/package.json` — single new line: `"sideEffects": false`.
**Phase type:** **Pure metadata.** No runtime code changes, no dist changes,
no behavior changes. The field is read by *consumer* bundlers at *consumer*
build time, not by us. There is literally nothing in our own pipeline that
exercises the field — which is why this phase's test plan looks short on
runtime assertions and heavy on shape gates.
**Key Pattern:** Two cheap gates: (a) the file shape is correct (JSON
parseable, plain `false`, in the right position), and (b) nothing else
about the package moved (build byte-identical, tests green, dist exists).
The interesting validation — proving a consumer can now tree-shake — lives
in Phase 7's bundle-size gate; do not duplicate it here.
**Dependencies:** `node` for the package.json parse, `pnpm` for build + test,
`git` for the dist-diff check.

---

## User Stories

| #    | User Story                                                                                                                              | Validation Check                                                                                                                                | Pass Condition                                                                              |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| US-1 | As a consumer who only uses `useAdoption`, I want my bundler to tree-shake the other 18 named exports out of my bundle.                  | `node -e "const p=require('./packages/adoption/package.json'); process.exit(p.sideEffects === false ? 0 : 1)"`                                  | `p.sideEffects === false` (plain `false`, not array, not string)                            |
| US-2 | As a repo maintainer, I want adoption to follow the same `sideEffects` convention as every other package — consistency over cleverness.  | `grep -h '"sideEffects"' packages/*/package.json \| sort -u`                                                                                    | One unique line: `  "sideEffects": false,` — adoption joins the existing set, no array form |
| US-3 | As a CSS-importing consumer, I want my `import '@tour-kit/adoption/styles/funnel.css'` to still work after the field is added.           | Run the `apps/docs` dev server, navigate to a page that uses adoption styles, confirm visual render                                              | Funnel chart visible + styled (manual visual check, no automated assertion)                  |
| US-4 | As a CI engineer, I want the adoption package build + test to remain identical — this is metadata, not behavior.                         | `pnpm --filter @tour-kit/adoption build && pnpm --filter @tour-kit/adoption test --run`                                                         | Both exit 0; dist file list unchanged                                                        |
| US-5 | As a release engineer, I want the dist bytes to be byte-identical before/after (no accidental rebuild side effects from the JSON edit).  | Hash `dist/` before/after the metadata change, compare                                                                                          | `sha256sum dist/index.js` identical pre vs. post-edit (build is deterministic on this field) |

---

## Component Mock Strategy

| Component                              | Mock Strategy                                          | What to Assert                                                                | User Story |
| -------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- | ---------- |
| `package.json` field shape             | None — read JSON in node                               | `sideEffects === false` (strict equality, boolean)                            | US-1, US-2 |
| Sibling convention sweep               | None — bash + grep                                     | All 11 other packages also use plain `false`, not array form                  | US-2       |
| CSS import smoke                       | None — manual visual check in `apps/docs dev`         | Funnel/onboarding example renders styled                                       | US-3       |
| Build + test                           | None — run pnpm                                        | Exit 0; dist file list matches `find dist -type f` from a pre-change snapshot | US-4       |
| Byte-identicality of dist              | `sha256sum dist/index.js` before/after                | Hashes match                                                                  | US-5       |

---

## Test Tier Table

| Tier             | Dependencies                                              | Speed     | When to Run                              |
| ---------------- | --------------------------------------------------------- | --------- | ---------------------------------------- |
| Shape gate       | `node`, JSON read                                         | < 1 s     | Pre-PR, in `verify-phase-3.sh`           |
| Convention sweep | `grep` over sibling `packages/*/package.json`             | < 1 s     | Pre-PR                                    |
| Build + unit     | Existing adoption build + vitest                          | ~30 s     | Pre-PR                                    |
| Visual smoke     | `apps/docs` dev server, manual eye                        | ~2 min    | Pre-PR (US-3 only; not automated)        |
| Byte-identical   | `sha256sum` before/after                                  | < 5 s     | Pre-PR (US-5; one-time, kept for record) |

No vitest changes. No new tests inside `packages/adoption/src/__tests__/`.
The phase is too small to justify ceremony — adding `vitest` cases that
re-import the package and read its `package.json.sideEffects` would be
testing `require()` itself.

---

## No Fake Implementations (Pure Metadata)

There is no behavior, no third party, no runtime path to fake. The field
is read by *downstream* bundlers we don't control. The downstream bundler
behavior IS the contract being shipped, and exercising it directly belongs
to Phase 7's bundle-size CI gate, not here.

If this section feels short — it is. Resist adding mocks for the sake of
section completeness.

---

## Test File List

```
packages/adoption/
└── package.json                            # MODIFIED — one new line

tasks/sprint-1-stop-the-bleeding/
└── verify-phase-3.sh                       # NEW: idempotent post-edit gate runner

# No new test files. No edits to packages/adoption/src/__tests__/.
```

---

## Asserter (replaces `conftest.py` for this JS phase)

```bash
#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-phase-3.sh
# Run before opening the Phase 3 PR.
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2 — $(eval "$3")"; fails=$((fails+1)); fi; }

# US-1: field exists, value is the boolean false
gate 'node -e "const p=require(\"./packages/adoption/package.json\"); process.exit(p.sideEffects === false ? 0 : 1)"' \
     'US-1: adoption package.json has sideEffects === false' "echo missing or wrong type"

# US-2: matches sibling convention
unique=$(grep -h '"sideEffects"' packages/*/package.json | sort -u | wc -l | tr -d ' ')
gate "[ $unique -eq 1 ]" "US-2: every package uses the same sideEffects line" "grep -l '\"sideEffects\"' packages/*/package.json"

# US-2 (corollary): adoption is no longer the missing one
gate 'grep -q "\"sideEffects\": false" packages/adoption/package.json' \
     'US-2: adoption line matches sibling form (false, not array)' "head -30 packages/adoption/package.json"

# US-4: build + test green
gate 'pnpm --filter @tour-kit/adoption build >/tmp/phase-3-build.log 2>&1' \
     'US-4: adoption build green' "tail -n5 /tmp/phase-3-build.log"
gate 'pnpm --filter @tour-kit/adoption test --run >/tmp/phase-3-test.log 2>&1' \
     'US-4: adoption vitest green' "tail -n5 /tmp/phase-3-test.log"

# Sanity: dist exists and has at least the expected entry points
gate '[ -f packages/adoption/dist/index.js ]' 'US-4: dist/index.js exists' "echo missing"
gate '[ -f packages/adoption/dist/index.d.ts ]' 'US-4: dist/index.d.ts exists' "echo missing"
gate '[ -d packages/adoption/dist/styles ] || [ -f packages/adoption/dist/styles/funnel.css ]' \
     'US-4: dist styles still emitted' "ls packages/adoption/dist/styles 2>/dev/null"

[ "$fails" -eq 0 ] || { echo "Phase 3 FAILED gates: $fails"; exit 1; }
echo "Phase 3 all gates green."
```

For the **byte-identical** check (US-5), run this manually once during
review and discard — no point keeping it in CI:

```bash
# US-5: byte-identical dist (manual one-shot)
sha_before=$(git stash && pnpm --filter @tour-kit/adoption build >/dev/null 2>&1 \
              && sha256sum packages/adoption/dist/index.js && git stash pop)
sha_after=$(pnpm --filter @tour-kit/adoption build >/dev/null 2>&1 \
             && sha256sum packages/adoption/dist/index.js)
diff <(echo "$sha_before") <(echo "$sha_after")
# Empty diff = dist unchanged. tsup ignores sideEffects, so this should pass.
```

---

## Key Testing Decisions

| Decision                                                          | Approach                                                      | Rationale                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| No vitest tests                                                   | Bash asserter only                                            | The change is JSON metadata. A vitest test that reads `package.json` would be testing `require()`. Ceremony.             |
| Convention sweep instead of "field present"                       | `grep ... \| sort -u \| wc -l` == 1                          | "Present" is too weak. The whole point of the audit is *consistency* with sibling packages — drift into array form would be a regression. |
| Don't auto-test consumer tree-shaking                             | Defer to Phase 7 size-limit gate                              | We don't ship the consumer bundler. Asserting "rollup tree-shook our exports" inside our test suite would be testing rollup. |
| Visual CSS smoke is manual, not automated                          | Open `apps/docs` dev, eyeball                                 | The risk surface ("CSS now stripped because we said no side effects") is real, but Playwright snapshot of a docs page is 10× the cost of the change being tested. A 30-second eyeball check is honest. |
| US-5 byte-identical is a one-shot, not in CI                      | Manual `sha256sum` before/after                               | tsup is documented not to read `sideEffects`. We assert this once; baking it into CI would couple the gate to tsup's internals. |
| Don't test the `B-5 already fixed?` precondition in this plan      | Phase plan §1 covers it ("grep, abort if found")              | The precondition belongs to the human running the phase, not the test plan.                                              |

---

## Example "Test Case" — Reading the asserter output

```bash
$ bash tasks/sprint-1-stop-the-bleeding/verify-phase-3.sh
✓ US-1: adoption package.json has sideEffects === false
✓ US-2: every package uses the same sideEffects line
✓ US-2: adoption line matches sibling form (false, not array)
✓ US-4: adoption build green
✓ US-4: adoption vitest green
✓ US-4: dist/index.js exists
✓ US-4: dist/index.d.ts exists
✓ US-4: dist styles still emitted
Phase 3 all gates green.
```

If `US-2: every package uses the same sideEffects line` is red, your
edit landed in a different position or used a different value (e.g.
`"sideEffects": ["**/*.css"]` instead of `false`). Reconcile against the
existing convention before merging.

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write
the Phase 3 asserter and verify the metadata edit:

---
You are completing Phase 3 of Sprint 1 in the tour-kit monorepo — adding
`"sideEffects": false` to `packages/adoption/package.json` so consumer
bundlers can tree-shake unused adoption exports.

### What This Project Is
`@tour-kit/adoption` is a feature-adoption tracking package with 19 named
exports. Every other package in the monorepo declares `"sideEffects":
false`; adoption was missed. Without the field, consumer bundlers must
conservatively keep every imported module, defeating tree-shaking.

### Acceptance Criteria (from User Stories)
| #    | User Story                                                    | Validation Check                                              | Pass Condition                          |
| ---- | ------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| US-1 | Consumer can tree-shake unused exports                        | `node -e "...p.sideEffects === false"`                        | Returns `true`                          |
| US-2 | Convention matches every sibling package                       | `grep -h '"sideEffects"' packages/*/package.json \| sort -u`  | One unique line                          |
| US-3 | CSS imports from adoption still render                        | Manual visual check in `apps/docs` dev                        | Funnel chart still styled                |
| US-4 | Build + test still green; dist file list unchanged             | `pnpm --filter @tour-kit/adoption build && test`              | Both exit 0                              |
| US-5 | Dist bytes identical before/after                              | `sha256sum dist/index.js` before/after                        | Hashes match                             |

### Why Fakes Are Required
None. There is no runtime code path. The field is consumed by downstream
bundlers we don't control. Asserting "rollup tree-shook our exports"
inside our test suite would be testing rollup, not us.

### What NOT to Test
- Don't add vitest cases that read `package.json.sideEffects` — that's
  testing `require()`.
- Don't write a Playwright snapshot of the funnel chart — eyeball it
  once in `apps/docs dev` instead.
- Don't try to assert downstream tree-shaking behavior — that belongs to
  Phase 7's size-limit gate.
- Don't propose the array form `["**/*.css"]`. Every sibling uses plain
  `false`; consistency over cleverness.
- Don't touch any code under `packages/adoption/src/`. This is a metadata
  PR.

### Critical: The Asserter

```bash
#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-phase-3.sh
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2"; fails=$((fails+1)); fi; }

gate 'node -e "const p=require(\"./packages/adoption/package.json\"); process.exit(p.sideEffects === false ? 0 : 1)"' \
     'US-1: sideEffects === false'

unique=$(grep -h '"sideEffects"' packages/*/package.json | sort -u | wc -l | tr -d ' ')
gate "[ $unique -eq 1 ]" "US-2: convention matches all siblings"

gate 'pnpm --filter @tour-kit/adoption build >/tmp/phase-3-build.log 2>&1' \
     'US-4: build green'
gate 'pnpm --filter @tour-kit/adoption test --run >/tmp/phase-3-test.log 2>&1' \
     'US-4: test green'
gate '[ -f packages/adoption/dist/index.js ]' 'US-4: dist/index.js exists'

[ "$fails" -eq 0 ] || { echo "FAILED gates: $fails"; exit 1; }
echo "Phase 3 all gates green."
```

### Files to Create / Modify

```
packages/adoption/package.json              # add "sideEffects": false
tasks/sprint-1-stop-the-bleeding/verify-phase-3.sh   # new
```

### Per-File Coverage Guidance

#### `packages/adoption/package.json`
- Add exactly: `  "sideEffects": false,`
- Position: immediately after the `"publishConfig"` block, before
  `"scripts"`. Match the position used by every other `packages/*/package.json`.
- Plain `false`, not array, not string.
- Biome may want to re-order JSON keys after `pnpm lint` — accept whatever
  it asks for; the order within the JSON object is not load-bearing.

#### `verify-phase-3.sh`
- The body shown above.
- `chmod +x` after creating.

### Success Criteria
- `bash tasks/sprint-1-stop-the-bleeding/verify-phase-3.sh` prints all ✓.
- `git diff packages/adoption/package.json` shows one new line (or up to 3
  lines if biome re-ordered adjacent keys).
- `git diff packages/adoption/src/` is empty.
- `apps/docs dev` still renders the funnel example with styles (eyeball
  check, not automated).

### Expected End State

```
packages/adoption/
└── package.json                            # +"sideEffects": false

tasks/sprint-1-stop-the-bleeding/
└── verify-phase-3.sh                       # NEW
```
---

---

## Run Commands

```bash
# Apply the asserter
chmod +x tasks/sprint-1-stop-the-bleeding/verify-phase-3.sh
bash tasks/sprint-1-stop-the-bleeding/verify-phase-3.sh

# Manual visual smoke (US-3)
pnpm --filter @tour-kit/docs dev
# Open the adoption example page in a browser; confirm funnel styling.

# Byte-identical dist (US-5, one-shot)
git stash
pnpm --filter @tour-kit/adoption build >/dev/null
sha256sum packages/adoption/dist/index.js > /tmp/sha_before
git stash pop
pnpm --filter @tour-kit/adoption build >/dev/null
sha256sum packages/adoption/dist/index.js > /tmp/sha_after
diff /tmp/sha_before /tmp/sha_after && echo "Byte-identical." || echo "DIFFERS — investigate."
```

---

**Next:** [phase-4-tests.md](phase-4-tests.md)
