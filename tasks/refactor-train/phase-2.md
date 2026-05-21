# Phase 2 — Logger migration + Biome guard rail

**Duration:** Days 5–7 (~5.5 hours)
**Depends on:** Phase 1 (informational — Phase 1's hoisted `evaluateAudience` introduces a single `console.warn` that this phase migrates; doing them in this order means migrating 1 site instead of 3)
**Blocks:** none
**Risk Level:** LOW — mechanical replacement of ~17 `console.*` call sites with `logger.*`, then a Biome rule that prevents regression. The Biome rule is the durable win; the migration is one-shot.
**Stack:** typescript, biome

---

## Objective

Resolve the [MED] candidate from [`docs/refactor-candidates.md`](../../docs/refactor-candidates.md) titled *"Direct `console.warn`/`console.error` instead of the project `logger` in production paths"*. The whole point of `packages/core/src/utils/logger.ts` is to let consumers silence/raise the noise floor via `logger.configure({ level })` — today, ~17 direct `console.*` calls bypass that knob, so `logger.configure({ level: 'silent' })` silently does nothing for half the package output.

This phase:

1. Classifies every existing `console.*` call into **migrate**, **preserve-via-override**, or **already-exempt**.
2. Mechanically replaces the ~17 migrate sites with `logger.warn` / `logger.error`.
3. Enables `lint/suspicious/noConsole` as an `"error"` Biome rule globally.
4. Adds `overrides` for the legitimate exemptions (codemod CLI, logger itself, the analytics ConsolePlugin, dev-loud sites that must fire regardless of logger level).
5. Adds a CI grep gate as belt-and-suspenders.

The result: `logger.configure({ level: 'silent' })` produces a fully silent tour-kit, and no future PR can sneak a new `console.*` past CI without explicit override review.

---

## What Success Looks Like

1. **`pnpm lint` passes with `noConsole: "error"` enabled.** Verified by running `pnpm lint` from repo root.
2. **The 17 production-runtime call sites are migrated to `logger.warn`/`logger.error`.** Verified by `grep -rEn "console\.(warn|error|log|info)" packages/*/src --include="*.ts" --include="*.tsx" | grep -v <exempted patterns>` returning **0 lines**.
3. **Consumer-side silencing works.** A new integration test in `packages/core/src/utils/__tests__/logger-coverage.test.ts` calls `logger.configure({ level: 'silent' })`, then invokes 3 representative migrated call sites (a `useSegment` unknown-name path, a `useResolvedText` warning, an `analytics/init` plugin failure), and asserts `console.warn`/`console.error` are **not** called.
4. **Deliberately-loud sites preserved with `overrides`.** Two sites stay on `console.warn` because they must fire regardless of consumer logger config — `tour-provider.tsx:1704` (test-bridge "do not ship to production" warning) and `interpolate.ts:22` (driven by an explicit `warnOnMissing: true` flag that the consumer asked for). These two are exempted via Biome `overrides`, **not** `biome-ignore` comments.
5. **The codemod CLI (`packages/codemods/`) keeps its `console.*` usage.** CLIs are intended to write to stdout/stderr. Exempted via Biome `overrides`.
6. **The analytics ConsolePlugin is exempted.** `packages/analytics/src/plugins/console.ts` is the package whose entire purpose is to write to `console.*`. Exempted via Biome `overrides`.
7. **`tooling/biome/biome.json` carries the new rule and overrides block.** Diff visible to reviewers.
8. **An optional `scripts/check-console-usage.sh` exists.** Belt-and-suspenders: runs in CI and fails if a `console.*` slips past Biome (e.g. dynamic computed names like `(window as any)['console']['warn']`). Single-line grep with proper exemptions.
9. **`pnpm build` clean.** No regressions in tsup output. The logger calls compile to the same shape as `console.*` so bundle size is unchanged (a few extra `[tour-kit] ` prefix bytes per call site).
10. **`apps/docs/content/docs/guides/observability.mdx`** (or equivalent) is updated to mention that all warnings/errors route through `logger` and `logger.configure({ level: 'silent' })` produces full silence. If no such page exists, defer the doc update to a follow-up issue — don't block the phase on it.

---

## What Failure Looks Like (and what to do)

- **A migrated `logger.warn` silently no-ops in production** because `getDefaultLevel()` returns `'error'` when `NODE_ENV === 'production'`. This is **intentional**: production users explicitly opt in by setting `logger.configure({ level: 'warn' })`. But for sites that were previously loud unconditionally (e.g. a test-mode warning), this is a regression. **Fix:** classify these sites as "preserve-via-override" in §1 below — they stay on `console.warn`.
- **The Biome rule flags `console.log` calls inside JSDoc examples** (e.g. `* console.log(value)` in a doc comment). Biome's `noConsole` should not flag comments, but if it does, gate the JSDoc behind `/* eslint-skip */`-style hacks or escape it. **Mitigation:** Biome treats JSDoc as a comment, so this is hypothetical — verify on first lint run.
- **`logger.error` in a test environment makes vitest stdout noisy.** The default level is `'warn'` in non-production, so `logger.error` will always fire. If test output becomes unreadable, configure vitest's `setupFiles` to `logger.configure({ level: 'silent' })` per-package. Document in each `vitest.setup.ts`.
- **A consumer set `logger.configure({ level: 'silent' })` before this phase and noticed their console wasn't fully silent.** Phase 2 is the fix — call out in the changeset that this is a behavioural improvement: silent now actually silent.
- **An accessibility/dev-only `console.warn` carries product information that the dev should always see, regardless of `level: 'silent'`.** Example: `<MediaSlot>` warning when GIF is rendered without poster under prefers-reduced-motion (`packages/media/src/components/media-slot.tsx:209`). **Decision:** migrate to `logger.warn` — the dev who configured `silent` accepted full silence. If they want this specific warning, they bump the level to `warn`. Document the trade-off in the changeset.
- **The Biome `overrides` block doesn't match nested package paths.** Biome glob patterns are anchored relative to the config file location. Test with `pnpm lint --files-changed-against=HEAD~1` after enabling the rule to confirm patterns work.

---

## Classification Table — every existing `console.*` call site

(Sourced from `grep -rEn "console\.(warn|error|log|info)" packages/ --include="*.ts" --include="*.tsx" | grep -v __tests__ | grep -v ".test." | grep -v ".spec." | grep -v dist | grep -v __spikes__` run during planning.)

### MIGRATE (replace with `logger.*`) — 17 sites

| File:Line                                                              | Current call                                        | Migration target                                                            |
| ---------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| `packages/core/src/lib/audience.ts` (NEW from Phase 1)                 | `console.warn` for unknown segment                  | `logger.warn` (drop the `[tour-kit] ` prefix — logger already prefixes)     |
| `packages/core/src/lib/segmentation/use-segment.ts:61`                 | `console.warn('[tour-kit] useSegment: unknown segment …')` | `logger.warn('useSegment: unknown segment …')`                          |
| `packages/core/src/registry/tour-registry.tsx:106`                     | `console.error('…duplicate id…')`                   | `logger.error('TourRegistry: duplicate id …')`                              |
| `packages/core/src/context/tour-provider.tsx:432`                      | `console.warn('… restoreFromUrl …')`                | `logger.warn(...)`                                                          |
| `packages/announcements/src/adapters/sonner.ts:17`                     | `console.warn('[tour-kit] …')`                      | `logger.warn(...)`                                                          |
| `packages/media/src/components/media-slot.tsx:209`                     | `console.warn('[MediaSlot] GIF without poster …')`  | `logger.warn('MediaSlot: GIF without poster …')`                            |
| `packages/license/src/lib/domain.ts:26`                                | `console.warn(...)`                                 | `logger.warn(...)`                                                          |
| `packages/license/src/context/license-context.tsx:144`                 | `console.warn('<LicenseProvider> received non-positive trialDays…')` | `logger.warn('LicenseProvider: …')`                       |
| `packages/license/src/components/trial-badge.tsx:43`                   | `console.warn(...)`                                 | `logger.warn(...)`                                                          |
| `packages/license/src/components/pro-gate.tsx:63`                      | `console.error(...)`                                | `logger.error(...)`                                                         |
| `packages/license/src/components/license-warning.tsx:9`                | `console.warn(...)`                                 | `logger.warn(...)`                                                          |
| `packages/ai/src/core/events.ts:18`                                    | `console.warn('[@tour-kit/ai] Async handler error …')` | `logger.warn('AI: Async handler error …')`                                |
| `packages/ai/src/core/events.ts:22`                                    | `console.warn('[@tour-kit/ai] handler error …')`    | `logger.warn(...)`                                                          |
| `packages/ai/src/hooks/use-persistence.ts:70`                          | `console.warn('[tour-kit/ai] Persistence error: …')`| `logger.warn('AI: Persistence error: …')`                                   |
| `packages/ai/src/hooks/use-tour-assistant.ts:115`                      | `console.warn('[tour-kit/ai] askAboutStep() called with no active step …')` | `logger.warn(...)`                                  |
| `packages/ai/src/server/route-handler.ts:196`                          | `console.warn('[@tour-kit/ai] beforeSend hook error: …')` | `logger.warn(...)`                                                    |
| `packages/ai/src/server/route-handler.ts:232`                          | `console.warn('[@tour-kit/ai] beforeResponse hook error: …')` | `logger.warn(...)`                                                |

**Subtotal: 17 migrations.** Note that `@tour-kit/ai` and `@tour-kit/license` may not currently depend on `@tour-kit/core` at runtime — verify before importing `logger`. If a runtime dep is missing, add it to the package's `package.json` (it's already a peerDep in most cases). See the per-package dep graph in `CLAUDE.md`.

### PRESERVE-VIA-OVERRIDE (keep `console.*`, exempt in `tooling/biome/biome.json`) — 2 sites

| File:Line                                                              | Reason                                                                                                                  |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/context/tour-provider.tsx:1704`                     | `'[Tour Kit] Test bridge enabled. Disable for production.'` — must fire regardless of consumer logger config since the warning's whole job is to say "do not ship this to production". Silencing it defeats the purpose. |
| `packages/core/src/lib/interpolate.ts:22`                              | `console.warn('[tour-kit] interpolate: missing key "…"')` — driven by an explicit `warnOnMissing: true` flag the consumer opts into. They asked for the warning loudly. Consider migrating *also*, decision: defer to a follow-up — `warnOnMissing` is API contract today. |

### ALREADY-EXEMPT (path-based — no change) — multiple sites

| Path                                                                   | Reason                                                                  |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/codemods/src/cli.ts`, `packages/codemods/src/bin/tour-kit-migrate.ts` | CLI — supposed to write to stdout/stderr.                       |
| `packages/analytics/src/plugins/console.ts`                            | The plugin whose name is `console` — its purpose is to write events to `console.*`. |
| `packages/core/src/utils/logger.ts`                                    | The logger itself — uses `console.*` internally.                        |
| `packages/ai/src/__spikes__/**`                                        | Spike directory — already excluded by `**/__spikes__/**` in `biome.json` `files.ignore`. |
| `packages/adoption/tsup.config.ts`                                     | Build script — runs at build time, not user-visible runtime.            |
| `packages/react/src/components/provider/tourkit-provider.tsx:68`       | A `console.log` inside a JSDoc `@example` block — not real code.        |
| `packages/core/src/registry/tour-registry.tsx:24,79,96`                | Doc comments mentioning `console.error` — not real code.                |
| `packages/core/src/lib/segmentation/use-segment.ts:33`                 | Doc comment mentioning `console.warn` — not real code.                  |

---

## Files Touched

### Modified

| Path                                                            | Change                                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `tooling/biome/biome.json`                                      | Add `suspicious.noConsole: "error"` + an `overrides` block (~30 lines)              |
| `packages/core/src/lib/audience.ts`                             | Drop `biome-ignore` from Phase 1's `console.warn`; replace with `logger.warn`        |
| `packages/core/src/lib/segmentation/use-segment.ts`             | `console.warn` → `logger.warn`                                                      |
| `packages/core/src/registry/tour-registry.tsx`                  | `console.error` → `logger.error`                                                    |
| `packages/core/src/context/tour-provider.tsx:432`               | `console.warn` → `logger.warn` (line 1704 stays on `console.warn`)                  |
| `packages/announcements/src/adapters/sonner.ts`                 | `console.warn` → `logger.warn`                                                      |
| `packages/media/src/components/media-slot.tsx`                  | `console.warn` → `logger.warn`                                                      |
| `packages/license/src/lib/domain.ts`                            | `console.warn` → `logger.warn`                                                      |
| `packages/license/src/context/license-context.tsx`              | `console.warn` → `logger.warn`                                                      |
| `packages/license/src/components/trial-badge.tsx`               | `console.warn` → `logger.warn`                                                      |
| `packages/license/src/components/pro-gate.tsx`                  | `console.error` → `logger.error`                                                    |
| `packages/license/src/components/license-warning.tsx`           | `console.warn` → `logger.warn`                                                      |
| `packages/ai/src/core/events.ts`                                | 2× `console.warn` → `logger.warn`                                                   |
| `packages/ai/src/hooks/use-persistence.ts`                      | `console.warn` → `logger.warn`                                                      |
| `packages/ai/src/hooks/use-tour-assistant.ts`                   | `console.warn` → `logger.warn`                                                      |
| `packages/ai/src/server/route-handler.ts`                       | 2× `console.warn` → `logger.warn`                                                   |

### Added

| Path                                                            | Purpose                                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `scripts/check-console-usage.sh`                                | Belt-and-suspenders CI check                                            |
| `packages/core/src/utils/__tests__/logger-coverage.test.ts`     | Integration test — `logger.configure({ level: 'silent' })` produces full silence |

### Possibly modified (depending on current state)

| Path                                                            | Change                                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `packages/ai/package.json`                                      | Add `@tour-kit/core` as a runtime dep if not already (it should be — check)         |
| `packages/license/package.json`                                 | Same as above                                                                       |

---

## Step-by-Step Implementation

### Step 1 — Audit the classification table against current state (30 min)

Run the audit grep:

```bash
grep -rEn "console\.(warn|error|log|info)" packages/ --include="*.ts" --include="*.tsx" \
  | grep -v __tests__ | grep -v ".test." | grep -v ".spec." \
  | grep -v dist | grep -v __spikes__ \
  | tee /tmp/console-audit.txt
```

Cross-reference each line against the classification table above. Any line not in the table is **new since planning** — classify it on the spot (migrate / preserve / exempt) and add to the table. If unsure, default to migrate.

Common edge cases:

- Lines inside doc comments (`* console.log(...)`) — already exempt, Biome ignores them.
- Lines inside `@example` JSDoc blocks — already exempt.
- Lines inside template literals (`` `${console.log}` ``) — should never happen; if found, this is a bug.

### Step 2 — Verify `logger` is importable from every migrate target's package (15 min)

```bash
for pkg in core react hints announcements adoption ai license media analytics surveys checklists scheduling; do
  echo "=== $pkg ==="
  cat packages/$pkg/package.json | grep -A20 '"dependencies"' | head -25
done
```

Confirm `@tour-kit/core` is listed as a dep (or `peerDependency`) for `ai`, `license`, `media`, `announcements`. If missing, add via `pnpm --filter @tour-kit/<name> add @tour-kit/core@workspace:*`.

### Step 3 — Mechanical migration (2 h)

For each entry in the MIGRATE table, do:

1. Import `logger` from `@tour-kit/core` at the top of the file (or `from '../../utils/logger'` if inside `core` itself):
   ```ts
   import { logger } from '@tour-kit/core'  // or relative path if inside core
   ```
2. Replace `console.warn(...)` with `logger.warn(...)`.
3. Drop the leading `[tour-kit]`/`[@tour-kit/ai]`/etc. prefix from the message — `logger` already prefixes with `[tour-kit]`. (For ai/license/etc. that want to retain a sub-prefix, keep the rest: `'AI: …'`, `'License: …'`.)

Worked example for `packages/ai/src/core/events.ts:18`:

```diff
- console.warn(`[@tour-kit/ai] Async event handler error for '${type}':`, error)
+ logger.warn(`AI: Async event handler error for '${type}':`, error)
```

After migrating all 17 sites, run `pnpm --filter @tour-kit/<each-package> build` to confirm no broken imports.

### Step 4 — Update `tooling/biome/biome.json` (45 min)

Add the `noConsole` rule + `overrides` block:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.8.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": { "noExcessiveCognitiveComplexity": "warn" },
      "correctness": { /* ... unchanged ... */ },
      "style": { /* ... unchanged ... */ },
      "suspicious": {
        "noExplicitAny": "warn",
        "noArrayIndexKey": "warn",
        "noConsole": {
          "level": "error",
          "options": { "allow": [] }
        }
      },
      "a11y": { /* ... unchanged ... */ }
    }
  },
  "formatter": { /* ... unchanged ... */ },
  "javascript": { /* ... unchanged ... */ },
  "json": { /* ... unchanged ... */ },
  "overrides": [
    {
      "include": [
        "packages/codemods/src/cli.ts",
        "packages/codemods/src/bin/**"
      ],
      "linter": { "rules": { "suspicious": { "noConsole": "off" } } }
    },
    {
      "include": ["packages/core/src/utils/logger.ts"],
      "linter": { "rules": { "suspicious": { "noConsole": "off" } } }
    },
    {
      "include": ["packages/analytics/src/plugins/console.ts"],
      "linter": { "rules": { "suspicious": { "noConsole": "off" } } }
    },
    {
      "include": ["packages/core/src/lib/interpolate.ts"],
      "linter": { "rules": { "suspicious": { "noConsole": "off" } } }
    },
    {
      "include": ["packages/core/src/context/tour-provider.tsx"],
      "linter": {
        "rules": {
          "suspicious": {
            "noConsole": {
              "level": "warn",
              "options": { "allow": ["warn"] }
            }
          }
        }
      }
    },
    {
      "include": ["**/tsup.config.ts", "**/vitest.config.ts", "**/vitest.setup.ts"],
      "linter": { "rules": { "suspicious": { "noConsole": "off" } } }
    }
  ]
}
```

**Notes on the override structure:**

- The `tour-provider.tsx` override is *narrower* — it lets `console.warn` through (for the line 1704 test-bridge warning) but still bans `console.log` and `console.info`. The line-432 case was migrated to `logger.warn`, so the file no longer has any `console.error` calls; if a reviewer wanted full strictness here, we could use a `biome-ignore` comment instead and drop the file from the override. The current shape errs on the side of fewer suppressions in source.
- Biome's `overrides[].linter.rules.suspicious.noConsole` accepts the same shape as the top-level rule (level + options).
- Glob patterns are anchored at the directory containing the Biome config. Since `tooling/biome/biome.json` is the extends target and the per-repo `biome.json` extends it, both view the workspace root the same way. Verify by running `pnpm lint --files-changed-against=HEAD~1` on a known-affected file.

### Step 5 — Run `pnpm lint` and fix any unexpected hits (30 min)

```bash
pnpm lint
```

Expected: zero violations. If violations appear:

1. **Newly-added `console.*` call introduced since the classification audit.** Migrate it.
2. **A file matches an override pattern but Biome still flags it.** Glob bug — verify the path with `pnpm lint --files-changed-against=HEAD~1 -- <file>`.
3. **JSDoc `@example` flagged.** Biome shouldn't do this — file a bug if it does, escape the example with `// biome-ignore` as a temporary fix.

### Step 6 — Add the silence integration test (30 min)

**`packages/core/src/utils/__tests__/logger-coverage.test.ts`** (new file):

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { logger } from '../logger'

afterEach(() => {
  vi.restoreAllMocks()
  logger.configure({ level: 'warn' })  // restore default
})

describe('logger.configure({ level: silent }) produces full silence', () => {
  it('logger.warn does not call console.warn at silent', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.configure({ level: 'silent' })
    logger.warn('test')
    expect(spy).not.toHaveBeenCalled()
  })

  it('logger.error does not call console.error at silent', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.configure({ level: 'silent' })
    logger.error('test')
    expect(spy).not.toHaveBeenCalled()
  })

  it('logger.warn calls console.warn at default level', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.configure({ level: 'warn' })
    logger.warn('test')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toBe('[tour-kit]')
  })
})
```

This test does not verify the full migration end-to-end — it verifies the logger's silence contract, which is what the migration enables.

### Step 7 — Add the optional CI grep gate (15 min)

**`scripts/check-console-usage.sh`** (new file, executable):

```bash
#!/usr/bin/env bash
# Belt-and-suspenders check: ensures no production runtime path uses console.*
# directly. The Biome `noConsole` rule is the primary gate; this script catches
# anything Biome's static analysis misses (e.g. computed property access).
#
# Exempted paths intentionally — see tooling/biome/biome.json `overrides` for
# the matching list.

set -euo pipefail

EXEMPTED='(packages/analytics/src/plugins/console|utils/logger|__spikes__|codemods/src/(cli|bin)|tsup\.config|vitest\.(config|setup)|interpolate\.ts|tour-provider\.tsx)'

VIOLATIONS=$(grep -rEn "console\.(warn|error|log|info|debug|trace)" packages/*/src \
  --include="*.ts" --include="*.tsx" \
  | grep -vE "$EXEMPTED" \
  | grep -v __tests__ | grep -v "\.test\." | grep -v "\.spec\." \
  | grep -v dist || true)

if [[ -n "$VIOLATIONS" ]]; then
  echo "ERROR: direct console.* usage detected (use logger.* from @tour-kit/core):"
  echo ""
  echo "$VIOLATIONS"
  exit 1
fi

echo "OK: no direct console.* usage in production paths"
```

Wire into CI by adding to `.github/workflows/<ci>.yml` (or whatever the project uses — verify by reading existing CI config first):

```yaml
- name: Console usage check
  run: bash scripts/check-console-usage.sh
```

If no CI config touches this, defer the CI integration to a follow-up issue — the local script is still useful for pre-commit / pre-PR hygiene.

### Step 8 — Validation (30 min)

```bash
pnpm lint                                  # green
pnpm typecheck                             # green (modulo dashboard-next baseline)
pnpm --filter @tour-kit/core test          # green, including new logger-coverage test
bash scripts/check-console-usage.sh        # OK
pnpm build                                 # green
```

If a per-package test now fails because it asserted on a literal `console.warn` call, **the assertion is wrong** — it should assert on `logger.warn` (or equivalent indirect observation). Update the test.

---

## Validation Gates

1. `pnpm lint` returns exit 0.
2. `bash scripts/check-console-usage.sh` returns "OK".
3. New test `packages/core/src/utils/__tests__/logger-coverage.test.ts` passes.
4. `pnpm --filter '@tour-kit/*' test` passes across the workspace.
5. `pnpm typecheck` is clean except for the pre-existing dashboard-next failure (memory `#203`).
6. `pnpm build` produces all package `dist/` directories without error.
7. Bundle size delta is ≤ +0.5KB per package (logger prefix adds bytes but it's marginal).

---

## Rollback Plan

This phase ships as a single PR. Rollback is `git revert <merge-commit-sha>`. The only durable artefact is the Biome rule; reverting also removes the rule, so existing per-file `biome-ignore` comments (if any were added during migration) become orphaned but harmless.

If the Biome rule itself causes too much noise in CI for downstream consumers (e.g. `examples/`), narrow the `include` patterns rather than disable: add `examples/**` to `overrides` with `noConsole: "off"`.

---

## Open Questions Surfaced During Planning

1. **Should `interpolate.ts:22` migrate too?** Today it's gated by `warnOnMissing: true` — an explicit opt-in. Migrating would mean consumers who opted in via `warnOnMissing` then silence via `logger.configure({ level: 'silent' })` get no warning, which is **surprising but consistent**. Decision: defer — keep as override-preserved for now, revisit if a user complains. Strong-opinion vote: migrate, but only after a beta release that surfaces the change.
2. **`tour-provider.tsx:1704` test-bridge warning** — instead of `console.warn`, should we throw in production? The current message says "Disable for production"; throwing makes that enforceable. Decision: out of scope for this phase — file a follow-up issue.
3. **Should we add `logger.trace` for very-verbose debug?** Today the logger has 5 levels (`debug`, `info`, `warn`, `error`, `silent`). Some migrated sites emit per-step lifecycle info that's useful for the `debug` level but tedious at `info`. Decision: out of scope — file a follow-up if a use case emerges.
4. **`packages/ai/__spikes__/**` keeps `console.log` legitimately for spike scripts.** Already excluded via `files.ignore: ["**/__spikes__/**"]`. No change needed.

---

## Time Budget

| Step                                                       | Estimated |
| ---------------------------------------------------------- | --------- |
| 1. Audit classification against current state              | 30 min    |
| 2. Verify logger imports across packages                   | 15 min    |
| 3. Mechanical migration (17 sites)                         | 2 h       |
| 4. Update biome.json with rule + overrides                 | 45 min    |
| 5. Run `pnpm lint` and fix unexpected hits                 | 30 min    |
| 6. Add silence integration test                            | 30 min    |
| 7. Add CI grep gate                                        | 15 min    |
| 8. Validation                                              | 30 min    |
| **Total**                                                  | **5.5 h** |

If §3 takes more than 3 hours, the classification table is wrong — re-audit and find the missing sites before continuing.
