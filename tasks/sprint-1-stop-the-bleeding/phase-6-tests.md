# Phase 6 — Testing: `@tour-kit/testing-library` Docs (G-2)

**Scope:** Two new MDX pages under `apps/docs/content/docs/testing-library/`
(`index.mdx`, `recipes.mdx`), one new `meta.json`, one edit to
`apps/docs/content/docs/meta.json` (insert `testing-library` next to
`codemods`).
**Phase type:** **Docs only with code-block validation.** Like Phase 5, no
package code touched. Unique twist: the `recipes.mdx` page contains 8
copy-paste test snippets that are *meant* to be runnable test code. Phase
plan §4.1 requires at least 2 recipes to be lifted into a real test file
and verified before commit — making this the only Sprint-1 docs phase
with a hard "show your work" code-verification step.
**Key Pattern:** Static-content asserter + a manual "scratch test"
verification step that proves at least 2 recipes compile and run against
the actual `@tour-kit/testing-library` exports.
**Dependencies:** `pnpm`, `node`, Fumadocs build,
`packages/testing-library/src/__tests__/` for the scratch verification.

---

## User Stories

| #    | User Story                                                                                                                          | Validation Check                                                                                                                | Pass Condition                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| US-1 | As a consumer wanting to test their tours, I want to discover `@tour-kit/testing-library` from the docs nav.                         | `apps/docs/content/docs/meta.json` includes `"testing-library"` under Resources                                                  | Listed exactly once                                                                          |
| US-2 | As a Vitest/Jest user, I want one page (`index.mdx`) that covers install + setup + a worked quick example I can copy.                | `test -f apps/docs/content/docs/testing-library/index.mdx`                                                                       | File exists; includes `setupTourKitTesting`, `<HookProbe />`, `<TourCard />`, and a `vi.fn` or `expect` call |
| US-3 | As a test author, I want a recipes page with copy-pasteable patterns for the 8 most common scenarios.                                | `test -f apps/docs/content/docs/testing-library/recipes.mdx` + recipe count                                                      | File exists with `## 1. ` through `## 8. ` headers                                          |
| US-4 | As a docs reviewer, I want at least 2 recipes verified against the real package — proof the docs don't ship broken sample code.      | A scratch test file under `packages/testing-library/src/__tests__/` was created, ran green, and was deleted before commit       | `git log -p` for the PR shows no `__tests__/scratch*.test.ts` remaining; PR description names the 2 recipes |
| US-5 | As a docs reader, I want every helper referenced in `index.mdx` to actually exist in the package's public exports.                   | For each helper named in `index.mdx`'s "Available helpers" table, grep `packages/testing-library/src/index.ts`                  | All 10 helpers present in source                                                            |
| US-6 | As a docs reviewer, I want the docs site to build clean with the new pages.                                                          | `pnpm --filter @tour-kit/docs build`                                                                                            | exit 0                                                                                       |
| US-7 | As a repo owner, I want zero package code changed.                                                                                   | `git diff --stat -- packages/`                                                                                                  | Empty                                                                                       |
| US-8 | As a doc reader, internal links in the new pages (e.g. `/docs/react/tour-provider`) must resolve.                                    | Grep + `test -f` per `/docs/...` target                                                                                          | All resolve                                                                                  |

---

## Component Mock Strategy

| Component                              | Mock Strategy                                              | What to Assert                                                                            | User Story  |
| -------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| `testing-library/index.mdx`            | None — real file                                           | Frontmatter, H1, mentions of `setupTourKitTesting`, `<HookProbe />`, `<TourCard />`        | US-2        |
| `testing-library/recipes.mdx`          | None — real file                                           | `## 1.`–`## 8.` section headers                                                            | US-3        |
| `testing-library/meta.json`            | None — JSON read                                           | `pages: ["index", "recipes"]`                                                              | US-1        |
| Root `docs/meta.json`                  | None — JSON read                                           | `"testing-library"` under Resources                                                        | US-1        |
| Helper-export cross-check               | None — grep `packages/testing-library/src/index.ts`        | All 10 documented helpers are real exports                                                  | US-5        |
| Recipe scratch-test (manual)            | None — real package, real vitest                           | At least 2 recipes run green when lifted into `packages/testing-library/src/__tests__/`    | US-4        |
| Docs build                              | None — `pnpm --filter @tour-kit/docs build`                | exit 0                                                                                     | US-6        |
| Internal links                          | None — grep + `test -f`                                    | All resolve                                                                                | US-8        |

---

## Test Tier Table

| Tier             | Dependencies                                              | Speed     | When to Run                              |
| ---------------- | --------------------------------------------------------- | --------- | ---------------------------------------- |
| Shape gate       | `node`, `grep`, `test`                                    | < 2 s     | Pre-PR, in `verify-phase-6.sh`           |
| Export cross-check | `grep` over `packages/testing-library/src/index.ts`      | < 1 s     | Pre-PR                                    |
| Recipe scratch run| `pnpm --filter @tour-kit/testing-library test --run`     | ~10 s     | Pre-PR (US-4, manual one-shot)            |
| Internal-link gate| grep + `test -f` per target                              | < 5 s     | Pre-PR                                    |
| Docs build       | `pnpm --filter @tour-kit/docs build`                      | ~1–2 min  | Pre-PR + on CI                            |

---

## No Fake Implementations (Docs Only)

Phase 6 ships no runtime code. The recipes themselves *are* test code,
but they're documentation; they're not run by CI. The US-4 scratch
verification uses the real package's real exports.

---

## Test File List

```
apps/docs/content/docs/testing-library/
├── index.mdx                                # NEW
├── recipes.mdx                              # NEW
└── meta.json                                # NEW

apps/docs/content/docs/meta.json             # MODIFIED — add "testing-library" to Resources

tasks/sprint-1-stop-the-bleeding/
└── verify-phase-6.sh                        # NEW

# Scratch tests (transient — created during US-4, deleted before commit):
packages/testing-library/src/__tests__/scratch-recipe-1.test.ts   # TEMP
packages/testing-library/src/__tests__/scratch-recipe-2.test.ts   # TEMP

# Out of scope (verify NOT touched):
packages/testing-library/**                  # MUST be empty in git diff
```

---

## Asserter Skeleton

```bash
#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-phase-6.sh
# Run before opening the Phase 6 PR.
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2 — $(eval "$3")"; fails=$((fails+1)); fi; }

DOCS="apps/docs/content/docs"

# US-2: index.mdx exists with key concepts
gate "[ -f $DOCS/testing-library/index.mdx ]" 'US-2: testing-library/index.mdx exists' "echo missing"
gate "grep -q 'setupTourKitTesting' $DOCS/testing-library/index.mdx" 'US-2: index mentions setupTourKitTesting' "echo missing"
gate "grep -q 'HookProbe' $DOCS/testing-library/index.mdx" 'US-2: index mentions HookProbe' "echo missing"
gate "grep -q 'TourCard' $DOCS/testing-library/index.mdx" 'US-2: index uses TourCard in example' "echo missing"

# US-3: recipes.mdx with 8 numbered sections
gate "[ -f $DOCS/testing-library/recipes.mdx ]" 'US-3: recipes.mdx exists' "echo missing"
for n in 1 2 3 4 5 6 7 8; do
  gate "grep -qE '^## $n\\. ' $DOCS/testing-library/recipes.mdx" "US-3: recipes.mdx has section $n" "echo missing"
done

# US-1: meta.json wiring
gate "[ -f $DOCS/testing-library/meta.json ]" 'US-1: testing-library/meta.json exists' "echo missing"
gate 'node -e "const m=require(\"./apps/docs/content/docs/testing-library/meta.json\"); process.exit(m.pages?.includes(\"index\") && m.pages?.includes(\"recipes\") ? 0 : 1)"' \
     'US-1: meta.json lists index + recipes' "cat $DOCS/testing-library/meta.json"
gate 'node -e "const m=require(\"./apps/docs/content/docs/meta.json\"); const idx=m.pages.indexOf(\"---Resources---\"); const end=m.pages.findIndex((p,i)=>i>idx && p.startsWith(\"---\")); const slice=m.pages.slice(idx, end>=0?end:undefined); process.exit(slice.includes(\"testing-library\") ? 0 : 1)"' \
     'US-1: root meta.json lists testing-library under Resources' "cat $DOCS/meta.json | grep -A 12 Resources"

# US-5: every documented helper exists in source
for helper in setupTourKitTesting virtualTarget expectStepVisible advanceTour previousTour skipTour completeTour goToStep HookProbe getActiveTourHandle TourKitTestingError; do
  gate "grep -qE '(export.*\\b$helper\\b|from.*$helper)' packages/testing-library/src/index.ts" \
       "US-5: $helper exported by package" "grep -n $helper packages/testing-library/src/index.ts"
done

# US-7: no package code touched
n=$(git diff --name-only -- packages/ | wc -l | tr -d ' ')
gate "[ $n -eq 0 ]" "US-7: zero files under packages/ changed" "git diff --name-only -- packages/"

# US-8: internal link integrity (only /docs/... refs)
missing_links=0
while read -r link; do
  target=$(echo "$link" | sed 's|#.*||' | sed 's|^/||')
  if [ -f "apps/$target.mdx" ] || [ -f "apps/$target/index.mdx" ]; then
    :
  else
    echo "  ✗ broken link: $link"
    missing_links=$((missing_links+1))
  fi
done < <(grep -hoE '\(/docs/[a-z0-9-]+(/[a-z0-9-]+)*\)' $DOCS/testing-library/*.mdx 2>/dev/null | tr -d '()' | sort -u)

gate "[ $missing_links -eq 0 ]" "US-8: all internal /docs/ links resolve" "echo $missing_links broken"

# US-6: docs build
gate 'pnpm --filter @tour-kit/docs build >/tmp/phase-6-build.log 2>&1' \
     'US-6: apps/docs builds' "tail -n10 /tmp/phase-6-build.log"

[ "$fails" -eq 0 ] || { echo "Phase 6 FAILED gates: $fails"; exit 1; }
echo "Phase 6 all gates green."
```

**US-4 is NOT in the bash asserter** — it's a one-shot human-driven gate.
See the §Manual Verification section below.

---

## Manual Verification: US-4 (Recipe Scratch Test)

Per the phase plan §4.1: **at least 2 recipes** must be lifted into a real
test file under `packages/testing-library/src/__tests__/`, run green, and
deleted before commit. The cost is ~5 minutes; the payoff is not shipping
broken sample code.

Recommended recipes (smallest first):

```ts
// packages/testing-library/src/__tests__/scratch-recipe-1.test.ts
// Lifted from recipes.mdx §1 "Asserting that a tour starts on mount"
// DELETE BEFORE COMMIT.
import { describe, it } from 'vitest'
import { render, expectStepVisible, HookProbe } from '@tour-kit/testing-library'
import { TourProvider, TourCard, useTour } from '@tour-kit/react'
import * as React from 'react'

function AutoStart({ tourId }: { tourId: string }) {
  const { start } = useTour()
  React.useEffect(() => { void start(tourId) }, [start, tourId])
  return null
}

describe('recipe 1: tour autostart', () => {
  it('autostarts the welcome tour', async () => {
    render(
      <>
        <div id="hi" />
        <TourProvider tours={[{ id: 'welcome', steps: [{ id: 'hi', target: '#hi', content: 'Hi' }] }]}>
          <AutoStart tourId="welcome" />
          <TourCard />
          <HookProbe />
        </TourProvider>
      </>,
    )

    await expectStepVisible('hi')
  })
})
```

```ts
// packages/testing-library/src/__tests__/scratch-recipe-2.test.ts
// Lifted from recipes.mdx §6 "Asserting against the active tour handle"
// DELETE BEFORE COMMIT.
import { describe, it, expect } from 'vitest'
import { render, getActiveTourHandle, HookProbe } from '@tour-kit/testing-library'
import { TourProvider, useTour } from '@tour-kit/react'
import * as React from 'react'

function AutoStart({ tourId }: { tourId: string }) {
  const { start } = useTour()
  React.useEffect(() => { void start(tourId) }, [start, tourId])
  return null
}

describe('recipe 6: handle introspection', () => {
  it('exposes step metadata via the handle', async () => {
    const tours = [{ id: 'demo', steps: [{ id: 's1', target: '#a', content: 'A' }, { id: 's2', target: '#b', content: 'B' }] }]
    render(
      <TourProvider tours={tours}>
        <AutoStart tourId="demo" />
        <HookProbe />
      </TourProvider>,
    )

    const handle = getActiveTourHandle()
    expect(handle?.currentStep?.id).toBe('s1')
    expect(handle?.totalSteps).toBe(2)
  })
})
```

Run:

```bash
pnpm --filter @tour-kit/testing-library test --run
# Both scratch tests should pass. If either fails, the recipe has a bug —
# fix the recipe in recipes.mdx before committing.
```

After both pass, delete the scratch files:

```bash
rm packages/testing-library/src/__tests__/scratch-recipe-{1,2}.test.ts
```

Mention in the PR description which 2 recipes were verified.

---

## Key Testing Decisions

| Decision                                                          | Approach                                                      | Rationale                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Verify at least 2 recipes via scratch tests, not all 8             | Manual one-shot                                               | All 8 verified would be 30 minutes of test scaffolding for an unchanging package. 2 catches the "I made up an API" failure mode at low cost. |
| Don't keep the scratch tests in git                                | Delete after verification                                     | The recipes live in `.mdx`. Duplicating them as real tests adds maintenance burden and a second source of truth.          |
| Cross-check helper names against `src/index.ts`, not behavior      | Grep                                                          | If the docs list a helper that doesn't exist, every reader's import breaks. Grep is enough; behavior tests already live in the package's suite. |
| Recipe section count is 8                                         | `## 1.` through `## 8.`                                       | Phase plan §3.2 specifies 8 recipes. Asserting the count catches "someone deleted a recipe by accident."                  |
| Don't enforce a specific recipe ORDER                              | Set-membership, not sequence                                  | Order is editorial taste, not contract.                                                                                  |
| Internal-link scan is cheap grep, not full link checker           | bash + grep                                                   | Existing `link-check.yml` workflow is the authoritative pass. Pre-PR sanity is enough.                                    |
| Don't snapshot the rendered pages                                  | Manual eyeball                                                | Same reasoning as Phase 5 — content is iterating; Playwright snapshots are heavier than they're worth.                    |

---

## Example "Test Case" — Reading the asserter output

```bash
$ bash tasks/sprint-1-stop-the-bleeding/verify-phase-6.sh
✓ US-2: testing-library/index.mdx exists
✓ US-2: index mentions setupTourKitTesting
✓ US-2: index mentions HookProbe
✓ US-2: index uses TourCard in example
✓ US-3: recipes.mdx exists
✓ US-3: recipes.mdx has section 1
✓ US-3: recipes.mdx has section 2
✓ US-3: recipes.mdx has section 3
✓ US-3: recipes.mdx has section 4
✓ US-3: recipes.mdx has section 5
✓ US-3: recipes.mdx has section 6
✓ US-3: recipes.mdx has section 7
✓ US-3: recipes.mdx has section 8
✓ US-1: testing-library/meta.json exists
✓ US-1: meta.json lists index + recipes
✓ US-1: root meta.json lists testing-library under Resources
✓ US-5: setupTourKitTesting exported by package
✓ US-5: virtualTarget exported by package
… (10 helpers total)
✓ US-7: zero files under packages/ changed
✓ US-8: all internal /docs/ links resolve
✓ US-6: apps/docs builds
Phase 6 all gates green.
```

Plus, in your PR description:

> US-4 verified by lifting recipes §1 (autostart) and §6 (handle introspection)
> into scratch tests at `packages/testing-library/src/__tests__/scratch-recipe-{1,2}.test.ts`.
> Both passed; scratch files deleted in commit <sha>.

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write
the Phase 6 docs:

---
You are completing Phase 6 of Sprint 1 in the tour-kit monorepo — adding
docs for `@tour-kit/testing-library` so the test helpers are discoverable.

### What This Project Is
`@tour-kit/testing-library` ships 10 test helpers, a `<HookProbe />`
bridge component, and re-exports from `@testing-library/react`. The
package has 12 source files and 6 test files but zero docs pages — making
it effectively invisible to consumers.

### Acceptance Criteria (from User Stories)
| #    | User Story                                                    | Validation Check                                              | Pass Condition                          |
| ---- | ------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| US-1 | Discoverable from nav                                          | `meta.json` includes `"testing-library"` under Resources      | Listed exactly once                     |
| US-2 | Quick-example page with setup                                  | `index.mdx` exists; mentions setup helpers                   | Present                                  |
| US-3 | 8 numbered recipes                                             | `## 1.` through `## 8.` in `recipes.mdx`                      | All 8                                   |
| US-4 | At least 2 recipes verified via scratch tests                  | Manual: lift recipe into `__tests__/scratch-*.test.ts`, run, delete | 2 recipes ran green                |
| US-5 | All documented helpers are real exports                        | Grep `src/index.ts`                                           | 10/10 helpers found                     |
| US-6 | Docs build clean                                               | `pnpm --filter @tour-kit/docs build`                          | exit 0                                  |
| US-7 | Docs-only PR                                                   | `git diff --stat -- packages/`                                | Empty                                   |
| US-8 | No broken internal links                                       | Grep + `test -f` per `/docs/...` target                       | All resolve                             |

### Why Fakes Are Required
None. Phase 6 ships no runtime code. The recipe scratch verification
(US-4) uses the real package's real exports — that's the whole point.

### What NOT to Test
- Don't write per-helper API reference docs. Deferred to Sprint 2.
  `index.mdx` covers the helper list informally, which is enough.
- Don't keep the scratch tests in git. They're a one-shot verification,
  not a permanent suite.
- Don't snapshot the docs pages with Playwright. Manual eyeball in
  `apps/docs dev`.
- Don't document `TourProvider`'s `defaultActiveTour` prop — it doesn't
  exist (per phase plan §1 validated API caveats).
- Don't document `virtualTarget()` as a fake selector helper. It returns
  a Floating UI virtual reference; the phase plan §1 calls this out.

### Critical: The Asserter

The body of `tasks/sprint-1-stop-the-bleeding/verify-phase-6.sh` is shown
above (Asserter Skeleton section). Drop it in, `chmod +x`, and run.

### Files to Create / Modify

```
apps/docs/content/docs/testing-library/index.mdx       # NEW
apps/docs/content/docs/testing-library/recipes.mdx     # NEW
apps/docs/content/docs/testing-library/meta.json       # NEW
apps/docs/content/docs/meta.json                       # MODIFIED — +"testing-library"

tasks/sprint-1-stop-the-bleeding/verify-phase-6.sh     # NEW

# Transient (US-4):
packages/testing-library/src/__tests__/scratch-recipe-1.test.ts   # CREATE then DELETE
packages/testing-library/src/__tests__/scratch-recipe-2.test.ts   # CREATE then DELETE
```

### Per-File Coverage Guidance

#### `testing-library/index.mdx`
- Frontmatter: `title: Testing Library`, `description: ...`.
- Sections: "Install", "Setup", "Quick example", "Available helpers",
  "Why these helpers?". Phase plan §3.1 has the full template.
- The quick example MUST use `<TourCard />` (not `defaultActiveTour`)
  and `<HookProbe />`. See validated API caveats in phase plan §1.

#### `testing-library/recipes.mdx`
- 8 numbered recipes (`## 1.` through `## 8.`).
- Phase plan §3.2 has the templates.

#### `testing-library/meta.json`
- `{ "title": "Testing Library", "pages": ["index", "recipes"] }`

#### `docs/meta.json`
- Insert `"testing-library"` immediately after `"codemods"` under
  `---Resources---`. (Phase 5 added `"codemods"` in the same block.)

#### `verify-phase-6.sh`
- The body shown above (Asserter Skeleton).

### US-4 Scratch Tests (Manual)
- Pick 2 recipes (recommended: §1 and §6 — smallest + most distinct).
- Lift them verbatim into `packages/testing-library/src/__tests__/scratch-recipe-{1,2}.test.ts`.
- Run `pnpm --filter @tour-kit/testing-library test --run`.
- Both must pass. If they don't, fix the recipe in `recipes.mdx` first.
- Delete both scratch files before commit. Mention which 2 you verified
  in the PR description.

### Success Criteria
- `bash tasks/sprint-1-stop-the-bleeding/verify-phase-6.sh` prints all ✓.
- `pnpm --filter @tour-kit/docs build` exits 0.
- `git diff --stat -- packages/` is empty (after deleting scratch files).
- PR description names the 2 verified recipes.

### Expected End State

```
apps/docs/content/docs/testing-library/
├── index.mdx                                # NEW
├── recipes.mdx                              # NEW
└── meta.json                                # NEW

apps/docs/content/docs/
└── meta.json                                # +"testing-library"

tasks/sprint-1-stop-the-bleeding/
└── verify-phase-6.sh                        # NEW
```
---

---

## Run Commands

```bash
# Pre-verify (US-4): scratch run a recipe
# Create scratch-recipe-1.test.ts and scratch-recipe-2.test.ts (see §Manual Verification)
pnpm --filter @tour-kit/testing-library test --run
# Both must pass. Then DELETE the scratch files.
rm packages/testing-library/src/__tests__/scratch-recipe-{1,2}.test.ts

# Run the asserter
chmod +x tasks/sprint-1-stop-the-bleeding/verify-phase-6.sh
bash tasks/sprint-1-stop-the-bleeding/verify-phase-6.sh

# Manual eyeball
pnpm --filter @tour-kit/docs dev
# Open http://localhost:3000/docs/testing-library and click through.

# Docs build (US-6)
pnpm --filter @tour-kit/docs build
```

---

**Next:** [phase-7-tests.md](phase-7-tests.md)
