# Phase 1 — Fix analytics SDK packaging (B-2)

> **Goal:** Drop `@tour-kit/analytics` bundle from 64 KB gz → ~6 KB gz by
> externalizing the Amplitude SDK that's currently inlined and declaring the
> externalized SDKs as real optional peers.
>
> **Audit ID:** B-2 (BLOCKING).
> **Effort:** S (`tsup` external + package metadata + verification).
> **Branch:** `sprint-1/phase-1-analytics-tsup-fix`.
> **Bump:** patch (`@tour-kit/analytics` 0.11.3 → 0.11.4).

## 1. Pre-conditions

- Phase 0 baseline saved (we need pre-fix numbers to prove the win).
- `pnpm install --frozen-lockfile` clean.
- Working tree clean.

## 2. The fix

### 2.1 Edit `packages/analytics/tsup.config.ts`

Current (line 9, the `external` array):

```ts
external: ['react', 'react-dom', '@tour-kit/core', 'posthog-js', 'mixpanel-browser', '@tour-kit/license'],
```

Replace with (alphabetized for stability, `@amplitude/analytics-browser` added):

```ts
external: [
  '@amplitude/analytics-browser',
  '@tour-kit/core',
  '@tour-kit/license',
  'mixpanel-browser',
  'posthog-js',
  'react',
  'react-dom',
],
```

**Why alphabetize?** Future externals get added in obvious order; prevents
the same "forgot to add X" class of bug. Cheap defense.

### 2.2 Edit `packages/analytics/package.json`

The SDK packages currently appear in `peerDependenciesMeta`, but not in
`peerDependencies`. That is incomplete package metadata: consumers using a
plugin do not get a useful optional-peer signal.

Add the three externalized SDKs to `peerDependencies`, matching the versions
already used in `devDependencies`:

```diff
   "peerDependencies": {
+    "@amplitude/analytics-browser": "^2.36.7",
+    "mixpanel-browser": "^2.75.0",
+    "posthog-js": "^1.362.0",
     "react": "^18.0.0 || ^19.0.0",
     "react-dom": "^18.0.0 || ^19.0.0"
   },
```

Keep the existing `peerDependenciesMeta` optional flags for all three SDKs.
Do not move these SDKs to `dependencies`; plugin users should opt into their
analytics vendor explicitly.

### 2.3 No source changes

Don't touch `src/plugins/amplitude.ts` itself. The plugin code is fine —
it dynamically imports the SDK and gracefully no-ops when the optional peer
isn't installed. Confirmed by reading
`packages/analytics/src/plugins/amplitude.ts` during plan validation.

## 3. Validation

### 3.1 Local build

```bash
pnpm --filter @tour-kit/analytics build
```

There is no `clean` script in `packages/analytics/package.json`; the package
uses `tsup` with `clean: true`.

### 3.2 Bundle-size hard gates

```bash
# Plugin file: must drop from ~217 KB raw → ~1 KB or less
raw_amp=$(wc -c < packages/analytics/dist/plugins/amplitude.js)
gz_amp=$(gzip -c packages/analytics/dist/plugins/amplitude.js | wc -c)
echo "amplitude.js: $raw_amp raw, $gz_amp gz"
[ "$gz_amp" -lt 1000 ] || { echo "FAIL: amplitude.js gz still > 1 KB"; exit 1; }

# Root entry: must drop from ~64 KB gz → ~6 KB
raw_idx=$(wc -c < packages/analytics/dist/index.js)
gz_idx=$(gzip -c packages/analytics/dist/index.js | wc -c)
echo "index.js: $raw_idx raw, $gz_idx gz"
[ "$gz_idx" -lt 8000 ] || { echo "FAIL: index.js gz still > 8 KB"; exit 1; }
```

### 3.3 Sanity: SDK strings should be gone

```bash
# Should be 0 now (was 10+ before):
grep -c '@amplitude/plugin-' packages/analytics/dist/plugins/amplitude.js || true
```

If the grep still finds matches, the externalization didn't work — most
likely you edited the wrong file. tsup configs live at the package root,
not under `src/`.

### 3.4 Tests still pass

```bash
pnpm --filter @tour-kit/analytics test
```

The analytics test suite is 11 files / 11 tests. They mock the SDK, so the
externalization should not change behavior.

### 3.5 Downstream packages still build

Eight packages import `@tour-kit/analytics`. Verify none broke:

```bash
pnpm build --filter='./packages/*'
```

If any consumer suddenly fails to find an Amplitude type, that's a sign
type re-exports were doing real work and the plugin was leaking types
through the root entry. Fix at the source: import the SDK type from
`@amplitude/analytics-browser` directly in the consumer (vanishingly
unlikely — nobody should be doing this).

## 4. Changeset

```bash
pnpm changeset
```

Select **`@tour-kit/analytics`** only. Pick **patch**. Description:

```
Externalize @amplitude/analytics-browser in tsup config. The SDK was being
inlined into dist/, ballooning the package to 64 KB gz (vs. ~6 KB
expected). Also declares the analytics SDKs as real optional peer
dependencies instead of listing them only in peerDependenciesMeta.

Consumer impact: smaller bundles when not using Amplitude. Consumers who
were relying on the bundled SDK (against the documented peer-dep contract)
must now explicitly install `@amplitude/analytics-browser`.

Refs: audit B-2.
```

## 5. Commit + PR

```bash
git checkout -b sprint-1/phase-1-analytics-tsup-fix
git add packages/analytics/tsup.config.ts packages/analytics/package.json .changeset/
git commit -m "$(cat <<'EOF'
fix(analytics): externalize @amplitude/analytics-browser

@amplitude/analytics-browser was missing from tsup external, so the
full SDK got inlined into dist/index.js (~64 KB gz). Adding it
externalizes the SDK, dropping dist/index.js to ~6 KB gz and
dist/plugins/amplitude.js to <1 KB gz.

Also declares posthog-js, mixpanel-browser, and
@amplitude/analytics-browser as optional peers. They were previously
listed only in peerDependenciesMeta, which is incomplete package
metadata.

Refs: audit B-2.
EOF
)"
git push -u origin sprint-1/phase-1-analytics-tsup-fix
gh pr create --title "fix(analytics): externalize @amplitude/analytics-browser (B-2)" --body "$(cat <<'EOF'
## Summary
- Add `@amplitude/analytics-browser` to `packages/analytics/tsup.config.ts` external array.
- Add real optional peer dependency declarations for `posthog-js`,
  `mixpanel-browser`, and `@amplitude/analytics-browser`.
- Drops `dist/index.js` from ~64 KB gz to ~6 KB gz.
- Drops `dist/plugins/amplitude.js` from ~62 KB gz to <1 KB gz.

## Why
The SDKs had optional metadata but were missing from `peerDependencies`, and
`@amplitude/analytics-browser` was missing from the tsup external list.
Bundlers therefore inlined the full SDK (visible as 10+ `@amplitude/plugin-*`
markers in dist).

## Test plan
- [ ] CI green (lint, typecheck, build, test).
- [ ] `gzip -c packages/analytics/dist/plugins/amplitude.js | wc -c` < 1000.
- [ ] `gzip -c packages/analytics/dist/index.js | wc -c` < 8000.
- [ ] No `@amplitude/plugin-` markers in dist (`grep -c '@amplitude/plugin-' packages/analytics/dist/plugins/amplitude.js` == 0).
- [ ] `peerDependencies` includes `posthog-js`, `mixpanel-browser`, and `@amplitude/analytics-browser`, each marked optional.
- [ ] All package consumers of `@tour-kit/analytics` still build clean.

Refs: audit B-2.
EOF
)"
```

## 6. Acceptance gates (hard)

- [ ] `gzip -c packages/analytics/dist/index.js | wc -c` **< 8000**.
- [ ] `gzip -c packages/analytics/dist/plugins/amplitude.js | wc -c` **< 1000**.
- [ ] `grep -c '@amplitude/plugin-' packages/analytics/dist/plugins/amplitude.js` == **0**.
- [ ] `packages/analytics/package.json` has `peerDependencies` entries for
      `posthog-js`, `mixpanel-browser`, and `@amplitude/analytics-browser`,
      with matching optional metadata.
- [ ] `pnpm --filter @tour-kit/analytics test` green.
- [ ] `pnpm build --filter='./packages/*'` green.
- [ ] Changeset present.
- [ ] PR opened.

## 7. Rollback

If post-merge a consumer reports a missing Amplitude function at runtime
that they were depending on via the bundled SDK:

```bash
git revert <merge-commit-sha>
git push origin main
# That re-inlines the SDK. Document the consumer who broke and follow up
# with them to install the peer dep correctly before retrying.
```

Do **not** revert by editing `tsup.config.ts` directly — keep the audit
trail in git history clean.

## 8. Why this is BLOCKING (not just HIGH)

- Every consumer of `@tour-kit/analytics` who isn't using Amplitude pays a
  ~58 KB gz tax. That's larger than the entire `react` package.
- The bug was a one-line omission; cost-to-fix is trivial, cost-of-not-fixing
  grows with every new consumer.
- It blocks Phase 7 — we can't set a sensible `8 KB` budget for `analytics`
  until this lands.

---

**Next:** [phase-2-analytics-plugin-treeshake.md](phase-2-analytics-plugin-treeshake.md)
