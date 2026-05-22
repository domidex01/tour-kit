# Phase 2: Logger Migration And Console Guard Rail

**Risk:** Medium.
**Estimated effort:** 6-8 hours.
**Primary packages:** `core`, `react`, `hints`, `announcements`, `media`, `ai`, `license`, `codemods`.
**Goal:** Make production runtime logging configurable while keeping intentionally loud warnings explicit.

---

## Current State

`packages/core/src/utils/logger.ts` already provides `logger.configure({ level })`, but production source still has direct `console.warn` / `console.error` calls.

The current production audit command is:

```bash
rg -n "console\\.(warn|error|log|info)" packages \
  --glob '*.{ts,tsx}' \
  --glob '!**/dist/**' \
  --glob '!**/__tests__/**' \
  --glob '!**/*.test.*' \
  --glob '!**/*.spec.*' \
  --glob '!**/__spikes__/**'
```

As of 2026-05-21, the audit lights up **26** files. The full per-site classification is in **Per-Site Classification** below — it supersedes the rough package-level summary that previously lived here. Anything new since that audit must be classified before editing.

---

## Classification Policy

Use three buckets:

| Bucket | Meaning | Treatment |
| --- | --- | --- |
| migrate | Production runtime warnings/errors that should respect `logger.configure` | Replace with `logger.warn` / `logger.error` |
| preserve | Deliberately loud warnings that must bypass logger silence | Keep `console.*`; document in Biome override |
| exempt | CLI, build scripts, logger implementation, console analytics plugin, tests/spikes/docs/examples | Allow by path or keep outside gate |

Do not migrate examples, docs scripts, tests, or spike code as part of this phase.

---

## Per-Site Classification

The audit on 2026-05-21 surfaced **26** production console sites across **26** files in `packages/**/src` and adopt/build scripts. Every site is enumerated below. Phase 2 must not add new sites without classifying them.

### Preserve (keep `console.*`; covered by Biome override)

Loud-by-design warnings or files whose job is console output:

- `packages/core/src/context/tour-provider.tsx` — test-bridge production warning.
- `packages/core/src/utils/logger.ts` — logger implementation itself.
- `packages/license/src/components/license-test-mode.tsx` — loud production warning (2 calls).
- `packages/license/src/components/license-warning.tsx` — styled license-violation warning.
- `packages/license/src/components/pro-gate.tsx` — Pro-required `console.error`, the SDK's enforcement surface.
- `packages/license/src/lib/domain.ts` — domain-mismatch watermark warning; pairs with visible UI watermark.
- `packages/analytics/src/plugins/console.ts` — the console analytics plugin.
- `packages/core/src/lib/interpolate.ts` (2 calls) — `warnOnMissing: true` is an explicit-warning API. Decision point below.

### Migrate (route through `logger.warn` / `logger.error`)

Dev-only or runtime warnings that should respect `logger.configure`:

- `packages/core/src/lib/segmentation/use-segment.ts` (2) — unknown-segment dev warnings.
- `packages/core/src/registry/tour-registry.tsx` (4) — duplicate registration warnings.
- `packages/announcements/src/adapters/sonner.ts` (1) — runtime adapter warning.
- `packages/media/src/components/media-slot.tsx` (1) — invalid-embed warning.
- `packages/react/src/components/card/tour-card.tsx` (1) — runtime warning.
- `packages/ai/src/core/events.ts` (2) — async-handler error logging.
- `packages/ai/src/hooks/use-persistence.ts` (1)
- `packages/ai/src/hooks/use-tour-assistant.ts` (1)
- `packages/ai/src/server/route-handler.ts` (2)
- `packages/license/src/components/trial-badge.tsx` (1) — dev-only `NODE_ENV !== 'production'` DX warning; migrate so `logger.configure({ level: 'silent' })` silences it too.
- `packages/license/src/context/license-context.tsx` (1) — same pattern as `trial-badge.tsx`.

Phase 1 will already convert the audience evaluators (`use-step-filter.tsx`, `use-hint-filter.tsx`, `use-filtered-announcements.tsx`) to use the core helper, so they will end Phase 1 with **at most one** logger call each. Verify after Phase 1 lands before Phase 2 begins.

### Exempt (outside the production gate; not in Biome overrides because already excluded by `files.ignore` or path filter)

- `packages/codemods/src/cli.ts` (10) and `packages/codemods/src/bin/**` (1) — CLI output is intentional.
- `packages/adoption/tsup.config.ts` (1) and any other `**/tsup.config.ts` — build-time scripts; root `biome.json` already ignores `scripts/`, but `tsup.config.ts` lives in package roots, so add a `**/tsup.config.ts` exclusion to Biome overrides.

### False positives the audit grep flags but Biome does not lint

- `packages/react/src/components/provider/tourkit-provider.tsx:68` — `console.log` inside a JSDoc `/** … */` code-block example. Biome does not lint inside comments; the grep still picks it up. Note this in the PR's audit table so reviewers do not chase it.

### Policy decision on `interpolate.ts`

`interpolate.ts` is the only policy-sensitive item. The stricter interpretation is to migrate it, because `logger.configure({ level: 'silent' })` should mean silent. The compatibility interpretation is to preserve it because `warnOnMissing: true` is an explicit warning request. Pick one before implementation and record it in the PR.

---

## License Package Decision Gate

`@tour-kit/license` currently has no `@tour-kit/core` dependency. Before migrating license console calls, choose one route:

1. **Add core dependency.** Add `@tour-kit/core: "workspace:*"` to `packages/license/package.json`, add `@tour-kit/core` to `packages/license/tsup.config.ts` `external`, then import `logger` from `@tour-kit/core`.
2. **Keep license standalone.** Leave license runtime warnings as direct console calls and document them as preserve/exempt until a separate package-boundary decision.

Preferred route: add the core dependency only if the size/build check is acceptable for both `@tour-kit/license` and `@tour-kit/license/headless`.

Validation for this decision:

```bash
pnpm --filter @tour-kit/license build
pnpm --filter @tour-kit/license typecheck
pnpm --filter @tour-kit/license test
```

---

## Implementation Steps

### 1. Re-Audit

Run the audit command and paste the results into the PR description as a before/after table. Anything new since this plan must be classified before editing.

### 2. Migrate Core-Dependent Packages

For files in packages that already depend on core, import `logger` from `@tour-kit/core` outside core and from `../utils/logger` / `../../utils/logger` inside core.

Drop duplicated prefixes where appropriate:

```ts
// before
console.warn('[tour-kit] useSegment: unknown segment "x"')

// after
logger.warn('useSegment: unknown segment "x"')
```

For AI messages, keep a useful sub-prefix:

```ts
logger.warn(`AI: Async event handler error for '${type}':`, error)
```

### 3. Migrate Or Classify License

Apply the decision from the license gate. If adding core:

- update `dependencies`
- update tsup `external`
- migrate direct console calls except `LicenseTestMode`
- run the license validation commands

If preserving license standalone, add the license paths to the explicit allowlist and record why in the PR.

### 4. Add Biome Rule

In `tooling/biome/biome.json`, add:

```json
"suspicious": {
  "noExplicitAny": "warn",
  "noArrayIndexKey": "warn",
  "noConsole": {
    "level": "error",
    "options": {
      "allow": []
    }
  }
}
```

Then add `overrides` for the preserve/exempt paths. Confirm the override syntax locally with:

```bash
pnpm exec biome explain noConsole
pnpm lint
```

The root `biome.json` already ignores dist, node_modules, `.next`, `.turbo`, coverage, `__spikes__`, scripts, fixtures, and test-results.

### 5. Optional Grep Gate

Add `scripts/check-console-usage.sh` only if the repo CI can run it immediately. Keep it path-based and production-source only.

Recommended check shape:

```bash
#!/usr/bin/env bash
set -euo pipefail

VIOLATIONS=$(rg -n "console\\.(warn|error|log|info)" packages \
  --glob '*.{ts,tsx}' \
  --glob '!**/dist/**' \
  --glob '!**/__tests__/**' \
  --glob '!**/*.test.*' \
  --glob '!**/*.spec.*' \
  --glob '!**/__spikes__/**' \
  --glob '!packages/core/src/utils/logger.ts' \
  --glob '!packages/core/src/context/tour-provider.tsx' \
  --glob '!packages/core/src/lib/interpolate.ts' \
  --glob '!packages/analytics/src/plugins/console.ts' \
  --glob '!packages/license/src/components/license-test-mode.tsx' \
  --glob '!packages/license/src/components/license-warning.tsx' \
  --glob '!packages/license/src/components/pro-gate.tsx' \
  --glob '!packages/license/src/lib/domain.ts' \
  --glob '!packages/codemods/src/cli.ts' \
  --glob '!packages/codemods/src/bin/**' \
  --glob '!**/tsup.config.ts' || true)

if [[ -n "$VIOLATIONS" ]]; then
  echo "Direct console.* usage detected:"
  echo "$VIOLATIONS"
  exit 1
fi
```

Mirror the exact preserve list in this script if it is added.

---

## Tests

Add focused tests where logging behavior matters:

- Core logger coverage:
  - configure `silent`
  - trigger an unknown segment and a duplicate registry path
  - assert the underlying console spy is not called
- License test coverage only if license migrates to core logger:
  - configure `silent`
  - trigger a migrated license warning
  - assert direct console is not called
- Keep existing tests for deliberately loud sites and update assertions to expect `console.warn` only for preserve-list files.

Avoid broad tests that instantiate half the workspace just to observe logging. Three representative migrated sites are enough.

---

## Validation Gates

```bash
pnpm lint
pnpm --filter @tour-kit/core test
pnpm --filter @tour-kit/react test
pnpm --filter @tour-kit/hints test
pnpm --filter @tour-kit/announcements test
pnpm --filter @tour-kit/media test
pnpm --filter @tour-kit/ai test
pnpm --filter @tour-kit/license test
pnpm typecheck
pnpm build
```

Then run the production audit command. Every remaining line must be in one of:

- logger implementation
- console analytics plugin
- codemod CLI
- build script
- preserved loud warning
- doc comment or example text that Biome does not lint as executable code

---

## Rollback

Rollback is `git revert <merge-commit-sha>`.

If the Biome rule is too noisy, keep the code migration and temporarily lower only the rule to `"warn"` while tightening overrides. Do not revert migrated logger calls unless behavior regresses.
