# Phase 4 — pnpm catalog hygiene for 7 runtime libs (R-3)

> **Goal:** Move identically-pinned runtime libraries into the pnpm catalog so
> future version bumps touch one file (root `pnpm-workspace.yaml`) instead of
> up to 9 (`packages/*/package.json`).
>
> **Audit ID:** R-3 (HIGH).
> **Effort:** M (one edit per affected package × 9 packages, plus install).
> **Branch:** `sprint-1/phase-4-catalog-hygiene`.
> **Bump:** patch × every package whose `package.json` changes (≈ 9 patches).
> **Independent** — no phase dependency, but ideally lands before Phase 7 so
> the bundle-size CI references catalog-pinned versions in stack traces.

## 1. Pre-conditions

- Phase 0 baseline saved (we'll diff `pnpm-lock.yaml` against
  `tasks/sprint-1-stop-the-bleeding/baselines/pnpm-lock.baseline.yaml`).
- `pnpm install --frozen-lockfile` clean before starting.
- Local pnpm matches `package.json` (`pnpm@10.26.1` at validation time —
  see Phase 0 §0.0 for corepack setup if your local pnpm is 9.x). GitHub
  workflows currently pin pnpm `9`; Phase 7 aligns those, but if Phase 4
  merges first, call out the CI-version risk in the PR.
- `catalog:` in peerDependencies works in your pnpm. Verify with a
  scratch test before editing 9 package.json files:

  ```bash
  # Probe: temporarily change one peer to catalog: and reinstall.
  # Pick a single low-blast-radius peer (e.g. @mui/base in packages/ai
  # if it has one, or any package that uses @mui/base).
  # If `pnpm install --frozen-lockfile=false` errors with "Cannot resolve
  # catalog: protocol in peerDependencies", abort and leave all peer
  # lines pinned for this sprint. Document in the PR.
  ```

  pnpm 10.x documents `catalog:` support in peerDependencies; the probe
  is a 30-second insurance check, not a known failure.
- Tree clean.

## 2. Audit the current pinning

Confirm the exact pinned versions before touching anything:

```bash
grep -E '"(@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge)":' \
  packages/*/package.json
```

Expected matches (per the audit, verified 2026-05-23):

| Library                          | Version  | Packages |
|----------------------------------|----------|----------|
| `@floating-ui/react`             | `^0.27.19` | `hints`, `announcements`, `checklists`, `react`, `surveys` (5) |
| `class-variance-authority`       | `^0.7.1`   | `hints`, `announcements`, `checklists`, `ai`, `surveys`, `adoption`, `media`, `react` (8) |
| `@radix-ui/react-slot`           | `^1.2.4`   | `hints`, `announcements`, `checklists`, `adoption`, `media`, `react` (6) |
| `@radix-ui/react-dialog`         | `^1.1.15`  | `announcements`, `surveys` (2) |
| `@mui/base` (peerDeps + meta)    | `^5.0.0-beta.0` | `hints`, `announcements`, `checklists`, `adoption`, `media`, `react`, `surveys` (7) |
| `clsx`                           | `^2.1.1`   | `core` (dep only) |
| `tailwind-merge`                 | `^3.5.0`   | `core` (dep only) |

If your grep shows a different version anywhere, **stop and reconcile first**
— this phase assumes uniform pins. Drift mid-flight is a different fix.

## 3. Update `pnpm-workspace.yaml`

The catalog currently contains only test/build infra. Extend it with the
runtime libs. Edit `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "apps/*"
  - "!apps/smoke"
  - "tooling/*"
  - "examples/*"

catalog:
  # Test infra (existing — do not touch)
  vitest: ^4.1.0
  vitest-axe: ^1.0.0-pre.3
  jsdom: ^27.3.0
  typescript: ^5.9.3
  tsup: ^8.5.1
  "@types/react": ^19.2.0
  "@types/react-dom": ^19.2.0
  "@vitest/coverage-v8": ^4.1.0
  "@testing-library/react": ^16.3.1
  "@testing-library/jest-dom": ^6.9.1
  "@testing-library/dom": ^10.4.1
  "@testing-library/user-event": ^14.6.1
  zod: ^4.3.6
  jscodeshift: ^17.3.0
  "@types/jscodeshift": ^0.12.0
  jsdom-testing-mocks: ^1.13.0

  # Runtime libs added in sprint-1 phase-4 (R-3 catalog hygiene)
  "@floating-ui/react": ^0.27.19
  "class-variance-authority": ^0.7.1
  "@radix-ui/react-slot": ^1.2.4
  "@radix-ui/react-dialog": ^1.1.15
  "@mui/base": ^5.0.0-beta.0
  clsx: ^2.1.1
  tailwind-merge: ^3.5.0
```

> **Note:** The root `package.json` also has a `workspaces.catalog` block.
> Looking at the existing setup, `pnpm-workspace.yaml` is the canonical
> catalog (line referenced as 'catalog:' in the workspace yaml). Do NOT
> duplicate into `package.json` — that's a different config (npm-style)
> and would invite drift. Verified at Phase 0.

## 4. Replace pinned versions in each package

For each package in the table above, change the pinned version to
`catalog:`. **Exact diffs** (apply mechanically):

### 4.1 `packages/hints/package.json`

```diff
-    "@floating-ui/react": "^0.27.19",
-    "@radix-ui/react-slot": "^1.2.4",
-    "class-variance-authority": "^0.7.1"
+    "@floating-ui/react": "catalog:",
+    "@radix-ui/react-slot": "catalog:",
+    "class-variance-authority": "catalog:"
```

Also the `peerDependencies` / `peerDependenciesMeta` for `@mui/base`:

```diff
-    "@mui/base": "^5.0.0-beta.0",
+    "@mui/base": "catalog:",
```

> **WATCH OUT:** `peerDependencies` historically accepted a version string,
> not `catalog:`. pnpm 9+ supports `catalog:` in peerDeps — verify with
> `pnpm install --frozen-lockfile` after editing. If it errors, revert
> the peer line only and leave the version pinned. Document this in the
> PR description.

### 4.2 `packages/announcements/package.json`

```diff
-    "@floating-ui/react": "^0.27.19",
-    "@radix-ui/react-slot": "^1.2.4",
-    "@radix-ui/react-dialog": "^1.1.15",
-    "class-variance-authority": "^0.7.1"
+    "@floating-ui/react": "catalog:",
+    "@radix-ui/react-slot": "catalog:",
+    "@radix-ui/react-dialog": "catalog:",
+    "class-variance-authority": "catalog:"
```

Plus the `@mui/base` peer per §4.1 caveat.

### 4.3 `packages/checklists/package.json`

```diff
-    "@floating-ui/react": "^0.27.19",
-    "@radix-ui/react-slot": "^1.2.4",
-    "class-variance-authority": "^0.7.1"
+    "@floating-ui/react": "catalog:",
+    "@radix-ui/react-slot": "catalog:",
+    "class-variance-authority": "catalog:"
```

Plus `@mui/base` peer.

### 4.4 `packages/ai/package.json`

```diff
-    "class-variance-authority": "^0.7.1"
+    "class-variance-authority": "catalog:"
```

(ai does not use floating-ui, slot, dialog, or @mui/base — single line.)

### 4.5 `packages/core/package.json`

```diff
-    "clsx": "^2.1.1",
-    "tailwind-merge": "^3.5.0"
+    "clsx": "catalog:",
+    "tailwind-merge": "catalog:"
```

(core has its own pair — different libs from the rest of the catalog.)

### 4.6 `packages/surveys/package.json`

```diff
-    "@floating-ui/react": "^0.27.19",
-    "@radix-ui/react-dialog": "^1.1.15",
-    "class-variance-authority": "^0.7.1"
+    "@floating-ui/react": "catalog:",
+    "@radix-ui/react-dialog": "catalog:",
+    "class-variance-authority": "catalog:"
```

Plus `@mui/base` peer.

### 4.7 `packages/adoption/package.json`

```diff
-    "@radix-ui/react-slot": "^1.2.4",
-    "class-variance-authority": "^0.7.1"
+    "@radix-ui/react-slot": "catalog:",
+    "class-variance-authority": "catalog:"
```

Plus `@mui/base` peer.

### 4.8 `packages/media/package.json`

```diff
-    "@radix-ui/react-slot": "^1.2.4",
-    "class-variance-authority": "^0.7.1"
+    "@radix-ui/react-slot": "catalog:",
+    "class-variance-authority": "catalog:"
```

Plus `@mui/base` peer.

### 4.9 `packages/react/package.json`

```diff
-    "@floating-ui/react": "^0.27.19",
-    "@radix-ui/react-slot": "^1.2.4",
-    "class-variance-authority": "^0.7.1"
+    "@floating-ui/react": "catalog:",
+    "@radix-ui/react-slot": "catalog:",
+    "class-variance-authority": "catalog:"
```

Plus `@mui/base` peer.

## 5. Install + verify zero lockfile diff

```bash
pnpm install
```

The acceptance gate: the diff between the new `pnpm-lock.yaml` and the
baseline should be **zero non-trivial changes** (whitespace and
section reordering aside).

```bash
diff tasks/sprint-1-stop-the-bleeding/baselines/pnpm-lock.baseline.yaml \
     pnpm-lock.yaml \
     | wc -l
```

If the diff is large, one of these is true:

1. The catalog version differs from the pinned version (e.g. typo in
   `^0.27.19`).
2. pnpm 9 vs pnpm 10 resolution differs (we're on pnpm 10.26.1 — verify
   with `cat package.json | grep packageManager`).
3. A package was already using a different version and we mis-detected
   the drift.

Resolve each case individually before merging.

## 6. The "no more pinned versions" gate

```bash
# Should return ZERO matches in packages/:
git grep -E '"(@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge)": "\^' packages/
echo "Exit: $?"
```

If grep finds anything, you missed a file or a peer-dep line. Either fix
it now or document why this one stays pinned (e.g. peer-dep catalog
support varies).

## 7. Build + test the entire monorepo

```bash
pnpm build --filter='./packages/*'
pnpm test --filter='./packages/*'
pnpm typecheck
```

If a package suddenly errors with "cannot find module
@radix-ui/react-slot", the `catalog:` substitution didn't propagate —
re-run `pnpm install` and check the package's `node_modules/.pnpm`
entries.

## 8. Changeset(s)

Two options here:

### 8.1 One workspace changeset (recommended)

Cleaner. Reduces noise in CHANGELOG.md across 9 packages.

```bash
pnpm changeset
```

Select all 9 affected packages: **`adoption`, `ai`, `announcements`,
`checklists`, `core`, `hints`, `media`, `react`, `surveys`**. Pick
**patch** for all. Description:

```
chore: move 7 runtime dependencies into the pnpm catalog

@floating-ui/react, class-variance-authority, @radix-ui/react-slot,
@radix-ui/react-dialog, @mui/base, clsx, tailwind-merge are now resolved
via `catalog:` in pnpm-workspace.yaml. No version changes; no behavior
changes. Reduces drift risk on future bumps.

Refs: audit R-3.
```

### 8.2 One changeset per package

If your release workflow doesn't handle 9-package changesets cleanly,
split into 9 separate `.changeset/*.md` files with identical text.

Either way, **`core`/`react`/`hints` are linked** (per
`.changeset/config.json:5`), so they version together regardless.

## 9. Commit + PR

```bash
git checkout -b sprint-1/phase-4-catalog-hygiene

git add pnpm-workspace.yaml packages/*/package.json pnpm-lock.yaml .changeset/

git commit -m "$(cat <<'EOF'
chore(workspace): move runtime deps into pnpm catalog

Seven runtime libs were identically pinned across 9 packages. Moving
them into the catalog cuts future version bumps from "edit 9 package.json
files" to "edit one line in pnpm-workspace.yaml" and prevents accidental
drift.

Libs: @floating-ui/react, class-variance-authority, @radix-ui/react-slot,
@radix-ui/react-dialog, @mui/base, clsx, tailwind-merge.

No behavior change. pnpm-lock.yaml has no resolution diffs vs main.

Refs: audit R-3.
EOF
)"

git push -u origin sprint-1/phase-4-catalog-hygiene

gh pr create --title "chore(workspace): catalog 7 runtime deps (R-3)" --body "$(cat <<'EOF'
## Summary
- Add 7 runtime libs to the pnpm catalog: `@floating-ui/react`,
  `class-variance-authority`, `@radix-ui/react-slot`, `@radix-ui/react-dialog`,
  `@mui/base`, `clsx`, `tailwind-merge`.
- Replace pinned versions in 9 `packages/*/package.json` files with `catalog:`.
- No version changes, no behavior changes.

## Acceptance check
- [ ] `git grep -E '"(@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge)": "\^' packages/` returns 0 matches.
- [ ] `pnpm-lock.yaml` diff vs main is empty (excluding catalog metadata block).
- [ ] All packages build + test green.

## Test plan
- [ ] `pnpm install --frozen-lockfile` succeeds.
- [ ] `pnpm build` succeeds for all packages.
- [ ] `pnpm test` succeeds for all packages.
- [ ] CI green.

Refs: audit R-3.
EOF
)"
```

## 10. Acceptance gates (hard)

- [ ] `pnpm-workspace.yaml` has the 7 new catalog entries.
- [ ] `git grep -E '"(@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge)": "\^' packages/` returns **0 matches**.
- [ ] `pnpm install` produces zero resolution diff against
      `baselines/pnpm-lock.baseline.yaml`.
- [ ] `pnpm build --filter='./packages/*'` green.
- [ ] `pnpm test --filter='./packages/*'` green.
- [ ] Changeset present.

## 11. Rollback

The risk surface is pnpm resolving differently for peer dependencies that
got `catalog:` references (see §4.1 caveat).

If a downstream installation breaks ("cannot find @mui/base@..."), the
minimal rollback is to revert **only the peer-dep lines** while keeping
the regular `dependencies` lines catalog-bound:

```bash
# In each packages/*/package.json under peerDependencies:
"@mui/base": "catalog:"  →  "@mui/base": "^5.0.0-beta.0"
```

Commit as a follow-up patch. Document in the PR description why peer
catalogs don't work for our consumers.

Full rollback:

```bash
git revert <merge-commit-sha>
git push origin main
```

---

**Next (independent):** [phase-5-codemods-docs.md](phase-5-codemods-docs.md)
