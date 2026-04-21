# Phase 6 — Source Code Separation

**Duration:** Days 20-21 (~6-7h)
**Depends on:** Phase 5 (all code complete, tested, documented)
**Blocks:** Nothing (final phase)
**Risk Level:** MEDIUM — irreversible repo restructuring, npm access changes
**Stack:** typescript

---

## 1. Objective + What Success Looks Like

Split the Tour Kit monorepo into two independent repositories: a public `domidex01/tour-kit` containing only the 3 MIT-licensed free packages (`core`, `react`, `hints`) and a private `domidex01/tour-kit-pro` containing all 8 proprietary packages (`license`, `adoption`, `ai`, `analytics`, `announcements`, `checklists`, `media`, `scheduling`). Fix npm access so all pro packages are restricted (currently all 8 are publicly installable). Set up independent CI/CD and Changesets release pipelines for the private repo.

**Success looks like:**

- Running `npm access get status @tour-kit/announcements` returns `restricted` for all 8 pro packages
- `domidex01/tour-kit-pro` is a private GitHub repo with its own pnpm + Turborepo monorepo scaffold
- All 8 pro packages build and pass tests in the private repo, depending on `@tour-kit/core`, `@tour-kit/react`, and `@tour-kit/hints` via npm (not `workspace:*`)
- `git ls-files packages/{adoption,ai,analytics,announcements,checklists,license,media,scheduling}` in the public repo returns empty
- Public repo `pnpm install && pnpm build && pnpm typecheck` passes with only free packages
- Docs site builds without broken imports from removed pro packages
- `pnpm changeset && pnpm version-packages && npm publish --dry-run --access restricted` succeeds in the private repo
- GitHub Actions in the private repo can build and publish restricted npm packages

---

## 2. Key Design Decisions

**D1: Fix npm access before touching any source code.**
All 8 pro packages are currently `public` on npm. Anyone can `npm install @tour-kit/announcements` right now. This is the highest-priority fix and must happen before any repo restructuring. A single `npm access restricted` command per package switches them immediately. This is a one-time operation that takes effect globally in seconds.

**D2: Replace `workspace:*` with published npm version ranges.**
Pro packages currently use `"@tour-kit/core": "workspace:*"` which resolves within the monorepo. In the private repo, these must become `"@tour-kit/core": "^0.3.0"` (using the latest published versions). Cross-pro dependencies (e.g., `@tour-kit/announcements` depends on `@tour-kit/scheduling`) stay as `workspace:*` within the private monorepo since both packages live there. Only dependencies on free packages change.

**D3: Private repo is a minimal pnpm + Turborepo monorepo.**
Copy the root config files (`turbo.json`, `tsconfig.json`, `pnpm-workspace.yaml`, `.npmrc`) from the public repo and adapt them. The private repo does NOT include `apps/docs/`, `examples/`, or `tooling/` -- only `packages/*`. The `pnpm-workspace.yaml` has a single entry: `packages/*`.

**D4: CI/CD uses Changesets with `access: restricted`.**
The private repo gets its own `.github/workflows/ci.yml` (build + test on PR) and `.github/workflows/release.yml` (Changesets publish). The Changesets config sets `"access": "restricted"` which passes `--access restricted` to `npm publish`. The release workflow uses an npm Automation token (bypasses 2FA for CI) stored as the `NPM_TOKEN` GitHub secret.

**D5: Release order is free-first, pro-second.**
Pro packages depend on free packages via npm semver ranges (e.g., `^0.3.0`). When free packages bump, pro packages continue working within the range. For breaking changes (major bump), the sequence is: publish free packages first, then update pro package deps and publish. This is a human coordination step, not an automated one.

**D6: Docs site references pro packages via npm, not source imports.**
After removing pro package directories from the public repo, the docs site must not break. Pro package API documentation pages use MDX content (not live imports from source). Any code examples that import pro packages work because they reference the npm package name, not a workspace path. If any build-time imports exist, replace them with conditional stubs or remove them.

---

## 3. Tasks

### Step 1: Fix npm Access (URGENT) -- 0.5h

| # | Task | Hours | Dependencies | Output |
|---|------|-------|-------------|--------|
| 6.0a | Run `npm access restricted` for all 8 pro packages | 0.25h | npm Pro plan active, npm login | 8 packages switched to restricted |
| 6.0b | Verify restricted status for all 8 packages | 0.25h | 6.0a | All return `restricted` |

### Step 2: Create Private Repo and Move Source -- 2.5h

| # | Task | Hours | Dependencies | Output |
|---|------|-------|-------------|--------|
| 6.1 | Create private GitHub repo | 0.25h | -- | `domidex01/tour-kit-pro` exists |
| 6.2 | Initialize as pnpm monorepo with Turborepo, copy and adapt root configs | 0.5h | 6.1 | Monorepo scaffolded |
| 6.3 | Copy all 8 pro package directories | 0.5h | 6.2 | 8 packages in `packages/` |
| 6.4 | Update all `package.json` deps -- `workspace:*` to published npm versions for free packages | 0.5h | 6.3 | 8 `package.json` files updated |
| 6.5 | `pnpm install && pnpm build` in private repo | 0.5h | 6.4 | Build passes |
| 6.6 | `pnpm test` in private repo | 0.25h | 6.5 | Tests pass |

### Step 3: Clean Public Repo -- 1.2h

| # | Task | Hours | Dependencies | Output |
|---|------|-------|-------------|--------|
| 6.7 | Delete pro package directories from public repo | 0.25h | 6.5 (private repo verified) | Directories removed |
| 6.8 | Verify `pnpm-workspace.yaml` auto-adjusts (wildcard `packages/*` still works) | 0.1h | 6.7 | Only core, react, hints remain |
| 6.9 | `pnpm install && pnpm build && pnpm typecheck` in public repo | 0.25h | 6.7 | Free packages build |
| 6.10 | Update docs site -- remove or stub pro package imports | 0.5h | 6.7 | Docs site builds |
| 6.11 | Commit: `"chore: remove pro packages -- moved to private repo"` | 0.1h | 6.9, 6.10 | Public repo cleaned |

### Step 4: CI/CD and Release Config -- 1.85h

| # | Task | Hours | Dependencies | Output |
|---|------|-------|-------------|--------|
| 6.12 | Configure Changesets in private repo | 0.25h | 6.3 | `.changeset/config.json` |
| 6.13 | Set up GitHub Actions: `ci.yml` + `release.yml` | 1h | 6.5 | Workflows committed |
| 6.14 | Add `NPM_TOKEN` secret to private repo | 0.1h | 6.13 | Secret configured |
| 6.15 | Dry-run full release | 0.5h | 6.12, 6.13 | Verification log |

### Step 5: Verify and Document -- 0.8h

| # | Task | Hours | Dependencies | Output |
|---|------|-------|-------------|--------|
| 6.16 | Verify public repo has zero pro source | 0.1h | 6.11 | Confirmed |
| 6.17 | Verify npm restricted access | 0.1h | 6.0b | Confirmed |
| 6.18 | Update public repo README | 0.25h | 6.11 | README updated |
| 6.19 | Update CLAUDE.md in both repos | 0.25h | 6.11 | Both updated |
| 6.20 | Push private repo to GitHub | 0.1h | 6.15 | Private repo live |

---

## 4. Deliverables

### Public Repo (`domidex01/tour-kit`) -- After Cleanup

```
tour-kit/
├── packages/
│   ├── core/                    # @tour-kit/core (MIT, public)
│   ├── react/                   # @tour-kit/react (MIT, public)
│   └── hints/                   # @tour-kit/hints (MIT, public)
├── apps/
│   └── docs/                    # Documentation site
├── examples/                    # Example projects (free packages only)
├── .changeset/
│   └── config.json              # access: public, linked: [core, react, hints]
├── .github/
│   └── workflows/
│       ├── ci.yml               # Existing CI
│       └── release.yml          # Existing release (public packages)
├── turbo.json
├── pnpm-workspace.yaml
├── CLAUDE.md                    # Updated -- no pro package references
├── README.md                    # Updated -- pro packages referenced as npm-only
└── package.json
```

### Private Repo (`domidex01/tour-kit-pro`) -- New

```
tour-kit-pro/
├── packages/
│   ├── license/                 # @tour-kit/license (proprietary, restricted)
│   ├── adoption/                # @tour-kit/adoption (proprietary, restricted)
│   ├── ai/                      # @tour-kit/ai (proprietary, restricted)
│   ├── analytics/               # @tour-kit/analytics (proprietary, restricted)
│   ├── announcements/           # @tour-kit/announcements (proprietary, restricted)
│   ├── checklists/              # @tour-kit/checklists (proprietary, restricted)
│   ├── media/                   # @tour-kit/media (proprietary, restricted)
│   └── scheduling/              # @tour-kit/scheduling (proprietary, restricted)
├── .changeset/
│   └── config.json              # access: restricted, linked: [all 8 pro packages]
├── .github/
│   └── workflows/
│       ├── ci.yml               # Build + test on PR
│       └── release.yml          # Changesets publish with --access restricted
├── turbo.json
├── tsconfig.json
├── pnpm-workspace.yaml          # packages: ["packages/*"]
├── .npmrc
├── CLAUDE.md                    # Pro-specific guidance
├── README.md                    # Internal docs
└── package.json                 # Scripts: build, test, release
```

---

## 5. Exit Criteria

| # | Criterion | Verification Command |
|---|-----------|---------------------|
| EC1 | `domidex01/tour-kit-pro` is a private GitHub repo | `gh repo view domidex01/tour-kit-pro --json visibility -q .visibility` returns `PRIVATE` |
| EC2 | Private repo contains all 8 pro packages | `ls tour-kit-pro/packages/` lists: adoption, ai, analytics, announcements, checklists, license, media, scheduling |
| EC3 | All 8 pro packages build in private repo | `cd tour-kit-pro && pnpm build` exits 0 |
| EC4 | All 8 pro packages pass tests in private repo | `cd tour-kit-pro && pnpm test` exits 0 |
| EC5 | Public repo contains zero pro source at HEAD | `cd tour-kit && git ls-files packages/{adoption,ai,analytics,announcements,checklists,license,media,scheduling}` returns empty |
| EC6 | Public repo free packages build | `cd tour-kit && pnpm install && pnpm build && pnpm typecheck` exits 0 |
| EC7 | Pro packages depend on free packages via npm, not workspace | `grep "workspace" tour-kit-pro/packages/*/package.json` shows no `@tour-kit/core`, `@tour-kit/react`, or `@tour-kit/hints` workspace refs |
| EC8 | All 8 pro packages restricted on npm | `npm access get status @tour-kit/<pkg>` returns `restricted` for all 8 |
| EC9 | Changesets config has `access: restricted` | `cat tour-kit-pro/.changeset/config.json` contains `"access": "restricted"` |
| EC10 | GitHub Actions exist in private repo | `ls tour-kit-pro/.github/workflows/` lists `ci.yml` and `release.yml` |
| EC11 | Dry-run release succeeds | `npm publish --dry-run --access restricted` exits 0 for all 8 packages |
| EC12 | Cross-pro deps resolve within private monorepo | `cd tour-kit-pro && pnpm ls --filter @tour-kit/announcements` shows `@tour-kit/scheduling` resolved |
| EC13 | Docs site builds after cleanup | `cd tour-kit && pnpm build --filter=docs` exits 0 |

---

## 6. Execution Prompt

This section is self-contained. Execute steps in order. Do not skip verification steps.

### Prerequisites

- [ ] npm CLI logged in (`npm whoami` returns your username)
- [ ] npm Pro or Org plan active (required for restricted scoped packages)
- [ ] `gh` CLI authenticated (`gh auth status` returns authenticated)
- [ ] Phase 5 complete -- all 8 pro packages are built, tested, and documented in the public repo
- [ ] Published versions confirmed: core@0.3.0, react@0.4.1, hints@0.4.1

### Step 1: Fix npm Access (do this FIRST)

```bash
# Switch all 8 pro packages to restricted
npm access restricted @tour-kit/adoption
npm access restricted @tour-kit/ai
npm access restricted @tour-kit/analytics
npm access restricted @tour-kit/announcements
npm access restricted @tour-kit/checklists
npm access restricted @tour-kit/license
npm access restricted @tour-kit/media
npm access restricted @tour-kit/scheduling

# Verify -- all must return "restricted"
for pkg in adoption ai analytics announcements checklists license media scheduling; do
  status=$(npm access get status @tour-kit/$pkg 2>&1)
  echo "@tour-kit/$pkg: $status"
done
```

**STOP if any package does not return `restricted`.** Debug before proceeding.

### Step 2: Create Private Repo

```bash
# Create and clone
gh repo create domidex01/tour-kit-pro --private --clone
cd tour-kit-pro
```

Create `package.json`:

```bash
cat > package.json << 'PKGJSON'
{
  "name": "tour-kit-pro",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "pnpm build --filter='./packages/*' && changeset publish --access restricted"
  },
  "devDependencies": {
    "turbo": "^2.5.4",
    "@changesets/cli": "^2.29.4",
    "@changesets/changelog-github": "^0.5.1"
  },
  "packageManager": "pnpm@9.15.9",
  "engines": {
    "node": ">=20"
  }
}
PKGJSON
```

Create `pnpm-workspace.yaml`:

```bash
cat > pnpm-workspace.yaml << 'WORKSPACE'
packages:
  - "packages/*"

catalog:
  vitest: ^4.1.0
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
WORKSPACE
```

Create `turbo.json`:

```bash
cat > turbo.json << 'TURBO'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
TURBO
```

Copy `tsconfig.json` and `.npmrc` from public repo:

```bash
cp ../tour-kit/tsconfig.json .
cp ../tour-kit/.npmrc . 2>/dev/null || true
```

### Step 3: Copy Pro Packages

```bash
mkdir -p packages
for pkg in license adoption ai analytics announcements checklists media scheduling; do
  cp -r ../tour-kit/packages/$pkg packages/
done
```

### Step 4: Update Dependencies

Replace free-package `workspace:*` refs with published npm versions. Leave cross-pro `workspace:*` refs intact.

```bash
# Replace workspace:* refs to free packages with published npm versions
for pkg in license adoption ai analytics announcements checklists media scheduling; do
  file="packages/$pkg/package.json"
  if [ -f "$file" ]; then
    sed -i 's/"@tour-kit\/core": "workspace:\*"/"@tour-kit\/core": "^0.3.0"/g' "$file"
    sed -i 's/"@tour-kit\/react": "workspace:\*"/"@tour-kit\/react": "^0.4.1"/g' "$file"
    sed -i 's/"@tour-kit\/hints": "workspace:\*"/"@tour-kit\/hints": "^0.4.1"/g' "$file"
    echo "Updated $file"
  fi
done

# Verify no free-package workspace refs remain
echo "--- Checking for remaining free-package workspace refs ---"
grep -r '"@tour-kit/core": "workspace' packages/*/package.json || echo "None found (good)"
grep -r '"@tour-kit/react": "workspace' packages/*/package.json || echo "None found (good)"
grep -r '"@tour-kit/hints": "workspace' packages/*/package.json || echo "None found (good)"

# Verify cross-pro workspace refs are intact (these should exist)
echo "--- Cross-pro workspace refs (should exist) ---"
grep -r '"@tour-kit/.*": "workspace' packages/*/package.json || echo "No cross-pro deps"
```

### Step 5: Build and Test Private Repo

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

**STOP if build or tests fail.** Fix issues before proceeding to clean the public repo.

### Step 6: Configure Changesets

```bash
mkdir -p .changeset

cat > .changeset/config.json << 'CSCONFIG'
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "domidex01/tour-kit-pro" }],
  "commit": false,
  "fixed": [],
  "linked": [[
    "@tour-kit/license",
    "@tour-kit/adoption",
    "@tour-kit/analytics",
    "@tour-kit/announcements",
    "@tour-kit/checklists",
    "@tour-kit/media",
    "@tour-kit/scheduling",
    "@tour-kit/ai"
  ]],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
CSCONFIG
```

### Step 7: Set Up GitHub Actions

```bash
mkdir -p .github/workflows

cat > .github/workflows/ci.yml << 'CIYML'
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm build --filter='./packages/*'

      - run: pnpm typecheck

      - run: pnpm test
CIYML

cat > .github/workflows/release.yml << 'RELYML'
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - run: pnpm install --frozen-lockfile

      - run: pnpm build --filter='./packages/*'

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          version: pnpm version-packages
          publish: pnpm release
          title: 'chore: version pro packages'
          commit: 'chore: version pro packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
RELYML
```

### Step 8: Dry-Run Release

```bash
# Create a test changeset
pnpm changeset  # Select all packages, patch bump, message: "test: dry-run release"
pnpm version-packages
pnpm build --filter='./packages/*'

# Dry-run publish for each package
for pkg in license adoption ai analytics announcements checklists media scheduling; do
  echo "=== @tour-kit/$pkg ==="
  (cd packages/$pkg && npm publish --dry-run --access restricted 2>&1)
  echo ""
done

# Reset the test changeset (don't commit version bumps)
git checkout -- .
```

### Step 9: Clean Public Repo

```bash
cd ../tour-kit

# Delete pro package directories
rm -rf packages/adoption packages/ai packages/analytics packages/announcements \
       packages/checklists packages/license packages/media packages/scheduling

# Verify workspace -- only free packages remain
pnpm ls --filter='./packages/*' --depth 0
# Should list only: @tour-kit/core, @tour-kit/react, @tour-kit/hints

# Build free packages
pnpm install
pnpm build
pnpm typecheck

# Check docs site for broken pro imports (only .ts/.tsx files, not MDX code blocks)
grep -rn "@tour-kit/license\|@tour-kit/adoption\|@tour-kit/analytics\|@tour-kit/announcements\|@tour-kit/checklists\|@tour-kit/media\|@tour-kit/scheduling\|@tour-kit/ai" apps/docs/ \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || echo "No broken imports"

# Build docs site
pnpm build --filter=docs

# Commit
git add -A
git commit -m "chore: remove pro packages -- moved to private repo"
git push origin main
```

### Step 10: Update Documentation

**Public repo README:**
- Remove pro packages from the packages table
- Add a "Pro Packages" section: available via npm with a license key, link to `tourkit.dev/pricing`
- Note: pro packages require `NPM_TOKEN` for installation

**Public repo CLAUDE.md:**
- Remove all 8 pro packages from Architecture > Packages section
- Remove pro packages from the Package Dependency Graph
- Remove pro package CLAUDE.md references from the table
- Add note: "Pro packages are maintained in a separate private repository"

**Private repo CLAUDE.md:**
- Document the 8 pro packages and their domains
- Reference published free packages as npm dependencies (not workspace)
- Include release workflow instructions
- Document the `access: restricted` Changesets config

### Step 11: Push Private Repo and Final Verification

```bash
cd ../tour-kit-pro

# Add NPM_TOKEN secret (manual step via GitHub UI)
echo "ACTION REQUIRED: Add NPM_TOKEN secret at:"
echo "  https://github.com/domidex01/tour-kit-pro/settings/secrets/actions"

# Commit everything
git add -A
git commit -m "feat: initialize tour-kit-pro monorepo with 8 pro packages

Includes:
- 8 pro packages: license, adoption, ai, analytics, announcements, checklists, media, scheduling
- Changesets config with access: restricted
- GitHub Actions: CI + Release workflows
- Dependencies on published @tour-kit/core@^0.3.0, @tour-kit/react@^0.4.1, @tour-kit/hints@^0.4.1"

git push -u origin main
```

### Step 12: Final Verification Checklist

```bash
# 1. Private repo exists and is private
gh repo view domidex01/tour-kit-pro --json visibility -q .visibility
# Expected: PRIVATE

# 2. Public repo has zero pro source
cd ../tour-kit
git ls-files packages/adoption packages/ai packages/analytics packages/announcements \
             packages/checklists packages/license packages/media packages/scheduling
# Expected: empty output

# 3. npm access is restricted for all 8
for pkg in adoption ai analytics announcements checklists license media scheduling; do
  echo "@tour-kit/$pkg: $(npm access get status @tour-kit/$pkg)"
done
# Expected: all "restricted"

# 4. Public repo builds
pnpm install && pnpm build && pnpm typecheck
# Expected: exit 0

# 5. Private repo builds
cd ../tour-kit-pro
pnpm install && pnpm build && pnpm test
# Expected: exit 0

# 6. No free-package workspace refs in private repo
grep -r '"@tour-kit/core": "workspace' packages/*/package.json
grep -r '"@tour-kit/react": "workspace' packages/*/package.json
grep -r '"@tour-kit/hints": "workspace' packages/*/package.json
# Expected: no output for all three

# 7. Changesets config
cat .changeset/config.json | grep '"access"'
# Expected: "access": "restricted"

echo "Phase 6 complete."
```

---

## Readiness Check

| # | Prerequisite | How to Verify | Status |
|---|-------------|---------------|--------|
| R1 | Phase 5 complete (all pro packages built, tested, documented) | Phase 5 exit criteria met | [ ] |
| R2 | npm CLI authenticated | `npm whoami` returns username | [ ] |
| R3 | npm Pro or Org plan active | `npm profile get` shows paid plan | [ ] |
| R4 | `gh` CLI authenticated | `gh auth status` returns authenticated | [ ] |
| R5 | Free packages published at expected versions | `npm view @tour-kit/core version` returns `0.3.0` | [ ] |
| R6 | All 8 pro packages exist on npm (even if public) | `npm view @tour-kit/license version` returns `0.0.1` | [ ] |
| R7 | No uncommitted changes in public repo | `git status` is clean | [ ] |
| R8 | Git configured with correct user | `git config user.name` and `git config user.email` are set | [ ] |
| R9 | Sufficient disk space for second repo | `df -h .` shows available space | [ ] |
| R10 | npm Automation token ready (for `NPM_TOKEN` secret) | Token generated at npmjs.com > Access Tokens | [ ] |

**All items must be checked before starting Phase 6.**
