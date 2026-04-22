---
name: tk-publish-audit
description: Audit every @tour-kit/* package for publish-time correctness. Runs @arethetypeswrong/cli (types resolve in all consumer module systems), publint (package.json / exports / files hygiene), and the apps/smoke harness (fresh-install-from-npm still works). Reports any issue that would break a user's first `pnpm install`. Use before any release, after adding a new package to the workspace, or when diagnosing reports of "the latest version is broken".
when_to_use: Before `pnpm release`, after adding a new `packages/*` entry, when a changeset PR is ready to merge, or when a user reports an install / import error on a fresh npm install.
disable-model-invocation: true
allowed-tools: Bash(pnpm:*), Bash(bash:*), Bash(node:*), Bash(ls:*), Bash(cat:*), Bash(grep:*), Bash(find:*)
---

# tk-publish-audit

Verifies every `@tour-kit/*` package will actually work for a fresh consumer after publish. Three independent layers — each catches a different class of bug.

## Layers

### 1. Types publishing — `@arethetypeswrong/cli`

Validates that the published tarball's TypeScript types resolve correctly for every consumer module system (ESM, CJS, bundler, node10, node16). Catches broken `exports` maps, missing `.d.cts`, wrong `types` field, ESM/CJS dual-package hazards.

Run per package:
```bash
pnpm dlx @arethetypeswrong/cli --pack packages/<name>
```

### 2. Package hygiene — `publint`

Validates `package.json` shape: `files` array is complete, `exports` match real files, `main` / `module` / `types` are consistent, no deprecated fields. Catches "works for me, 404s on npm".

Run per package:
```bash
pnpm dlx publint packages/<name>
```

### 3. End-to-end smoke — `apps/smoke`

Installs every `@tour-kit/*` package from the real npm registry (no workspace protocol), mounts all nine providers, and renders a page that imports each published entry. Proves the *combination* of packages works on a clean machine.

Run once:
```bash
cd apps/smoke && pnpm install:npm && bash scripts/run-smoke.sh
```

## Workflow

1. **Build first.** `attw` and `publint` need built `dist/`:
   ```bash
   pnpm build --filter='./packages/*'
   ```
2. **List packages.** Read `packages/` directory; expect 12 directories (core, react, hints, adoption, ai, analytics, announcements, checklists, media, scheduling, surveys, license). Skip `packages/__tests__`.
3. **Run `attw` for each package** — parallelize when safe. Capture stdout/stderr.
4. **Run `publint` for each package** — same parallelism.
5. **Run the smoke harness** — once, serially.
6. **Aggregate.** Build a table:

   | Package | attw | publint | smoke |
   |---|---|---|---|
   | core | ✓ | ✓ | ✓ |
   | media | ⚠️ optional-peer | ✓ | ✓ |

7. **Categorize findings** by severity:
   - **HOLD** (block release): any attw error, any publint error, smoke exit != 0.
   - **WARN** (fix soon): attw "problems" that are warnings, publint suggestions, missing optional peers that will hit Lottie/AI users.
   - **INFO**: version info, unused fields.

## Reporting

Output a structured report, not a raw log dump. For every failing check:
- Quote the exact tool line so the user can grep it.
- Name the file to edit (e.g. `packages/media/package.json:42`).
- Suggest the concrete fix (e.g. "add `./server` to `exports` map").

If everything passes:
```
All 12 packages clean. attw ✓ · publint ✓ · smoke ✓ — safe to publish.
```

## Caveats

- First run takes ~3 minutes because `pnpm dlx` downloads `attw` and `publint` into the pnpm store.
- The smoke harness needs network access to pull from the npm registry; if offline, skip layer 3 and note it.
- A known Next.js 16.2.4 bug makes `next build` fail on `/_global-error` prerender inside `apps/smoke`. That's why smoke uses `next dev` + curl — unrelated to tour-kit.
