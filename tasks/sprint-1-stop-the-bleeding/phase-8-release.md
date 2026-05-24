# Phase 8 — Release + communications

> **Goal:** Cut a release that bundles the seven Sprint-1 phases, publishes to
> npm, and communicates the breaking analytics change so consumers aren't
> surprised. This is the only phase that interacts with external systems
> (npm, GitHub releases, social) — apply the "ask before destructive
> external actions" rule everywhere.
>
> **Effort:** S (process, not code).
> **Branch:** `sprint-1/phase-8-release` (or release on `main` directly via
> changesets, per existing convention).
> **Depends on:** Phases 1–7 merged.

## 1. Pre-conditions

- All 7 PRs merged into `main`.
- `main` CI green (build, test, lint, size-limit).
- Every package-code/package-metadata PR carried a changeset. Docs-only and
  infra-only phases do not need changesets.
- `NPM_TOKEN` is set in repo secrets (this powers `release.yml`).
- You can authenticate to npm locally if doing a manual release (`npm whoami`).

## 2. Pre-release verification

Run the full local gate from a clean state:

```bash
cd /home/domidex/projects/tour-kit
git checkout main
git pull --ff-only
rm -rf node_modules packages/*/node_modules apps/*/node_modules
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm exec size-limit
```

All seven must be green. **Do not release if any are red.** A bad release
is much more expensive to clean up than waiting 24 hours to investigate.

Cross-check against Sprint-1 acceptance gates:

```bash
# Phase 1: analytics root entry under 8 KB gz
gz=$(gzip -c packages/analytics/dist/index.js | wc -c)
echo "analytics: $gz B gz"; [ "$gz" -lt 8000 ] || echo "FAIL phase 1"

# Phase 1: amplitude plugin under 1 KB gz
gz=$(gzip -c packages/analytics/dist/plugins/amplitude.js | wc -c)
echo "amplitude: $gz B gz"; [ "$gz" -lt 1000 ] || echo "FAIL phase 1"

# Phase 2: no plugin re-exports from root
n=$(grep -cE 'posthogPlugin|mixpanelPlugin|amplitudePlugin|googleAnalyticsPlugin|consolePlugin' packages/analytics/dist/index.js || true)
echo "plugin re-exports in root: $n"; [ "$n" = 0 ] || echo "FAIL phase 2"

# Phase 1: externalized SDKs are real optional peers
node - <<'EOF'
const pkg = require('./packages/analytics/package.json')
for (const name of ['posthog-js', 'mixpanel-browser', '@amplitude/analytics-browser']) {
  if (!pkg.peerDependencies?.[name]) console.log(`FAIL phase 1 peer: ${name}`)
  if (!pkg.peerDependenciesMeta?.[name]?.optional) console.log(`FAIL phase 1 peer meta: ${name}`)
}
EOF

# Phase 3: adoption has sideEffects field
grep -n '"sideEffects"' packages/adoption/package.json || echo "FAIL phase 3"

# Phase 4: no pinned versions for catalog libs
n=$(git grep -cE '"(@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge)": "\^' packages/ | wc -l)
echo "pinned catalog libs: $n"; [ "$n" = 0 ] || echo "FAIL phase 4"

# Phase 5: codemods docs exist
[ -d apps/docs/content/docs/codemods ] || echo "FAIL phase 5"

# Phase 6: testing-library docs exist
[ -d apps/docs/content/docs/testing-library ] || echo "FAIL phase 6"

# Phase 7: root size-limit config exists
[ -f .size-limit.json ] || echo "FAIL phase 7"
```

If any FAIL prints, the upstream phase didn't merge cleanly — fix
before releasing.

## 3. Cut the release

The repo uses Changesets. The standard release flow:

```bash
pnpm version-packages
# This consumes .changeset/*.md files, bumps package.json versions,
# updates CHANGELOG.md per package, and runs `biome check --write .`
# to normalize formatting.

git diff --stat
# Review the diff. You should see:
# - Version bumps in packages/{analytics,adoption,...}/package.json
# - CHANGELOG.md updates in each bumped package
# - .changeset/*.md files DELETED (consumed)
```

Verify versions match expectations:

- `@tour-kit/analytics` → minor bump (e.g. 0.11.3 → 0.12.0).
- `@tour-kit/adoption` → patch (2.1.3 → 2.1.4).
- `@tour-kit/core`, `react`, `hints` → patch across the **entire linked
  set** because Phase 4 §8.1 adds a changeset for each of them
  individually. Expect: 1.0.0 → 1.0.1 across all three.

  > **Linked != fixed.** Under `linked` (`.changeset/config.json:5`),
  > Changesets bumps only the linked packages that have a changeset —
  > they just share the highest resulting version. All three bump here
  > because Phase 4's changeset names all three, not because linked
  > auto-propagates. If a future phase only changes `core`, only `core`
  > will bump (and `react`/`hints` will diverge in version). Don't rely
  > on linked for sibling propagation; use `fixed` for that.
- Every other package that had a catalog change: patch.
- No version bump is expected for docs-only phases 5 and 6, or infra-only
  Phase 7, unless a package file changed.

If a version is wrong, you can `git checkout -- .` and re-run
`pnpm changeset` to fix the changeset entries, then re-run
`pnpm version-packages`.

### 3.1 Commit the version bump

```bash
git checkout -b release/sprint-1

git add packages/*/package.json packages/*/CHANGELOG.md .changeset/

git commit -m "$(cat <<'EOF'
chore: version packages for sprint-1 release

Consumes sprint-1 changesets from the package-affecting phases (analytics
SDK packaging, plugin re-export removal, adoption sideEffects, catalog
hygiene). Docs-only and infra-only phases did not create package releases.

Notable: @tour-kit/analytics minor bump is BREAKING — plugins moved
from root entry to subpaths. See packages/analytics/MIGRATION.md.
EOF
)"

git push -u origin release/sprint-1

gh pr create --title "chore: version packages for sprint-1 release" --body "Auto-generated by \`pnpm version-packages\`. Review the version bumps + CHANGELOG entries below."
```

**Get this PR reviewed.** Don't skip review on the release PR just
because it's "just a version bump."

## 4. Publish to npm

Once the release PR is merged:

```bash
git checkout main
git pull --ff-only
pnpm release
# Equivalent to:
#   turbo run build --filter='./packages/*' && changeset publish
```

`changeset publish` will:

1. Build each package once more.
2. Publish to npm using the `NPM_TOKEN` (or local `npm` credentials).
3. Create a git tag per package (e.g. `@tour-kit/analytics@0.12.0`).

**Verify on npm before announcing:**

```bash
npm view @tour-kit/analytics version
npm view @tour-kit/adoption version
npm view @tour-kit/core version
# (etc. for every bumped package)
```

Cross-check each against the version bump you committed in §3.

### 4.1 Smoke-test the published packages

```bash
mkdir -p /tmp/tk-smoke && cd /tmp/tk-smoke
pnpm init
pnpm add @tour-kit/analytics@latest @tour-kit/core@latest react@19 react-dom@19

# Tree-shake check (proves Phase 1 + 2 stick):
cat > probe.ts <<'EOF'
import { createAnalytics } from '@tour-kit/analytics'
import { posthogPlugin } from '@tour-kit/analytics/posthog'
const a = createAnalytics({ plugins: [posthogPlugin({ apiKey: 'x' })] })
export { a }
EOF

pnpm add -D esbuild
pnpm exec esbuild probe.ts --bundle --minify --format=esm --external:react --external:react-dom > probe.bundled.js
ls -la probe.bundled.js
gzip -c probe.bundled.js | wc -c
# Expect: well under 5 KB. If it's 50 KB+, the published package didn't
# get the Phase 1 fix.

grep -c '@amplitude/plugin-' probe.bundled.js || true
# Expect: 0. If non-zero, Phase 1 didn't make it to npm.
```

Clean up after:

```bash
cd / && rm -rf /tmp/tk-smoke
```

## 5. GitHub release notes

For each released package's git tag, generate release notes:

```bash
# List the tags just created:
git tag --sort=-creatordate | head -20
```

For the analytics tag (the breaking one), create a release with extended
notes:

```bash
gh release create '@tour-kit/analytics@0.12.0' \
  --title 'analytics@0.12.0 — plugins move to subpaths (BREAKING)' \
  --notes "$(cat <<'EOF'
## Highlights

This release is **breaking** but the migration is mechanical (5 find-and-replace
operations at most).

### What changed

- Plugins (`posthogPlugin`, `mixpanelPlugin`, `amplitudePlugin`,
  `googleAnalyticsPlugin`, `consolePlugin`) are no longer re-exported from
  `@tour-kit/analytics`. Import from the matching subpath instead:

  ```ts
  // before
  import { posthogPlugin } from '@tour-kit/analytics'
  // after
  import { posthogPlugin } from '@tour-kit/analytics/posthog'
  ```

- The `@amplitude/analytics-browser` SDK is no longer inlined into dist
  (was a build-config bug). Consumers using Amplitude must install it
  as a peer:

  ```bash
  pnpm add @amplitude/analytics-browser
  ```

- Bundle size for the common path (`createAnalytics` + one plugin) drops
  from ~64 KB gz to ~5 KB gz. **~92 % smaller.**

### Migration

See [`packages/analytics/MIGRATION.md`](https://github.com/domidex01/tour-kit/blob/main/packages/analytics/MIGRATION.md).

### Refs

- Audit B-2, B-3 in `reports/package-audit-2026-05-23.md`.
- Sprint 1 plan: `tasks/sprint-1-stop-the-bleeding/`.
EOF
)"
```

For the other (non-breaking) tags, default release notes from the
CHANGELOG entries are fine — Changesets has already generated them.

## 6. Communications

Post in this order, sized to audience:

### 6.1 GitHub Discussion (most authoritative)

Pin a discussion in the repo:

- **Title:** "analytics@0.12.0 ships — plugins now use subpath imports"
- **Body:** Copy the GitHub release notes above + a "Why we did this"
  paragraph linking to the audit.
- **Tags:** `release`, `breaking-change`.

### 6.2 Docs site banner (optional, time-bounded)

Add a banner to `apps/docs` linking to the migration guide. Set an
expiry — banners that overstay become noise. 30 days is reasonable.

### 6.3 Social (optional)

Post on whichever channels you maintain (Twitter/X, Bluesky, dev.to,
your blog). Keep it factual: "We shipped X. Bundle drops 92 %.
Migration is 5 find-and-replaces. Docs: link."

Don't oversell — early-stage 0.x libraries lose more trust from
overhyped releases than from quiet ones.

### 6.4 Update tasks/sprint-1-stop-the-bleeding/README.md

Mark the sprint complete:

```diff
-> Generated: 2026-05-23. Owner: domidex01. Status: PLANNED.
+> Generated: 2026-05-23. Owner: domidex01. Status: SHIPPED 2026-MM-DD.
```

Append a "Retrospective" section at the bottom with:

- Actual hours per phase vs estimate.
- Any phase that needed a follow-up patch (which one, why).
- One thing to do differently for Sprint 2.

This is the document your future self thanks you for.

## 7. Post-release follow-ups (create issues, don't fix now)

File these GitHub issues immediately after release, tag with `sprint-2`:

1. **B-1 follow-up:** Tighten `core` size budget from 20 KB to 8 KB once
   subpath extraction lands.
2. **F-3 follow-up:** Improve the `@tour-kit/codemods` package-runner UX if
   needed (for example documenting `npx -p @tour-kit/codemods tour-kit-migrate`
   versus a shorter alias). The `tour-kit-migrate` bin itself already exists.
3. **R-1 follow-up:** Extract `tour-provider.tsx` (1382 LOC monolith).
4. **R-2/R-5 follow-up:** Same for `announcements`/`surveys`/`checklists`
   providers.
5. **G-3/G-7 follow-up:** Expand `license` and `playwright` docs.
6. **R-4 follow-up:** Type-suppression sweep on `core` + `analytics`.

Each issue's body links back to the audit section and to this Sprint-1
plan as historical context.

## 8. Acceptance gates (hard)

- [ ] All 7 sprint-1 PRs merged into main.
- [ ] Pre-release verification (§2) green.
- [ ] Release PR merged with reviewed version bumps.
- [ ] `pnpm release` succeeded.
- [ ] Every bumped package is queryable on npm at the new version.
- [ ] Smoke-test bundle (§4.1) is < 5 KB gz and contains no `@amplitude/`
      strings.
- [ ] GitHub release published with migration notes for `@tour-kit/analytics`.
- [ ] Discussion pinned, docs banner up (optional).
- [ ] 6 Sprint-2 follow-up issues filed.
- [ ] README.md status updated to SHIPPED, retrospective written.

## 9. Rollback

This is the only phase where rollback is **partial** — once published,
npm versions cannot be unpublished after 72h, and even within the
window, `npm unpublish` is hostile to consumers who already installed.

### 9.1 If a critical bug surfaces in a non-breaking release

Cut a patch release with the fix. Do NOT unpublish.

### 9.2 If `@tour-kit/analytics@0.12.0` causes widespread breakage

Cut `@tour-kit/analytics@0.12.1` immediately that re-adds the plugin
re-exports as deprecated:

```ts
// packages/analytics/src/index.ts (emergency rollback)
export { consolePlugin } from './plugins/console'
export { posthogPlugin } from './plugins/posthog'
// ... (etc., same as pre-0.12)

/** @deprecated Import from `@tour-kit/analytics/<provider>` instead. */
```

This isn't a true rollback — the bundle bloat returns — but it
unblocks pinned consumers while you figure out a graceful path.

### 9.3 If `pnpm release` fails halfway

Some packages published, some didn't. Re-run `pnpm release` — Changesets
is idempotent; it skips already-published versions and finishes the rest.
Verify with `npm view <pkg> version` after.

If `npm` itself errored (auth, 5xx), wait 5 minutes and retry.

---

## End of plan

After Phase 8 ships, archive this directory by moving it to
`tasks/_archive/sprint-1-stop-the-bleeding/` (or your repo's convention)
so it doesn't show up in `tasks/` listings as a live sprint.

Then start Sprint 2.
