# Phase 4 — Testing: pnpm Catalog Hygiene (R-3)

**Scope:** `pnpm-workspace.yaml` (add 7 catalog entries), 9 `packages/*/package.json`
files (replace pinned `^x.y.z` with `catalog:` for the 7 libs), `pnpm-lock.yaml`
(zero resolution diff vs baseline).
**Phase type:** **Workspace metadata.** No runtime code touched, no behavior
change intended. The risk surface is pnpm: does `catalog:` resolve to the
same versions, including in `peerDependencies`? The test plan focuses
exclusively on resolution drift and downstream build/test stability.
**Key Pattern:** Lockfile-diff equality against the Phase 0 baseline +
exhaustive grep for stale pinned versions + full monorepo build/test gate.
No vitest changes anywhere. The "test" is "does pnpm + every package's
existing test suite still pass?"
**Dependencies:** `pnpm@10.26.1`, `git diff`, `git grep`, `node`, the
Phase 0 baseline at `tasks/sprint-1-stop-the-bleeding/baselines/pnpm-lock.baseline.yaml`.

---

## User Stories

| #    | User Story                                                                                                                          | Validation Check                                                                                                                | Pass Condition                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| US-1 | As a maintainer, I want bumping `@floating-ui/react` (or any of the 7 libs) to be a one-line edit in `pnpm-workspace.yaml`, not a 9-file find-and-replace. | `grep -E '"(@floating-ui/react\|class-variance-authority\|@radix-ui/react-slot\|@radix-ui/react-dialog\|@mui/base\|clsx\|tailwind-merge)": "\^' packages/*/package.json` | `0` matches                                                                                  |
| US-2 | As a CI engineer, I want `pnpm install` to produce the *same* resolved versions before and after — this is a refactor, not an upgrade. | `diff baselines/pnpm-lock.baseline.yaml pnpm-lock.yaml`                                                                          | Diff is empty or limited to a small catalog-metadata block (no `resolved:` URL changes)     |
| US-3 | As a downstream maintainer, I want every package to still build after `catalog:` resolution.                                         | `pnpm build --filter='./packages/*'`                                                                                            | exit 0                                                                                       |
| US-4 | As a CI engineer, I want every package's existing test suite to still pass.                                                          | `pnpm test --filter='./packages/*'`                                                                                             | exit 0                                                                                       |
| US-5 | As a consumer who installs `@tour-kit/announcements` from npm, I want `peerDependencies: { "@mui/base": "catalog:" }` to publish a resolvable version range to my installer. | `node -e "..."` reads each `packages/*/package.json` and resolves `catalog:` against `pnpm-workspace.yaml`'s `catalog:` block | All 7 libs (where used) appear in the resolved peer table with an exact version range       |
| US-6 | As a future debugger, I want the `pnpm-workspace.yaml` catalog block to be the single source of truth — no duplicate `workspaces.catalog` shadow in root `package.json`. | `grep -A 20 '"workspaces"' package.json` and confirm no `catalog` key is added there                                            | Root `package.json` `workspaces` has no new `catalog` sub-block                              |
| US-7 | As a maintainer running Phase 7 next, I want `pnpm-lock.yaml` to remain consistent with `--frozen-lockfile`.                          | `pnpm install --frozen-lockfile`                                                                                                | exit 0                                                                                       |

---

## Component Mock Strategy

| Component                              | Mock Strategy                                              | What to Assert                                                                            | User Story  |
| -------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| `pnpm-workspace.yaml` catalog block    | None — real YAML read                                      | 7 new entries, exact version strings matching the pre-phase pinned values                  | US-1        |
| Per-package `package.json` edits        | None — real JSON read in node                              | Every previously-pinned version is now `"catalog:"`; counts match the audit table         | US-1        |
| pnpm install + lock resolution         | None — real `pnpm install`                                 | Lockfile diff vs Phase 0 baseline is empty (or catalog-only metadata)                      | US-2, US-7  |
| Workspace build                        | None — real builds                                         | `pnpm build --filter='./packages/*'` exits 0                                              | US-3        |
| Workspace tests                        | None — real test suites                                    | `pnpm test --filter='./packages/*'` exits 0                                               | US-4        |
| Peer-dep resolution                    | None — JSON parse + manual catalog lookup                  | For each `peerDependencies: { "X": "catalog:" }`, the catalog has `X: <version>`           | US-5        |
| Root `package.json` shadow check        | None — JSON read                                           | No `workspaces.catalog` shadow block introduced                                            | US-6        |

---

## Test Tier Table

| Tier               | Dependencies                                              | Speed     | When to Run                              |
| ------------------ | --------------------------------------------------------- | --------- | ---------------------------------------- |
| Shape gate         | `git grep`, `node`                                        | < 5 s     | Pre-PR                                    |
| Lockfile-diff gate | `pnpm install`, `diff` against baseline                   | ~1 min    | Pre-PR + on CI                            |
| Workspace build    | All packages built once                                   | ~3 min    | Pre-PR + on CI                            |
| Workspace tests    | All packages' vitest suites                               | ~2 min    | Pre-PR + on CI                            |
| Peer-resolve gate  | `node` + JSON                                             | < 2 s     | Pre-PR                                    |

No vitest changes. No new fakes. No new test files.

---

## No Fake Implementations (Workspace Metadata)

Phase 4 has no behavior to mock. The only "third party" is pnpm itself,
and we want to exercise its real resolution. Mocking pnpm would defeat
the entire point of the lockfile-diff gate.

The only file written for this phase outside the package metadata is
the bash asserter (§Asserter Skeleton below).

---

## Test File List

```
pnpm-workspace.yaml                              # MODIFIED — 7 new catalog entries
packages/hints/package.json                      # MODIFIED — 3 deps + 1 peer
packages/announcements/package.json              # MODIFIED — 4 deps + 1 peer
packages/checklists/package.json                 # MODIFIED — 3 deps + 1 peer
packages/ai/package.json                         # MODIFIED — 1 dep
packages/core/package.json                       # MODIFIED — 2 deps (clsx, tailwind-merge)
packages/surveys/package.json                    # MODIFIED — 3 deps + 1 peer
packages/adoption/package.json                   # MODIFIED — 2 deps + 1 peer
packages/media/package.json                      # MODIFIED — 2 deps + 1 peer
packages/react/package.json                      # MODIFIED — 3 deps + 1 peer
pnpm-lock.yaml                                   # MODIFIED — catalog metadata only, no resolution drift

tasks/sprint-1-stop-the-bleeding/
└── verify-phase-4.sh                            # NEW: idempotent post-edit gate runner
```

---

## Asserter Skeleton

```bash
#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-phase-4.sh
# Run after editing package.json files and running `pnpm install`.
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2 — $(eval "$3")"; fails=$((fails+1)); fi; }

BASELINE_LOCK="tasks/sprint-1-stop-the-bleeding/baselines/pnpm-lock.baseline.yaml"

# US-1: no remaining pinned versions for the 7 catalog libs
pinned=$(git grep -cE '"(@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge)": "\^' packages/ | wc -l | tr -d ' ')
gate "[ $pinned -eq 0 ]" "US-1: no pinned catalog libs in packages/" "git grep -E '\"(@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge)\": \"\\^' packages/"

# US-1 (positive): pnpm-workspace.yaml has the 7 new entries
for lib in '@floating-ui/react' 'class-variance-authority' '@radix-ui/react-slot' '@radix-ui/react-dialog' '@mui/base' 'clsx' 'tailwind-merge'; do
  gate "grep -qE '\"?${lib}\"?:' pnpm-workspace.yaml" "US-1: catalog has ${lib}" "echo missing in pnpm-workspace.yaml"
done

# US-2: lockfile resolution unchanged vs baseline
if [ -f "$BASELINE_LOCK" ]; then
  # Resolution-relevant lines: anything with `resolved:` or version pins.
  # Catalog metadata is allowed to differ.
  diff_count=$(diff "$BASELINE_LOCK" pnpm-lock.yaml | grep -E '^[<>] ' | grep -v 'catalog' | wc -l | tr -d ' ')
  gate "[ $diff_count -lt 20 ]" "US-2: lockfile resolution drift < 20 non-catalog lines" "echo got $diff_count"
else
  echo "✗ US-2: baselines/pnpm-lock.baseline.yaml missing — re-run Phase 0"
  fails=$((fails+1))
fi

# US-3: workspace builds
gate 'pnpm build --filter=./packages/* >/tmp/phase-4-build.log 2>&1' \
     'US-3: pnpm build --filter=./packages/* green' "tail -n5 /tmp/phase-4-build.log"

# US-4: workspace tests
gate 'pnpm test --filter=./packages/* --run >/tmp/phase-4-test.log 2>&1' \
     'US-4: pnpm test --filter=./packages/* green' "tail -n10 /tmp/phase-4-test.log"

# US-5: catalog: in peerDependencies resolves
gate 'node tasks/sprint-1-stop-the-bleeding/_phase-4-peer-resolve.mjs' \
     'US-5: every catalog: peer resolves to a real version' "node tasks/sprint-1-stop-the-bleeding/_phase-4-peer-resolve.mjs"

# US-6: root package.json hasn't grown a shadow catalog
gate 'node -e "const p=require(\"./package.json\"); process.exit(p.workspaces?.catalog ? 1 : 0)"' \
     'US-6: no workspaces.catalog shadow in root package.json' "echo found shadow"

# US-7: frozen lockfile install
gate 'pnpm install --frozen-lockfile >/tmp/phase-4-frozen.log 2>&1' \
     'US-7: pnpm install --frozen-lockfile green' "tail -n10 /tmp/phase-4-frozen.log"

[ "$fails" -eq 0 ] || { echo "Phase 4 FAILED gates: $fails"; exit 1; }
echo "Phase 4 all gates green."
```

### Helper: `_phase-4-peer-resolve.mjs`

```js
// tasks/sprint-1-stop-the-bleeding/_phase-4-peer-resolve.mjs
// Exits 0 if every `peerDependencies: { ...: "catalog:" }` in packages/*/
// resolves against the `catalog:` block in pnpm-workspace.yaml.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import { join } from 'node:path'

const ws = parseYaml(readFileSync('pnpm-workspace.yaml', 'utf8'))
const catalog = ws.catalog ?? {}

const pkgDirs = readdirSync('packages').filter(d =>
  statSync(join('packages', d)).isDirectory()
)

let fails = 0
for (const dir of pkgDirs) {
  const pkgPath = join('packages', dir, 'package.json')
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    for (const section of ['dependencies', 'peerDependencies']) {
      const block = pkg[section] ?? {}
      for (const [name, range] of Object.entries(block)) {
        if (range === 'catalog:') {
          if (!catalog[name]) {
            console.error(`✗ ${pkgPath} ${section}.${name}: catalog: but no catalog entry`)
            fails++
          }
        }
      }
    }
  } catch (e) {
    console.error(`Cannot read ${pkgPath}: ${e.message}`)
    fails++
  }
}

process.exit(fails === 0 ? 0 : 1)
```

`yaml` is already in the workspace dependency graph (via the docs site).
If your node setup can't find it from the repo root, replace with a small
inline parser — or add `node -e "require('yaml')"` to the pre-conditions.

---

## Key Testing Decisions

| Decision                                                          | Approach                                                      | Rationale                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Use the Phase 0 baseline lockfile for the diff gate                | `diff baselines/pnpm-lock.baseline.yaml pnpm-lock.yaml`       | Phase 0 captured the lockfile *specifically* so this gate could be meaningful. Comparing against `main` would race with sibling merges. |
| Allow catalog-metadata lines in the lockfile diff                  | `grep -v 'catalog'` before counting                           | pnpm legitimately writes a `catalog:` metadata block when catalog is used. Resolution drift is what we care about.        |
| 20-line drift tolerance, not strict zero                           | `[ $diff_count -lt 20 ]`                                      | pnpm formatting can shift whitespace or section ordering. 20 is a sentry for "real drift," not formatting noise.          |
| Catalog: in `peerDependencies` is verified via JSON parse, not grep | Helper Node script                                            | A grep would miss the case where pnpm "supports" catalog peers but the *consumer's* installer can't resolve them. Reading the value and confirming a catalog entry exists for it is the contract. |
| Don't auto-detect drift in the catalog itself                      | Match exactly the versions from the audit table               | If a maintainer wants to upgrade `@floating-ui/react` *during* Phase 4, that's a different PR. Refactor first, upgrade later. |
| Allow either "one workspace changeset" or "9 changesets"           | Phase plan §8 — pick one                                       | Test plan doesn't dictate; we only assert the *result* — patch versions bump for affected packages.                       |
| Don't add vitest "import test" for catalog libs                    | Existing test suites + `pnpm test --filter='./packages/*'`    | Every package already exercises `@floating-ui/react`, `clsx`, etc. in its own tests. Bumping resolution would surface there. |

---

## Example "Test Case" — Reading the asserter output

```bash
$ bash tasks/sprint-1-stop-the-bleeding/verify-phase-4.sh
✓ US-1: no pinned catalog libs in packages/
✓ US-1: catalog has @floating-ui/react
✓ US-1: catalog has class-variance-authority
✓ US-1: catalog has @radix-ui/react-slot
✓ US-1: catalog has @radix-ui/react-dialog
✓ US-1: catalog has @mui/base
✓ US-1: catalog has clsx
✓ US-1: catalog has tailwind-merge
✓ US-2: lockfile resolution drift < 20 non-catalog lines
✓ US-3: pnpm build --filter=./packages/* green
✓ US-4: pnpm test --filter=./packages/* green
✓ US-5: every catalog: peer resolves to a real version
✓ US-6: no workspaces.catalog shadow in root package.json
✓ US-7: pnpm install --frozen-lockfile green
Phase 4 all gates green.
```

If `US-2` is red with a high drift count, one of:

1. pnpm 9 → 10 was crossed mid-flight (corepack mismatch).
2. A catalog version typo silently picked up a different resolved version.
3. A sibling phase merged a dep bump during Phase 4 — re-baseline.

If `US-5` is red on `@mui/base`, the §4.1 caveat applies: pnpm may not
support `catalog:` in `peerDependencies` for your version. Revert the
peer-dep lines only and keep the regular `dependencies` lines on
`catalog:`. Document this in the PR.

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write
the Phase 4 asserter and verify the catalog migration:

---
You are completing Phase 4 of Sprint 1 in the tour-kit monorepo — moving
7 runtime libraries into the pnpm catalog so future version bumps are a
one-line edit instead of a 9-file find-and-replace.

### What This Project Is
tour-kit is a pnpm 10 monorepo. Seven runtime libs (`@floating-ui/react`,
`class-variance-authority`, `@radix-ui/react-slot`, `@radix-ui/react-dialog`,
`@mui/base`, `clsx`, `tailwind-merge`) are pinned identically across 9
packages. Phase 4 moves them into `pnpm-workspace.yaml`'s `catalog:` block
and replaces every pinned version with `"catalog:"`.

### Acceptance Criteria (from User Stories)
| #    | User Story                                                    | Validation Check                                              | Pass Condition                          |
| ---- | ------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| US-1 | One-line bumps after Phase 4                                  | `git grep -E '...: "\^' packages/`                            | `0` matches for the 7 libs              |
| US-2 | Lockfile resolution unchanged                                  | `diff baselines/pnpm-lock.baseline.yaml pnpm-lock.yaml`       | < 20 non-catalog lines differ           |
| US-3 | Every package still builds                                     | `pnpm build --filter='./packages/*'`                          | exit 0                                  |
| US-4 | Every package's tests still pass                               | `pnpm test --filter='./packages/*'`                           | exit 0                                  |
| US-5 | catalog: in peerDependencies resolves                          | Helper Node script                                            | All `catalog:` peers find a catalog entry |
| US-6 | No shadow catalog in root `package.json`                      | `node -e "...!p.workspaces.catalog"`                          | True                                    |
| US-7 | `--frozen-lockfile` install passes                             | `pnpm install --frozen-lockfile`                              | exit 0                                  |

### Why Fakes Are Required
None. Phase 4 exercises real pnpm resolution and real package builds —
mocking pnpm would erase the entire risk surface we're checking.

### What NOT to Test
- Don't bump versions in the catalog beyond what's already pinned.
  Refactor first, upgrade later.
- Don't add `catalog:` entries for the test infra (vitest, tsup, etc.) —
  those are already cataloged.
- Don't write vitest tests that import the catalog libs to "prove
  resolution worked" — the existing per-package suites already do that.
- Don't manually edit `pnpm-lock.yaml`. Let `pnpm install` regenerate it.
- Don't introduce a `package.json` `workspaces.catalog` block at the root.
  pnpm-workspace.yaml is the canonical catalog (US-6).

### Critical: The Asserter

The body of `tasks/sprint-1-stop-the-bleeding/verify-phase-4.sh` and
`_phase-4-peer-resolve.mjs` are shown above. Drop them in, `chmod +x` the
bash script, and run.

### Files to Create / Modify

```
pnpm-workspace.yaml                              # +7 catalog entries
packages/hints/package.json                      # 3 deps + 1 peer → "catalog:"
packages/announcements/package.json              # 4 deps + 1 peer → "catalog:"
packages/checklists/package.json                 # 3 deps + 1 peer → "catalog:"
packages/ai/package.json                         # 1 dep → "catalog:"
packages/core/package.json                       # 2 deps → "catalog:"
packages/surveys/package.json                    # 3 deps + 1 peer → "catalog:"
packages/adoption/package.json                   # 2 deps + 1 peer → "catalog:"
packages/media/package.json                      # 2 deps + 1 peer → "catalog:"
packages/react/package.json                      # 3 deps + 1 peer → "catalog:"
pnpm-lock.yaml                                   # regenerated by pnpm install
tasks/sprint-1-stop-the-bleeding/verify-phase-4.sh           # NEW
tasks/sprint-1-stop-the-bleeding/_phase-4-peer-resolve.mjs   # NEW
```

### Per-File Coverage Guidance

#### Per-package `package.json` edits
- For each row in the audit table (phase plan §2), find the matching line
  in the named package.json and replace `"^x.y.z"` with `"catalog:"`.
- Do NOT touch `version`, `name`, `peerDependenciesMeta`, or any other
  field.
- If pnpm errors on `catalog:` in `peerDependencies` after install (rare
  on pnpm 10), revert that single line and leave the version pinned.
  Document in the PR.

#### `pnpm-workspace.yaml`
- Add the 7 new entries under the existing `catalog:` block, after the
  test-infra entries. Match the exact versions from the audit (§2 table
  in the phase plan).

#### `verify-phase-4.sh` + `_phase-4-peer-resolve.mjs`
- Bodies shown above.

### Success Criteria
- `bash tasks/sprint-1-stop-the-bleeding/verify-phase-4.sh` prints all ✓.
- `git grep -E '"(@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge)": "\^' packages/` returns 0 hits.
- `diff baselines/pnpm-lock.baseline.yaml pnpm-lock.yaml | grep -E '^[<>]' | grep -v catalog | wc -l` < 20.

### Expected End State

```
pnpm-workspace.yaml                              # +7 catalog entries
packages/{hints,announcements,checklists,ai,core,surveys,adoption,media,react}/package.json
                                                 # catalog: replacements
pnpm-lock.yaml                                   # catalog metadata, no resolution drift
tasks/sprint-1-stop-the-bleeding/
├── verify-phase-4.sh                            # NEW
└── _phase-4-peer-resolve.mjs                    # NEW
```
---

---

## Run Commands

```bash
# Edit the files, then:
pnpm install

# Verify
chmod +x tasks/sprint-1-stop-the-bleeding/verify-phase-4.sh
bash tasks/sprint-1-stop-the-bleeding/verify-phase-4.sh

# Inspect the lockfile diff (US-2)
diff tasks/sprint-1-stop-the-bleeding/baselines/pnpm-lock.baseline.yaml \
     pnpm-lock.yaml \
  | grep -E '^[<>] ' | grep -v catalog | head -50

# Quick smoke: install fresh and confirm peer warnings haven't grown
rm -rf node_modules packages/*/node_modules
pnpm install
pnpm install --frozen-lockfile  # second pass to confirm idempotent
```

---

**Next:** [phase-5-tests.md](phase-5-tests.md)
