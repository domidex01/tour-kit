# Phase 5 — Testing: `@tour-kit/codemods` Docs (G-1)

**Scope:** Four new MDX files under `apps/docs/content/docs/codemods/`
(`index.mdx`, `from-shepherd.mdx`, `from-driver.mdx`, `from-joyride.mdx`),
one new `meta.json` in that folder, one edit to the parent
`apps/docs/content/docs/meta.json` (add `codemods` to nav), and three
callout edits to the existing migration MDX pages.
**Phase type:** **Docs only.** Zero package code touched. The "test" is
"the docs build, the nav shows the new entry, every link resolves, and
every command shown is the real published one." No vitest. No fakes.
**Key Pattern:** Static-content asserter — file existence, frontmatter
shape, link integrity, code-block-command validity (e.g. `pnpm exec
tour-kit-migrate --help` actually runs), and a `pnpm --filter
@tour-kit/docs build` gate.
**Dependencies:** `pnpm`, `node`, the Fumadocs build (existing in
`apps/docs`), the `tour-kit-migrate` binary from `packages/codemods/dist/`.

---

## User Stories

| #    | User Story                                                                                                                          | Validation Check                                                                                                                | Pass Condition                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| US-1 | As a consumer evaluating Tour Kit, I want to discover the migration codemods from the docs nav — not by `git grep`-ing the repo.    | `grep -A 20 '"---Resources---"' apps/docs/content/docs/meta.json` includes `"codemods"`                                          | `"codemods"` listed in nav under Resources                                                  |
| US-2 | As a Shepherd/Driver/Joyride user, I want one page per source library that shows the exact `tour-kit-migrate` command for my case.  | `test -f apps/docs/content/docs/codemods/from-{shepherd,driver,joyride}.mdx`                                                    | All 3 files present, each has a `pnpm exec tour-kit-migrate --from <lib>` codeblock         |
| US-3 | As a doc reader, I want every "Run" command in the codemod pages to actually work against the published bin.                        | Each `pnpm exec tour-kit-migrate --help` and `--from <lib> --dry-run` snippet is grep-extractable + runs without error          | Bin exists at `packages/codemods/dist/bin/tour-kit-migrate.cjs`; `--help` exits 0           |
| US-4 | As a migrator scrolling the existing `migration/shepherd.mdx`, I want a "use the codemod" callout near the top.                      | `grep -l '/docs/codemods/from-' apps/docs/content/docs/migration/{shepherd,driver,joyride}.mdx`                                 | All 3 migration pages link to the matching codemod page                                     |
| US-5 | As a docs reviewer, I want `pnpm --filter @tour-kit/docs build` to render every new page without an MDX parse error.                 | `pnpm --filter @tour-kit/docs build`                                                                                            | exit 0                                                                                       |
| US-6 | As a repo owner, I want this PR to be docs-only — no risk of accidental package-code drift.                                          | `git diff --stat -- packages/`                                                                                                  | Empty (zero files under `packages/` changed)                                                 |
| US-7 | As a doc reader, every internal link in the new pages must resolve to a real page (no 404s on `/docs/migration/...`, `/docs/react/...`). | `link-check.yml`-style scan: for each `[...]` link, confirm target file exists                                                | All internal links resolve                                                                   |

---

## Component Mock Strategy

| Component                              | Mock Strategy                                              | What to Assert                                                                            | User Story  |
| -------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| `apps/docs/content/docs/codemods/*.mdx`| None — real files                                          | Files exist; frontmatter has `title` + `description`; H1 present                          | US-2        |
| `apps/docs/content/docs/codemods/meta.json` | None — JSON read                                       | Has `title: "Codemods"`, lists `index` + 3 transform pages + a separator                  | US-2        |
| `apps/docs/content/docs/meta.json`      | None — JSON read                                          | `pages` array includes `"codemods"` exactly once, under `---Resources---`                  | US-1        |
| `tour-kit-migrate` bin                  | None — run real bin                                       | `node packages/codemods/dist/bin/tour-kit-migrate.cjs --help` exits 0                     | US-3        |
| Migration page callouts                 | None — grep                                                | `from-shepherd`, `from-driver`, `from-joyride` paths linked from matching migration pages  | US-4        |
| Internal link integrity                 | None — grep + `test -f` per `/docs/...` path               | Every relative-path target file (or its `index.mdx`) exists                                 | US-7        |
| Docs build                              | None — `pnpm --filter @tour-kit/docs build`                | exit 0                                                                                     | US-5        |
| Package-code untouched                  | None — `git diff --stat -- packages/`                      | Empty                                                                                      | US-6        |

---

## Test Tier Table

| Tier             | Dependencies                                              | Speed     | When to Run                              |
| ---------------- | --------------------------------------------------------- | --------- | ---------------------------------------- |
| Shape gate       | `node`, `grep`, `test`                                    | < 2 s     | Pre-PR, in `verify-phase-5.sh`           |
| Bin smoke        | `packages/codemods/dist/bin/tour-kit-migrate.cjs`         | < 5 s     | Pre-PR (requires codemods build)         |
| Internal-link gate | grep + `test -f` per target                              | < 5 s     | Pre-PR                                    |
| Docs build       | `pnpm --filter @tour-kit/docs build`                      | ~1–2 min  | Pre-PR + on CI                            |
| Manual eyeball   | `pnpm --filter @tour-kit/docs dev`, browser               | ~2 min    | Pre-PR (recommended, not blocking)        |

No vitest. Recipes here are CLI examples, not testable code blocks.

---

## No Fake Implementations (Docs Only)

Phase 5 ships zero new runtime code. There is nothing to mock. The
`tour-kit-migrate` bin already exists in the package (Phase 5 only
documents it); we exercise it via real `node` invocation in US-3.

---

## Test File List

```
apps/docs/content/docs/codemods/
├── index.mdx                                # NEW
├── from-shepherd.mdx                        # NEW
├── from-driver.mdx                          # NEW
├── from-joyride.mdx                         # NEW
└── meta.json                                # NEW

apps/docs/content/docs/meta.json             # MODIFIED — add "codemods" to Resources

apps/docs/content/docs/migration/
├── shepherd.mdx                             # MODIFIED — callout to /docs/codemods/from-shepherd
├── driver.mdx                               # MODIFIED — callout to /docs/codemods/from-driver
└── joyride.mdx                              # MODIFIED — callout to /docs/codemods/from-joyride

tasks/sprint-1-stop-the-bleeding/
└── verify-phase-5.sh                        # NEW: shape + bin + link gates

# Out of scope (verify NOT touched):
packages/codemods/**                         # MUST be empty in git diff
```

---

## Asserter Skeleton

```bash
#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-phase-5.sh
# Run before opening the Phase 5 PR.
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2 — $(eval "$3")"; fails=$((fails+1)); fi; }

DOCS_ROOT="apps/docs/content/docs"

# US-2: 4 new pages exist
for f in index from-shepherd from-driver from-joyride; do
  gate "[ -f $DOCS_ROOT/codemods/$f.mdx ]" "US-2: $f.mdx exists" "echo missing"
done

# US-2 (each has frontmatter)
for f in index from-shepherd from-driver from-joyride; do
  gate "head -5 $DOCS_ROOT/codemods/$f.mdx | grep -q '^title:'" "US-2: $f.mdx has frontmatter title" "head -5 $DOCS_ROOT/codemods/$f.mdx"
done

# US-2 (transform pages have a run codeblock)
for lib in shepherd driver joyride; do
  gate "grep -q 'tour-kit-migrate --from $lib' $DOCS_ROOT/codemods/from-$lib.mdx" \
       "US-2: from-$lib.mdx includes run command" "echo missing"
done

# US-2 (meta.json present)
gate "[ -f $DOCS_ROOT/codemods/meta.json ]" 'US-2: codemods/meta.json exists' "echo missing"
gate 'node -e "const m=require(\"./apps/docs/content/docs/codemods/meta.json\"); process.exit(m.pages?.includes(\"index\") && m.pages?.includes(\"from-shepherd\") ? 0 : 1)"' \
     'US-2: meta.json lists index + transform pages' "cat $DOCS_ROOT/codemods/meta.json"

# US-1: root meta.json includes "codemods" under Resources
gate 'node -e "const m=require(\"./apps/docs/content/docs/meta.json\"); const idx=m.pages.indexOf(\"---Resources---\"); const end=m.pages.findIndex((p,i)=>i>idx && p.startsWith(\"---\")); const slice=m.pages.slice(idx, end>=0?end:undefined); process.exit(slice.includes(\"codemods\") ? 0 : 1)"' \
     'US-1: root meta.json lists codemods under Resources' "cat $DOCS_ROOT/meta.json | grep -A 10 Resources"

# US-3: tour-kit-migrate bin works
if [ ! -f packages/codemods/dist/bin/tour-kit-migrate.cjs ]; then
  echo "Building codemods first…"
  pnpm --filter @tour-kit/codemods build >/dev/null 2>&1
fi
gate '[ -f packages/codemods/dist/bin/tour-kit-migrate.cjs ]' \
     'US-3: tour-kit-migrate bin built' "echo missing — run pnpm --filter @tour-kit/codemods build"
gate 'node packages/codemods/dist/bin/tour-kit-migrate.cjs --help >/dev/null 2>&1' \
     'US-3: tour-kit-migrate --help exits 0' "node packages/codemods/dist/bin/tour-kit-migrate.cjs --help 2>&1 | tail -5"

# US-4: existing migration pages link to the codemod pages
for lib in shepherd driver joyride; do
  gate "grep -q '/docs/codemods/from-$lib' $DOCS_ROOT/migration/$lib.mdx" \
       "US-4: migration/$lib.mdx links to codemod" "echo missing callout"
done

# US-6: no package code touched
n=$(git diff --name-only -- packages/ | wc -l | tr -d ' ')
gate "[ $n -eq 0 ]" "US-6: zero files under packages/ changed" "git diff --name-only -- packages/"

# US-7: internal link integrity (cheap pass — only check /docs/... refs)
# Extracts every (/docs/...) link target from the new pages.
missing_links=0
while read -r link; do
  # Strip anchor + leading slash
  target=$(echo "$link" | sed 's|#.*||' | sed 's|^/||')
  # Map /docs/foo → apps/docs/content/docs/foo (with .mdx or /index.mdx)
  if [ -f "apps/$target.mdx" ] || [ -f "apps/$target/index.mdx" ]; then
    : # OK
  else
    echo "  ✗ broken link: $link"
    missing_links=$((missing_links+1))
  fi
done < <(grep -hoE '\(/docs/[a-z0-9-]+(/[a-z0-9-]+)*\)' $DOCS_ROOT/codemods/*.mdx | tr -d '()' | sort -u)

gate "[ $missing_links -eq 0 ]" "US-7: all internal /docs/ links resolve" "echo $missing_links broken"

# US-5: docs build
gate 'pnpm --filter @tour-kit/docs build >/tmp/phase-5-build.log 2>&1' \
     'US-5: apps/docs builds' "tail -n10 /tmp/phase-5-build.log"

[ "$fails" -eq 0 ] || { echo "Phase 5 FAILED gates: $fails"; exit 1; }
echo "Phase 5 all gates green."
```

---

## Key Testing Decisions

| Decision                                                          | Approach                                                      | Rationale                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Test the bin, not the codemod transforms                          | `node packages/codemods/dist/bin/tour-kit-migrate.cjs --help` | Phase 5 is *docs*. We assert the documented command resolves to a real bin. Transform behavior already has tests in `packages/codemods/src/__tests__/`. |
| Internal-link scan is a grep, not a full link checker              | bash + `grep -hoE`                                            | The existing `link-check.yml` workflow handles full link checking on CI. Pre-PR, a cheap grep catches the 80 % cases.    |
| Don't assert visual rendering (Playwright snapshot)                | Manual eyeball in `apps/docs dev`                             | Snapshotting 4 MDX pages is heavy ceremony for content that is changing daily during a docs sprint. Eyeball is honest.   |
| Frontmatter check is "title field present", not full schema validation | `head -5 ... \| grep '^title:'`                           | Fumadocs already errors on missing required frontmatter at build time. Our shape gate is for "do the files exist" — not "are they perfect." |
| Asserter requires codemods build                                  | `pnpm --filter @tour-kit/codemods build` if missing           | The bin smoke (US-3) won't run without it. We auto-build to avoid a brittle "skip if missing" path.                       |
| Don't test `meta.json` ordering beyond "contains codemods"         | Set-membership only                                            | The exact position within `---Resources---` is taste, not contract. Asserting position would couple the gate to docs IA. |

---

## Example "Test Case" — Reading the asserter output

```bash
$ bash tasks/sprint-1-stop-the-bleeding/verify-phase-5.sh
✓ US-2: index.mdx exists
✓ US-2: from-shepherd.mdx exists
✓ US-2: from-driver.mdx exists
✓ US-2: from-joyride.mdx exists
✓ US-2: index.mdx has frontmatter title
✓ US-2: from-shepherd.mdx has frontmatter title
✓ US-2: from-driver.mdx has frontmatter title
✓ US-2: from-joyride.mdx has frontmatter title
✓ US-2: from-shepherd.mdx includes run command
✓ US-2: from-driver.mdx includes run command
✓ US-2: from-joyride.mdx includes run command
✓ US-2: codemods/meta.json exists
✓ US-2: meta.json lists index + transform pages
✓ US-1: root meta.json lists codemods under Resources
✓ US-3: tour-kit-migrate bin built
✓ US-3: tour-kit-migrate --help exits 0
✓ US-4: migration/shepherd.mdx links to codemod
✓ US-4: migration/driver.mdx links to codemod
✓ US-4: migration/joyride.mdx links to codemod
✓ US-6: zero files under packages/ changed
✓ US-7: all internal /docs/ links resolve
✓ US-5: apps/docs builds
Phase 5 all gates green.
```

If `US-3: tour-kit-migrate --help exits 0` is red, the bin smoke caught a
regression in the published CLI. Stop and fix the codemods package first
— shipping docs for a broken binary is a worse outcome than no docs.

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write
the Phase 5 docs and asserter:

---
You are completing Phase 5 of Sprint 1 in the tour-kit monorepo — adding
docs for `@tour-kit/codemods` so the migration tooling is discoverable on
the docs site.

### What This Project Is
`@tour-kit/codemods` v0.3.0 ships a `tour-kit-migrate` CLI plus jscodeshift
transforms that automate migration from React Joyride, Shepherd.js, and
Driver.js. The package exists, the CLI works, but there are zero docs
pages — making the migration tooling effectively invisible.

### Acceptance Criteria (from User Stories)
| #    | User Story                                                    | Validation Check                                              | Pass Condition                          |
| ---- | ------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| US-1 | Discoverable from nav                                          | `meta.json` includes `"codemods"` under Resources             | Listed exactly once                     |
| US-2 | Per-library pages exist                                        | `from-{shepherd,driver,joyride}.mdx` present + run commands   | All 3 + index, each has run codeblock   |
| US-3 | Run commands actually work                                     | `node packages/codemods/dist/bin/tour-kit-migrate.cjs --help` | exit 0                                  |
| US-4 | Existing migration pages cross-link                            | Grep for `/docs/codemods/from-` in migration MDX              | All 3 migration pages link out          |
| US-5 | Docs build clean                                               | `pnpm --filter @tour-kit/docs build`                          | exit 0                                  |
| US-6 | Docs-only PR                                                   | `git diff --stat -- packages/`                                | Empty                                   |
| US-7 | No broken internal links                                       | Grep + `test -f` per `/docs/...` target                       | All resolve                             |

### Why Fakes Are Required
None. Phase 5 ships no runtime code. The "test" is "do the files exist,
build clean, link out, and reference real commands." The CLI exists and
runs; we exercise it for real.

### What NOT to Test
- Don't write codemod transform tests. The package already has them in
  `packages/codemods/src/__tests__/`. Phase 5 is docs.
- Don't document `replay-bridge-to-use-tour-actions` or `target-to-ref`.
  Per the phase plan, those are internal helpers — Sprint 2 work.
- Don't write a `npx -p @tour-kit/codemods` test. Network-dependent; the
  bin smoke against `dist/bin/...` is enough.
- Don't snapshot the rendered pages with Playwright. Manual eyeball in
  `apps/docs dev` is honest for content that changes during a docs sprint.
- Don't add per-transform vitest fixtures. The codemod's own test suite
  is the authority.

### Critical: The Asserter

The body of `tasks/sprint-1-stop-the-bleeding/verify-phase-5.sh` is shown
above (the Asserter Skeleton section). Drop it in, `chmod +x`, and run.

### Files to Create / Modify

```
apps/docs/content/docs/codemods/index.mdx              # NEW
apps/docs/content/docs/codemods/from-shepherd.mdx      # NEW
apps/docs/content/docs/codemods/from-driver.mdx        # NEW
apps/docs/content/docs/codemods/from-joyride.mdx       # NEW
apps/docs/content/docs/codemods/meta.json              # NEW
apps/docs/content/docs/meta.json                       # MODIFIED — add "codemods" to Resources

apps/docs/content/docs/migration/shepherd.mdx          # MODIFIED — callout
apps/docs/content/docs/migration/driver.mdx            # MODIFIED — callout
apps/docs/content/docs/migration/joyride.mdx          # MODIFIED — callout

tasks/sprint-1-stop-the-bleeding/verify-phase-5.sh     # NEW
```

### Per-File Coverage Guidance

#### `codemods/index.mdx`
- Frontmatter: `title: Codemods`, `description: ...`.
- Sections: "When to use", "Install", "Available transforms", "After
  running", "Limitations". Include the `pnpm exec tour-kit-migrate
  --help` example.
- Phase plan §3.1 has the full template — copy verbatim.

#### `codemods/from-{shepherd,driver,joyride}.mdx`
- Each: frontmatter + H1 + "Run" codeblock + "What it changes" table +
  "What it does NOT handle" list + before/after example + "See also" link
  to the matching `/docs/migration/<lib>` page.
- Phase plan §3.2, §3.3, §3.4 have templates.

#### `codemods/meta.json`
- `{ "title": "Codemods", "pages": ["index", "---", "from-shepherd", "from-driver", "from-joyride"] }`

#### `docs/meta.json`
- Insert `"codemods"` in the existing `---Resources---` block, between
  `"migration"` and `"api"`.

#### Migration page callouts
- Add a `:::tip` callout near the top of each `migration/<lib>.mdx`
  linking to `/docs/codemods/from-<lib>`. Body shown in phase plan §4.

#### `verify-phase-5.sh`
- The body shown above (Asserter Skeleton).

### Success Criteria
- `bash tasks/sprint-1-stop-the-bleeding/verify-phase-5.sh` prints all ✓.
- `pnpm --filter @tour-kit/docs build` exits 0.
- `git diff --stat -- packages/` is empty.
- Manual: navigate to `http://localhost:3000/docs/codemods` in `apps/docs
  dev` and click through all 4 pages — no MDX render errors visible.

### Expected End State

```
apps/docs/content/docs/
├── codemods/
│   ├── index.mdx                            # NEW
│   ├── from-shepherd.mdx                    # NEW
│   ├── from-driver.mdx                      # NEW
│   ├── from-joyride.mdx                     # NEW
│   └── meta.json                            # NEW
├── migration/
│   ├── shepherd.mdx                         # +callout
│   ├── driver.mdx                           # +callout
│   └── joyride.mdx                          # +callout
└── meta.json                                # +"codemods"

tasks/sprint-1-stop-the-bleeding/
└── verify-phase-5.sh                        # NEW
```
---

---

## Run Commands

```bash
# Build codemods (required for US-3 bin smoke)
pnpm --filter @tour-kit/codemods build

# Verify everything
chmod +x tasks/sprint-1-stop-the-bleeding/verify-phase-5.sh
bash tasks/sprint-1-stop-the-bleeding/verify-phase-5.sh

# Manual eyeball
pnpm --filter @tour-kit/docs dev
# Open http://localhost:3000/docs/codemods in a browser.

# Docs build (US-5)
pnpm --filter @tour-kit/docs build
```

---

**Next:** [phase-6-tests.md](phase-6-tests.md)
