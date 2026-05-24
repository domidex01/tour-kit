# Phase 5 — `@tour-kit/codemods` docs (G-1)

> **Goal:** `apps/docs/content/docs/codemods/` currently does not exist;
> v0.3.0 of the package ships migration tooling that's effectively
> undiscoverable. Create an index page + per-transform pages and wire into
> nav.
>
> **Audit ID:** G-1 (HIGH).
> **Effort:** M (3 new MDX pages + nav edit).
> **Branch:** `sprint-1/phase-5-codemods-docs`.
> **Bump:** docs only, no package version change.
> **Independent.**

## 1. Pre-conditions

- Read the actual transforms before writing about them:
  - `packages/codemods/src/transforms/from-driver.ts` (633 LOC)
  - `packages/codemods/src/transforms/from-shepherd.ts` (581 LOC)
  - `packages/codemods/src/transforms/from-joyride.ts`
  - `packages/codemods/src/transforms/replay-bridge-to-use-tour-actions.ts`
  - `packages/codemods/src/transforms/target-to-ref.ts`
- Read `packages/codemods/README.md` and `packages/codemods/docs/*.md`.
  They already contain coverage matrices and the CLI contract; the docs-site
  pages should adapt those facts instead of inventing new behavior.
- Read `packages/codemods/package.json` and `packages/codemods/tsup.config.ts`.
  The package already has a real `bin` entry:
  `tour-kit-migrate` → `./dist/bin/tour-kit-migrate.cjs`, and tsup builds it
  from `src/bin/tour-kit-migrate.ts`.

```bash
pnpm --filter @tour-kit/codemods build
test -f packages/codemods/dist/bin/tour-kit-migrate.cjs
node packages/codemods/dist/bin/tour-kit-migrate.cjs --help
```

If the bin smoke test fails, stop and fix/file that bug before publishing the
docs. The package is CLI-only (`src/index.ts` intentionally exports nothing),
so direct `jscodeshift -t node_modules/@tour-kit/codemods/dist/transforms/...`
paths are not a reliable public interface.

## 2. File plan

| File                                                    | Purpose                                |
|---------------------------------------------------------|----------------------------------------|
| `apps/docs/content/docs/codemods/index.mdx`             | Overview, install, when to use         |
| `apps/docs/content/docs/codemods/from-shepherd.mdx`     | Per-transform doc                       |
| `apps/docs/content/docs/codemods/from-driver.mdx`       | Per-transform doc                       |
| `apps/docs/content/docs/codemods/from-joyride.mdx`      | Per-transform doc                       |
| `apps/docs/content/docs/codemods/meta.json`             | Nav metadata for the subtree            |
| `apps/docs/content/docs/meta.json`                      | Edit: add `codemods` to root nav        |

Skip `replay-bridge-to-use-tour-actions` and `target-to-ref` in Phase 5 —
those are internal-ish helpers, not user-invocable migrations. If you
want them documented, add a Phase 5.1 in Sprint 2.

## 3. Templates

### 3.1 `apps/docs/content/docs/codemods/index.mdx`

```mdx
---
title: Codemods
description: Automated codemods to migrate from React Joyride, Shepherd.js, and Driver.js to Tour Kit.
---

# Codemods

`@tour-kit/codemods` ships [jscodeshift](https://github.com/facebook/jscodeshift)
transforms that rewrite Joyride, Shepherd.js, and Driver.js call sites
into their Tour Kit equivalents. They handle the mechanical parts of a
migration — step-list reshaping, prop renames, lifecycle hook
substitution — so you can focus on the parts that need product judgment.

## When to use a codemod

- **You have a working tour in another library** and want to evaluate
  Tour Kit without hand-rewriting every step list.
- **You're migrating a non-trivial app** (10+ tours). Hand-edits scale
  badly.
- **You want a starting point.** Codemods aren't a one-shot drop-in;
  expect to manually adjust ~5–15 % of the output. They get you past
  the boilerplate.

If your app has one tour with three steps, hand-editing is faster.

## Install

Install the codemods as a dev dependency or run the package manager's
temporary-exec command:

```bash
pnpm add -D @tour-kit/codemods

# Migrate every .tsx/.ts/.jsx/.js file under src/ from Shepherd.js
pnpm exec tour-kit-migrate --from shepherd --dry-run src/
pnpm exec tour-kit-migrate --from shepherd src/
```

(Substitute `--from driver` or `--from joyride` as needed.)

For one-off use with npm:

```bash
npx -p @tour-kit/codemods tour-kit-migrate --from joyride --dry-run src/
```

Advanced fallback for maintainers only: run the source transforms from a
checked-out repo while developing codemods. Published docs should point users
at `tour-kit-migrate`.

## Available transforms

- [from-shepherd](/docs/codemods/from-shepherd) — Shepherd.js v10+ → Tour Kit.
- [from-driver](/docs/codemods/from-driver) — Driver.js v1+ → Tour Kit.
- [from-joyride](/docs/codemods/from-joyride) — React Joyride v2+ → Tour Kit.

## After running a codemod

1. Review the diff. The transform comments unrecognized constructs with
   `// TODO:` comments that link to the matching migration guide anchor —
   search for `TODO`.
2. Run your tests. Codemods don't preserve runtime behavior for
   100 % of edge cases; the remaining ~5 % is on you.
3. Format the output (`prettier --write` or `biome format --write`).
4. Open the matching guide for the library you migrated from
   (`/docs/migration/<library>`) for hand-written context the codemod
   can't infer.

## Limitations

Codemods operate on the AST. They cannot infer:

- Dynamically constructed step lists (e.g. `steps.push(...)` driven by
  runtime data).
- Custom themes / styles — these need manual porting against the Tour Kit
  theming guide.
- Server-rendered tours (Next.js App Router patterns) — wrap output in
  `'use client'` manually after migrating.

When in doubt, search the output for `TODO` markers.
```

### 3.2 `apps/docs/content/docs/codemods/from-shepherd.mdx`

```mdx
---
title: from-shepherd
description: Migrate from Shepherd.js v10+ to Tour Kit using tour-kit-migrate.
---

# from-shepherd

Transforms `Shepherd.Tour` instances and their step lists into the
Tour Kit equivalent.

## Run

```bash
pnpm exec tour-kit-migrate --from shepherd --dry-run src/
pnpm exec tour-kit-migrate --from shepherd src/
```

Flags you may want:

- `--dry` — print the would-be diff without writing.
- `--print` — also print the new files to stdout.
- `--verbose=2` — see each transform decision.

## What it changes

| Shepherd                                                  | Tour Kit                                         |
|-----------------------------------------------------------|--------------------------------------------------|
| `new Shepherd.Tour({ defaultStepOptions: { ... } })`     | `<TourProvider tours={[...]}>` with shared opts |
| `tour.addStep({ id, text, attachTo, ... })`              | `{ id, content, target }` step entry            |
| `attachTo: { element, on: 'bottom' }`                    | `target` (CSS selector) + `placement: 'bottom'` |
| `buttons: [{ action: 'next', text: 'Next' }]`            | Removed — `TourCard` ships built-in nav buttons |
| `tour.start()`                                            | `actions.start(tourId)` from `useTourActions()` |
| `tour.cancel()`                                           | `actions.skip()`                                 |
| `tour.complete()`                                         | `actions.complete()`                             |
| `Shepherd.on('cancel', fn)`                              | `<TourProvider onSkip={fn}>`                    |

## What it does NOT handle

- **Custom button arrays.** The codemod drops `buttons` entirely; the
  Tour Kit `TourCard` ships next/prev/skip buttons. If your Shepherd
  setup had a non-default button (e.g. "Open docs"), copy it manually
  into the step's `footer` slot.
- **Custom theme classes.** Re-author them against the Tour Kit theming
  guide.
- **Multiple parallel tours.** Shepherd allows multiple `Tour` instances
  active at once; Tour Kit's multi-tour registry handles this differently
  — see [`TourProvider` multi-tour docs](/docs/react/tour-provider).

## Example

**Before:**

```ts
import Shepherd from 'shepherd.js'

const tour = new Shepherd.Tour({
  defaultStepOptions: { scrollTo: true, cancelIcon: { enabled: true } },
})

tour.addStep({
  id: 'welcome',
  text: 'Welcome!',
  attachTo: { element: '#header', on: 'bottom' },
})

tour.addStep({
  id: 'cta',
  text: 'Click here to begin.',
  attachTo: { element: '#cta-button', on: 'top' },
})

tour.start()
```

**After codemod:**

```tsx
import { TourProvider, useTourActions } from '@tour-kit/react'

const tours = [
  {
    id: 'main',
    steps: [
      {
        id: 'welcome',
        content: 'Welcome!',
        target: '#header',
        placement: 'bottom',
      },
      {
        id: 'cta',
        content: 'Click here to begin.',
        target: '#cta-button',
        placement: 'top',
      },
    ],
  },
]

// In your component tree:
// <TourProvider tours={tours}>{children}</TourProvider>
// In a child component:
//   const actions = useTourActions()
//   actions.start('main')
```

## See also

- [Migration guide: Shepherd.js → Tour Kit](/docs/migration/shepherd)
- [`TourProvider` reference](/docs/react/tour-provider)
```

### 3.3 `apps/docs/content/docs/codemods/from-driver.mdx`

Follow the same structure as 3.2, but for Driver.js v1+:

```mdx
---
title: from-driver
description: Migrate from Driver.js v1+ to Tour Kit using tour-kit-migrate.
---

# from-driver

Transforms `driver()` instances and their step lists.

## Run

```bash
pnpm exec tour-kit-migrate --from driver --dry-run src/
pnpm exec tour-kit-migrate --from driver src/
```

## What it changes

| Driver.js                                       | Tour Kit                              |
|-------------------------------------------------|---------------------------------------|
| `driver({ steps: [...] })`                      | `<TourProvider tours={[{ steps }]}>` |
| `{ element: '#x', popover: { title, description } }` | `{ target: '#x', title, content }`    |
| `popover: { side: 'bottom' }`                   | `placement: 'bottom'`                 |
| `driverObj.drive()`                             | `actions.start(tourId)`              |
| `driverObj.destroy()`                           | `actions.skip()` + provider unmount   |
| `onDeselected`, `onHighlightStarted`            | `onStepChange` callback (see docs)    |

## What it does NOT handle

- **Conditional `disableActiveInteraction`** at the step level — Tour Kit
  routes through `<TourProvider blockInteractions>`; if only some steps
  block, fork into separate tours.
- **`overlayClickNext` behavior** — opt into via Tour Kit's
  `closeOnOverlayClick` provider prop; the codemod inserts a TODO
  comment when it sees it.

## Example

**Before:**

```ts
import { driver } from 'driver.js'

const tour = driver({
  steps: [
    {
      element: '#header',
      popover: { title: 'Welcome', description: 'Get started.', side: 'bottom' },
    },
  ],
})

tour.drive()
```

**After codemod:**

```tsx
import { TourProvider, useTourActions } from '@tour-kit/react'

const tours = [
  {
    id: 'main',
    steps: [
      {
        id: 'step-0',
        target: '#header',
        title: 'Welcome',
        content: 'Get started.',
        placement: 'bottom',
      },
    ],
  },
]

// In your component tree:
//   <TourProvider tours={tours}>{children}</TourProvider>
// In a child component:
//   const actions = useTourActions()
//   actions.start('main')
```

## See also

- [Migration guide: Driver.js → Tour Kit](/docs/migration/driver)
```

### 3.4 `apps/docs/content/docs/codemods/from-joyride.mdx`

Follow the same template; cross-reference the existing
`apps/docs/content/docs/migration/joyride.mdx` to ensure terminology lines
up. Use this run command:

```bash
pnpm exec tour-kit-migrate --from joyride --dry-run src/
pnpm exec tour-kit-migrate --from joyride src/
```

Key Joyride-to-Tour-Kit mappings:

| Joyride                                       | Tour Kit                              |
|-----------------------------------------------|---------------------------------------|
| `<Joyride steps={...} run={true} />`          | `<TourProvider tours={[{ id, steps }]}>` + `actions.start(id)` |
| `{ target: '.x', content: '...' }`            | Same shape — no change                |
| `<Joyride callback={fn} />` with `STATUS.SKIPPED` | `<TourProvider onSkip={fn} />`        |
| `disableBeacon: true`                         | Default; remove the prop              |
| `spotlightClicks`                             | `closeOnOverlayClick` (inverted semantics — comment a TODO) |

### 3.5 `apps/docs/content/docs/codemods/meta.json`

```json
{
  "title": "Codemods",
  "pages": [
    "index",
    "---",
    "from-shepherd",
    "from-driver",
    "from-joyride"
  ]
}
```

### 3.6 Edit `apps/docs/content/docs/meta.json`

Add `codemods` under the `---Resources---` section (next to `migration`):

```json
{
  "title": "Documentation",
  "root": true,
  "pages": [
    "index",
    "---Getting Started---",
    "getting-started",
    "---Core Packages---",
    "core",
    "react",
    "hints",
    "---Extended Packages---",
    "adoption",
    "analytics",
    "announcements",
    "checklists",
    "media",
    "scheduling",
    "surveys",
    "---Licensing---",
    "licensing",
    "---Resources---",
    "guides",
    "examples",
    "migration",
    "codemods",
    "api",
    "troubleshooting",
    "---AI---",
    "ai",
    "ai-assistants"
  ]
}
```

## 4. Cross-link from existing migration pages

The migration pages (`apps/docs/content/docs/migration/{driver,joyride,shepherd}.mdx`)
should point to the matching codemod page near the top, in a callout:

```mdx
:::tip Automate the mechanical bits
Use the [`from-shepherd` codemod](/docs/codemods/from-shepherd) to handle
step-list reshaping and prop renames automatically. Come back here for
the bits that need judgment.
:::
```

Repeat for `driver.mdx` and `joyride.mdx`.

## 5. Validation

### 5.1 Docs site builds

```bash
pnpm --filter @tour-kit/docs dev
# Open http://localhost:3000/docs/codemods in a browser
# Confirm nav shows: Codemods (top-level), with 4 child pages.
```

Click through each page; verify no MDX parse errors, no broken links.

### 5.2 Link check

```bash
pnpm --filter @tour-kit/docs build  # If your docs build runs link checks, great.
```

Or run the `link-check.yml` workflow against your branch.

### 5.3 No package code changed

```bash
git diff --stat -- packages/
```

Should be empty. This is a docs-only PR.

## 6. Commit + PR

```bash
git checkout -b sprint-1/phase-5-codemods-docs

git add apps/docs/content/docs/codemods/ \
        apps/docs/content/docs/meta.json \
        apps/docs/content/docs/migration/

git commit -m "$(cat <<'EOF'
docs(codemods): add codemods subtree with per-transform pages

@tour-kit/codemods v0.3.0 had zero documentation pages, making the
migration tooling effectively invisible. Adds an index page and three
per-transform pages (from-shepherd, from-driver, from-joyride) plus
inbound links from the existing migration guides.

No package code changed.

Refs: audit G-1.
EOF
)"

git push -u origin sprint-1/phase-5-codemods-docs

gh pr create --title "docs(codemods): add codemods subtree (G-1)" --body "$(cat <<'EOF'
## Summary
- New `apps/docs/content/docs/codemods/` subtree with index + 3 transform pages.
- Inbound callouts from `migration/{shepherd,driver,joyride}.mdx`.
- Nav wired in `apps/docs/content/docs/meta.json`.

## What's NOT here
- A new codemod binary implementation. The `tour-kit-migrate` bin already
  exists; this PR only documents it on the docs site.
- Docs for `replay-bridge-to-use-tour-actions` and `target-to-ref` —
  those are internal helpers, not user-invocable.

## Test plan
- [ ] `pnpm --filter @tour-kit/docs dev` shows new nav entry.
- [ ] All four MDX pages render without errors.
- [ ] No 404s on internal links (`/docs/migration/*`, `/docs/react/tour-provider`).
- [ ] CI green.

Refs: audit G-1.
EOF
)"
```

## 7. Acceptance gates

- [ ] 4 new MDX files exist under `apps/docs/content/docs/codemods/`.
- [ ] `apps/docs/content/docs/codemods/meta.json` exists.
- [ ] `apps/docs/content/docs/meta.json` lists `codemods` under Resources.
- [ ] 3 existing migration pages have an inbound callout to the codemod page.
- [ ] `pnpm --filter @tour-kit/docs build` (or `dev`) renders all pages.
- [ ] No package code touched.

## 8. Rollback

```bash
git revert <merge-commit-sha>
git push origin main
```

Docs-only revert is always safe.

---

**Next (independent):** [phase-6-testing-library-docs.md](phase-6-testing-library-docs.md)
