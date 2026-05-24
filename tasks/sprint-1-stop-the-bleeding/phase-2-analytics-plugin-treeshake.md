# Phase 2 — Remove plugin re-exports from `analytics/src/index.ts` (B-3)

> **Goal:** Force consumers to use subpath imports for plugins. Without this,
> even after Phase 1 a consumer who does `import { createAnalytics } from
> '@tour-kit/analytics'` pulls all 5 plugin entry points into their bundle —
> which means even with the SDK externalized, the plugin orchestration code
> still rides along.
>
> **Audit ID:** B-3 (HIGH).
> **Effort:** S (delete 5 lines + docs update).
> **Branch:** `sprint-1/phase-2-analytics-plugin-treeshake`.
> **Bump:** **breaking** — `@tour-kit/analytics` 0.11.x → 0.12.0 (per Phase 0
> decision C; see [phase-0-preflight.md §0.6](phase-0-preflight.md)).
> **Depends on:** Phase 1 merged.

## 1. Pre-conditions

- Phase 1 is merged into `main`.
- Phase 0 decision recorded for version bump.
- A "breaking change announcement" Slack/issue draft is ready (see §7).

## 2. The change

### 2.1 Edit `packages/analytics/src/index.ts`

**Before** (lines 1-19):

```ts
// Core
export { TourAnalytics, createAnalytics } from './core/tracker'
export {
  AnalyticsProvider,
  useAnalytics,
  useAnalyticsOptional,
} from './core/context'

// Plugins
export { consolePlugin } from './plugins/console'
export { posthogPlugin } from './plugins/posthog'
export { mixpanelPlugin } from './plugins/mixpanel'
export { amplitudePlugin } from './plugins/amplitude'
export { googleAnalyticsPlugin } from './plugins/google-analytics'

// Types
export type { TourEvent, TourEventName, TourEventData } from './types/events'
export type { AnalyticsPlugin, AnalyticsConfig } from './types/plugin'
```

**After:**

```ts
// Core
export { TourAnalytics, createAnalytics } from './core/tracker'
export {
  AnalyticsProvider,
  useAnalytics,
  useAnalyticsOptional,
} from './core/context'

// Types
export type { TourEvent, TourEventName, TourEventData } from './types/events'
export type { AnalyticsPlugin, AnalyticsConfig } from './types/plugin'

// Plugins are NOT re-exported from the root entry — import them from
// subpaths to keep your bundle small:
//
//   import { posthogPlugin } from '@tour-kit/analytics/posthog'
//   import { mixpanelPlugin } from '@tour-kit/analytics/mixpanel'
//   import { amplitudePlugin } from '@tour-kit/analytics/amplitude'
//   import { googleAnalyticsPlugin } from '@tour-kit/analytics/google-analytics'
//   import { consolePlugin } from '@tour-kit/analytics/console'
```

(One-line block comment is justified here because it's the documented
breaking-change contract — the comment IS the migration note for anyone
who scrolls into the source file.)

### 2.2 Add the `console` subpath entry

The audit observed that `./posthog`, `./mixpanel`, `./amplitude`, and
`./google-analytics` already exist in `packages/analytics/package.json`
exports — **but `./console` does not**. Add it now so the deletion above
doesn't strand `consolePlugin` behind no public path.

**Edit `packages/analytics/package.json`** — add to the `exports` object,
before `"./package.json"`:

```json
"./console": {
  "import": {
    "types": "./dist/plugins/console.d.ts",
    "default": "./dist/plugins/console.js"
  },
  "require": {
    "types": "./dist/plugins/console.d.cts",
    "default": "./dist/plugins/console.cjs"
  }
},
```

**Edit `packages/analytics/tsup.config.ts`** — add the entry:

```ts
entry: {
  index: 'src/index.ts',
  'plugins/console': 'src/plugins/console.ts',          // ← NEW
  'plugins/posthog': 'src/plugins/posthog.ts',
  'plugins/mixpanel': 'src/plugins/mixpanel.ts',
  'plugins/amplitude': 'src/plugins/amplitude.ts',
  'plugins/google-analytics': 'src/plugins/google-analytics.ts',
},
```

### 2.3 Update internal consumers and examples

Run inside the monorepo:

```bash
rg -n "from ['\"]@tour-kit/analytics['\"]" packages apps examples \
  --glob '*.{ts,tsx,md,mdx}' \
  | rg "posthogPlugin|mixpanelPlugin|amplitudePlugin|googleAnalyticsPlugin|consolePlugin"
```

If any internal file pulls a plugin from the root entry, **fix it now** to
use the subpath. Each example/docs/storybook file that does so must move to:

```ts
import { posthogPlugin } from '@tour-kit/analytics/posthog'
// instead of:
// import { posthogPlugin } from '@tour-kit/analytics'
```

Known affected areas in the validated workspace:

- `apps/smoke/app/providers.tsx`
- `examples/vite-app/src/App.tsx`
- `examples/next-app/src/app/providers.tsx`
- `examples/dashboard-next/app/providers.tsx`
- `packages/analytics/README.md`
- `apps/docs/content/docs/analytics/**`
- selected blog/API examples that import plugin functions from the root

Root imports that use only `AnalyticsProvider`, `createAnalytics`,
`useAnalytics`, `useAnalyticsOptional`, or types are still valid.

### 2.4 Docs updates

Required because the consumer-facing API just changed. Edit at minimum:

- `apps/docs/content/docs/analytics/index.mdx` — top of page, add a
  "Tree-shaking plugins" callout.
- `apps/docs/content/docs/analytics/plugins/posthog.mdx`,
  `mixpanel.mdx`, `amplitude.mdx`, `google-analytics.mdx` — every "Import"
  block must show the subpath form.
- `apps/docs/content/docs/analytics/plugins/console.mdx` and
  `apps/docs/content/docs/analytics/plugins/index.mdx` — same subpath rule.
- `packages/analytics/README.md` — quick start must show root imports for
  core APIs and subpath imports for plugins.
- `apps/docs/content/docs/migration/` — add a new
  `analytics-0-12-breaking-changes.mdx` (or extend an existing release-notes
  page).

The callout template:

```mdx
:::warning Tree-shaking plugins (v0.12+)
Plugins are not re-exported from the root entry. Import them from their
subpath to keep your bundle small:

```ts
import { createAnalytics } from '@tour-kit/analytics'
import { posthogPlugin } from '@tour-kit/analytics/posthog' // ✅
// import { posthogPlugin } from '@tour-kit/analytics'      // ❌ removed in 0.12
```
:::
```

### 2.5 Add a `MIGRATION.md` next to the package

`packages/analytics/MIGRATION.md`:

```md
# Migrating to @tour-kit/analytics 0.12

## What changed

Plugins are no longer re-exported from the root entry. They live at
subpaths:

| Was (≤ 0.11)                                                  | Now (≥ 0.12)                                            |
|---------------------------------------------------------------|---------------------------------------------------------|
| `import { posthogPlugin } from '@tour-kit/analytics'`         | `import { posthogPlugin } from '@tour-kit/analytics/posthog'`         |
| `import { mixpanelPlugin } from '@tour-kit/analytics'`        | `import { mixpanelPlugin } from '@tour-kit/analytics/mixpanel'`       |
| `import { amplitudePlugin } from '@tour-kit/analytics'`       | `import { amplitudePlugin } from '@tour-kit/analytics/amplitude'`     |
| `import { googleAnalyticsPlugin } from '@tour-kit/analytics'` | `import { googleAnalyticsPlugin } from '@tour-kit/analytics/google-analytics'` |
| `import { consolePlugin } from '@tour-kit/analytics'`         | `import { consolePlugin } from '@tour-kit/analytics/console'`         |

`createAnalytics`, `AnalyticsProvider`, `useAnalytics`, `useAnalyticsOptional`,
and all types continue to live at the root entry. They have NOT moved.

## Why

Re-exporting plugins from the root meant a consumer who only uses PostHog
was still pulling 4 unused plugin entry points into their bundle. The
subpath form lets bundlers eliminate the unused ones.

## How to migrate

A single find-and-replace in your codebase, repeated five times — one per
plugin. No call-site changes (plugin objects are identical).

There is no Sprint-1 codemod for this root-to-subpath migration. If you want
one later, the eventual invocation should look like:

```bash
npx jscodeshift -t node_modules/@tour-kit/codemods/dist/transforms/analytics-plugin-imports.js src/
```

(That transform does not exist today; do not document it as available in
consumer-facing docs until it ships.)
```

> **Note:** A formal codemod for this migration is **out of scope for Sprint 1**.
> Reference it in the MIGRATION.md as a future option; do NOT write it now.
> Adding the codemod expands phase 2 scope past the sprint budget.

## 3. Validation

### 3.1 Build + size gate

```bash
pnpm --filter @tour-kit/analytics build

# Root entry must NOT import plugin code anymore (no SDK names, no plugin names):
grep -E '(posthog|mixpanel|amplitude|google_analytics|googleAnalytics).*Plugin' \
  packages/analytics/dist/index.js | head -5
# Expect 0 matches. (Type re-exports are .d.ts; runtime .js should be clean.)

# Root entry size — should drop further:
gzip -c packages/analytics/dist/index.js | wc -c
# Phase 1 dropped this to ~6 KB. Phase 2 should bring it to ~3 KB.
```

There is no analytics `clean` script; `tsup` has `clean: true`.

### 3.2 Per-plugin subpath builds

```bash
for p in console posthog mixpanel amplitude google-analytics; do
  f="packages/analytics/dist/plugins/$p.js"
  if [ -f "$f" ]; then
    printf "%-20s gz=%s raw=%s\n" "$p" "$(gzip -c "$f" | wc -c)" "$(wc -c < "$f")"
  else
    echo "MISSING: $f"
  fi
done
```

Each plugin file should exist and be small (< 2 KB gz each after Phase 1).

### 3.3 Consumer simulation

Create a temp file to prove tree-shaking now works:

```bash
cat > /tmp/treeshake-probe.ts <<'EOF'
import { createAnalytics } from '@tour-kit/analytics'
import { posthogPlugin } from '@tour-kit/analytics/posthog'
const a = createAnalytics({ plugins: [posthogPlugin({ apiKey: 'x' })] })
export { a }
EOF
```

Then run the existing `apps/smoke` flow (or build the probe with esbuild
in a scratch dir) and confirm the resulting bundle does NOT contain
Mixpanel/Amplitude/GA strings.

> Don't gate the PR on this — it's an explanatory check, not a hard test.
> The hard gate is the grep in §3.1.

### 3.4 Tests

```bash
pnpm --filter @tour-kit/analytics test
```

Existing tests import from the root entry. If any of them imports a plugin
from there, fix those test files to use the subpath. Test changes count as
part of the PR.

### 3.5 Full monorepo build

```bash
pnpm build --filter='./packages/*'
pnpm typecheck
```

If any docs/example consumed plugin re-exports, this catches it.

## 4. Changeset

```bash
pnpm changeset
```

Select **`@tour-kit/analytics`** only. Pick **minor** (per Phase 0 Option
C — breaking changes are allowed under 1.0 at minor bumps, document
loudly). Description:

```
BREAKING: plugins removed from root entry. Import from subpaths.

Before:
  import { posthogPlugin } from '@tour-kit/analytics'
After:
  import { posthogPlugin } from '@tour-kit/analytics/posthog'

Same for mixpanel, amplitude, google-analytics, console (the latter is
also a newly-added subpath; previously it was only reachable via the root
re-export). createAnalytics, AnalyticsProvider, useAnalytics, types — all
unchanged.

Migration guide: packages/analytics/MIGRATION.md.

Refs: audit B-3.
```

## 5. Commit + PR

```bash
git checkout -b sprint-1/phase-2-analytics-plugin-treeshake

# All the file edits per §2.

git add packages/analytics/ apps/docs/content/docs/analytics/ \
        apps/docs/content/docs/migration/ .changeset/

git commit -m "$(cat <<'EOF'
refactor(analytics)!: remove plugin re-exports from root entry

Plugins (posthog, mixpanel, amplitude, google-analytics, console) are no
longer re-exported from '@tour-kit/analytics'. Import them from their
subpath (e.g. '@tour-kit/analytics/posthog') so bundlers can tree-shake
unused providers.

Also adds the './console' subpath export which was previously only
reachable via the root re-export.

BREAKING CHANGE: any consumer importing *Plugin functions from the root
entry must switch to subpath imports. See packages/analytics/MIGRATION.md.

Refs: audit B-3.
EOF
)"

git push -u origin sprint-1/phase-2-analytics-plugin-treeshake

gh pr create --title "refactor(analytics)!: remove plugin re-exports (B-3)" --body "$(cat <<'EOF'
## Summary
- Remove plugin re-exports from `@tour-kit/analytics` root entry.
- Add `./console` subpath export (was only at root before).
- Documents the breaking change + migration in `packages/analytics/MIGRATION.md`.

## Breaking change

Any consumer doing `import { posthogPlugin } from '@tour-kit/analytics'`
must switch to `import { posthogPlugin } from '@tour-kit/analytics/posthog'`.
Migration is a 5-line find-and-replace at most.

## Why

Without this, a consumer who only uses PostHog still pulls all five plugin
entry points into their bundle (and indirectly the SDKs the plugins import,
even after the Phase 1 fix).

## Test plan
- [ ] CI green.
- [ ] `gzip -c packages/analytics/dist/index.js | wc -c` drops further (~3 KB).
- [ ] No `posthogPlugin|mixpanelPlugin|amplitudePlugin|googleAnalyticsPlugin|consolePlugin` markers in `dist/index.js`.
- [ ] All internal docs/examples updated to subpath form.
- [ ] `packages/analytics/MIGRATION.md` exists and is correct.

Refs: audit B-3. Depends on #(phase-1 PR).
EOF
)"
```

## 6. Acceptance gates (hard)

- [ ] `gzip -c packages/analytics/dist/index.js | wc -c` **< 4000**.
- [ ] `grep -cE 'posthogPlugin|mixpanelPlugin|amplitudePlugin|googleAnalyticsPlugin|consolePlugin' packages/analytics/dist/index.js` == **0**.
- [ ] `packages/analytics/dist/plugins/console.js` exists.
- [ ] `packages/analytics/MIGRATION.md` exists.
- [ ] Analytics docs index page has the "Tree-shaking plugins" callout.
- [ ] `pnpm --filter @tour-kit/analytics test` green.
- [ ] `pnpm build --filter='./packages/*'` green.
- [ ] Changeset present, marked minor.

## 7. Communications plan

Because this is a breaking change, more than code is required:

- [ ] Pin a GitHub Discussion explaining the upgrade.
- [ ] Add an entry to `apps/docs/content/blog/` (or the equivalent release
      notes channel) calling out the migration.
- [ ] Update the analytics README's "Quick start" snippet to use subpath
      imports from the very first example.

## 8. Rollback

If post-merge an unexpected consumer breakage surfaces:

```bash
git revert <merge-commit-sha>
git push origin main
pnpm changeset  # mark analytics patch, "revert plugin re-export removal"
```

This restores the root re-exports immediately. The MIGRATION.md and docs
updates can stay (they're informational, not breaking).

Do **not** try to "soft-revert" by re-adding only some plugins — that's
a partial state worse than either extreme.

---

**Next (independent):** [phase-3-adoption-sideeffects.md](phase-3-adoption-sideeffects.md)
