# Docs internal-linking audit — 2026-05-24

**Scope:** 274 MDX pages under `apps/docs/content/docs/`.
**Method:** Built a directed link graph from markdown `[text](href)` AND JSX `href="…"` attributes (catches `<Card>`, `<a>`, `<Link>`). Restricted edges to `/docs/...` targets, so the graph reflects docs-internal authority flow only. Then ran a symbol-mention pass (hooks, components, providers, package names) against prose to surface natural-link candidates.

Raw artifacts:
- [`reports/docs-link-graph.md`](./docs-link-graph.md) — full tables (orphans, dead-ends, per-page candidates).
- [`reports/docs-link-graph.json`](./docs-link-graph.json) — machine-readable graph.
- [`scripts/audit-docs-link-graph.ts`](../scripts/audit-docs-link-graph.ts) — re-run with `pnpm tsx scripts/audit-docs-link-graph.ts`.

---

## Executive summary

| Metric | Value | Read |
| --- | ---: | --- |
| Pages | 274 | — |
| docs→docs edges | 660 | avg 2.41 in / 2.41 out per page |
| **Orphans** (0 inbound) | **53** (19.3%) | almost 1 in 5 pages has nothing pointing at it |
| **Dead-ends** (0 outbound) | **67** (24.5%) | almost 1 in 4 pages traps the reader |
| Low-inbound (1 inbound) | 64 | only the nav linked them |
| Unlinked API symbol mentions | **891** across 251 pages | huge contextual-link backlog |

The headline problem is **structural**, not cosmetic: the **`core`, `react`, and `migration` sections** are starved of both incoming and outgoing edges, while the extended packages (`adoption`, `checklists`, `media`, `scheduling`, `surveys`) have healthy graphs. The bad sections also happen to be your **MIT/free-tier pages and SEO landers** — so the linking gap is depressing both UX and topical authority where it matters most.

A `/docs/core/hooks/use-tour` page (the canonical reference for the main hook of the whole library) has **6 inbound and 0 outbound** docs-internal links. A reader who lands there cannot reach `TourProvider`, `useStep`, `useTours`, or a single example.

---

## The five structural problems

### 1. Reference pages are written as terminal leaves (67 dead-ends)

Every component / hook / utility MDX page documents itself and stops. None of them has a "Related" block at the bottom. Result: 47 of 67 dead-ends are in `core`/`react`/`hints`/`announcements/headless`/`api`.

**Examples:** `use-tour`, `use-step`, `use-spotlight`, `use-keyboard`, `use-persistence`, `tour-card`, `tour-step`, `tour-overlay`, `tour-close`, `tour-navigation`, `tour-progress`, `headless-card`, all six `announcements/headless/*` variants, all six `api/*` reference pages.

**Cost:** Every reference page is a session-killer — the reader has to bounce to the sidebar to keep going. SEO-wise, terminal pages drain PageRank instead of recirculating it.

### 2. Core & React sections have anaemic outbound density

| Section | Pages | Avg out | Avg in | Orphans | Dead-ends |
| --- | ---: | ---: | ---: | ---: | ---: |
| **core** | 33 | **1.24** | 1.58 | **13** | **18** |
| **react** | 26 | **1.15** | 1.46 | **10** | **17** |
| media (for comparison) | 17 | 4.00 | 4.00 | 2 | 0 |
| ai (for comparison) | 8 | 3.38 | 3.75 | 1 | 0 |

`media` and `ai` were authored more recently with cross-links built in. `core` and `react` were authored first and were never back-filled. They host the most-visited symbols in the whole library (`useTour`, `<Tour>`, `<TourCard>`), so this is the highest-leverage fix area.

### 3. Migration section is fully orphaned (SEO emergency)

```
migration  3 pages   3 orphans   2 dead-ends   avg out 0.33   avg in 0.00
```

`migration/joyride.mdx`, `migration/shepherd.mdx`, `migration/driver.mdx`: zero inbound docs links and either 0 or 1 outbound. These are commercial-intent pages ("react joyride alternative", "shepherd js alternative") that the rest of the docs treats as if they don't exist. They should be linked from `/docs/getting-started`, `/docs/index`, `/docs/react/components/tour`, and from each other.

### 4. The API reference is a hub the rest of the docs ignores — and that ignores the rest of the docs

`/docs/api` has **12 candidates** unlinked just for package names; `/docs/api/core` has **19 candidates** unlinked for hook/component/provider names. Every `### useTour` heading on `/docs/api/core` is the natural anchor for a link to `/docs/core/hooks/use-tour`, and vice versa — `use-tour.mdx` should point readers to the API summary. Right now neither direction exists.

Additionally, `/docs/api` itself is an orphan (0 inbound) — nothing in the docs body points there even though `meta.json` exposes it in the sidebar.

### 5. Index pages don't function as section hubs

Several section index pages are **both orphans and dead-ends** — they fail in both directions:

- `/docs/adoption` (orphan, 4 out)
- `/docs/ai` (orphan, 7 out)
- `/docs/api` (orphan, 9 out)
- `/docs/surveys` (orphan, 8 out)
- `/docs/use-cases` (orphan, 3 out)
- `/docs/licensing` (dead-end, 2 inbound)
- `/docs/react` (dead-end, 4 inbound)
- `/docs/core` (dead-end, 5 inbound)
- `/docs/react/headless` (dead-end, 4 inbound)
- `/docs/media/headless` (orphan, 1 outbound)
- `/docs/scheduling/utilities` (orphan, 8 outbound)
- `/docs/scheduling/components` (orphan, 2 outbound)

A section index should be the canonical inbound target for "all roads in this topic", and it should link out to every sibling. None of these do both.

---

## Recommended pattern — the "Related" block

The reason `media` and `ai` work and `core`/`react` don't is that the newer pages end with a deliberate "Related" block. Adopt this as a **mandatory section on every reference page**:

```mdx
## Related

- [`TourProvider`](/docs/core/providers/tour-provider) — provides the context this hook reads from.
- [`useStep`](/docs/core/hooks/use-step) — single-step variant for finer control.
- [`<Tour>` component](/docs/react/components/tour) — the declarative wrapper most apps use.
- [Persistence guide](/docs/guides/persistence) — how state survives reloads.
- [Quick start](/docs/getting-started/quick-start) — see this in context.
```

**Rules of thumb (apply per page):**

1. **One link to the parent section index.** (`use-tour` → `/docs/core/hooks` or `/docs/core`.)
2. **2–4 sibling links** to the closest peer pages — same directory.
3. **1–2 "next step" links** to the guide / example that uses this API.
4. **No "click here", no "read more"** — anchor text must be the destination's title or a verbatim API name.
5. **Inline prose links beat See-also dumps** for SEO weight, so prefer wiring API names in the running text and only use a Related block for what doesn't fit naturally.

---

## Prioritized action plan

### P0 — Fix the SEO-critical commercial pages (1 day)

These have zero authority flow today. Each gets ~30 min of work.

| Page | What to add |
| --- | --- |
| `/docs/migration/joyride` | Inbound from `/docs/index`, `/docs/getting-started/index`, `/docs/react`, `/docs/react/components/tour`. Outbound to `/docs/react/components/tour`, `/docs/core/hooks/use-tour`, `/docs/getting-started/quick-start`. |
| `/docs/migration/shepherd` | Same pattern, plus cross-links between the three migration pages ("migrating from Driver.js too?"). |
| `/docs/migration/driver` | Same pattern. |
| `/docs/getting-started/installation` | Add 2 outbound: to `/docs/getting-started/quick-start` (next step) and `/docs/getting-started/typescript`. Currently dead-end. |
| `/docs/getting-started/typescript` | Outbound to `/docs/core/types`, `/docs/react/types`. Currently dead-end. |
| `/docs/licensing` | Outbound to `/docs/licensing/trial` and to the protected packages (`/docs/adoption`, `/docs/analytics`, etc.). |
| `/docs/licensing/trial` | Inbound from `/docs/licensing` (already there via index?) — verify; outbound to the Pro-tier packages. |

### P1 — Build hub→leaf reciprocity in core/react/hints (1–2 days)

For each of the **35 reference pages** in core/react/hints listed below, add a `## Related` block with 3–5 links per the template above. Group the work by section to keep context cheap.

**Core hooks** (14 pages): `use-advance-on`, `use-branch`, `use-direction`, `use-element-position`, `use-focus-trap`, `use-keyboard`, `use-media-query`, `use-persistence`, `use-route-persistence`, `use-spotlight`, `use-step`, `use-tour`, `use-tour-context`, `use-tour-kit-context`.

**Core providers + utilities** (13 pages): all of `core/providers/*` and `core/utilities/*`.

**React components** (7 dead-ends): `tour`, `tour-card`, `tour-step`, `tour-overlay`, `tour-navigation`, `tour-progress`, `tour-close`.

**React headless / styling** (5 pages): `headless-card`, `headless-overlay`, `examples`, `custom-components`, `tailwind`.

Each Related block must:
- Link to the section index (`/docs/core/hooks`, etc.).
- Link to the 2 most-related siblings (e.g. `use-tour` ↔ `use-step` ↔ `use-tour-context`).
- Link to the guide or example that demos the API (`/docs/guides/persistence` for `use-persistence`, `/docs/examples/basic-tour` for `useTour`).

### P2 — Convert the API reference into a true two-way hub (½ day)

The `/docs/api/*` pages are pure API-shape walls of TypeTables. They contain **the densest cluster of un-linked symbol mentions in the whole docs** (~100 in 6 pages).

For each `/docs/api/{core,react,hints,adoption,analytics,announcements,checklists,media,scheduling,surveys}` page:
1. Wrap every `### {SymbolName}` heading with a link to the dedicated page (e.g. `### [useTour](/docs/core/hooks/use-tour)`).
2. Add a top-of-page "Full reference for `@tour-kit/{pkg}`" callout linking to `/docs/{pkg}`.
3. Add a bottom-of-page "Back to API index" link to `/docs/api`.

Then on every dedicated page, add an inline "See full API reference for [`@tour-kit/core`](/docs/api/core)" near the top. This builds the two-way `/docs/api/{pkg}` ↔ `/docs/{pkg}/{symbol}` cluster Google rewards.

### P3 — Index pages as section hubs (½ day)

For each of the 12 index pages flagged above:
- Verify it has a `<Cards>` grid linking to every subpage in its section. (Some do; most don't.)
- Add a "Related sections" Cards row linking to 2–3 adjacent packages (e.g. `/docs/adoption` → "See also: `/docs/analytics`, `/docs/checklists`").
- For Pro packages, link to `/docs/licensing`.

### P4 — Natural-link sweep over the prose (1 day, optional)

The 891 unlinked symbol mentions outside the API pages are mostly in guides and overviews. Walk the top-20 pages-with-candidates from [`docs-link-graph.md`](./docs-link-graph.md) and convert mentions of `useTour`, `<TourCard>`, etc. into inline links. Stop once each page has 5 contextual links — beyond that you hit diminishing returns and the prose starts to look like a link farm.

---

## Patterns worth keeping (don't break what works)

The script also surfaces what's working — preserve these when editing:

- **`media`** is the gold-standard section: avg 4 out / 4 in, 0 dead-ends, 2 orphans. Every component page cross-links to its peers and to the section index. Use it as the template.
- **Top hubs to protect:** `use-checklist`, `tour-media`, `scheduling/types`, `surveys/types`, `use-announcement`, `analytics/plugins`, `analytics/providers`, `guides/accessibility`, `guides/persistence`, `guides/nextjs`. These already pull double-digit inbound and should keep doing so — any refactor of these URLs needs to update the inbound links in lockstep.

---

## Guardrails — keep this from regressing

1. **Tighten the existing audit script's threshold.** `scripts/audit-internal-links.ts` runs in CI at `--min=3`; raise to `--min=4` once P1 is done. Add an additional check that no page may have **0 outbound** docs links.
2. **Add a CI step that runs `audit-docs-link-graph.ts`** and fails if `orphans > 30` or `deadEnds > 20`. This catches regressions when new pages are added without Related blocks.
3. **Update the docs-writer agent template** (`.claude/agents/docs-writer.md`) to require a `## Related` block on every reference page with ≥3 links. Add the rules-of-thumb above as a checklist.
4. **Convention for new pages:** if you add `content/docs/{pkg}/{kind}/foo.mdx`, you also (a) add an inbound link from the section index `<Cards>` grid, (b) add a Related block with at least one peer + section-index link.

---

## What I'd do first if you have 90 minutes

1. Fix the three migration pages (P0, ~30 min). They're commercial-intent and currently leak 100% of acquired authority.
2. Add Related blocks to **just `use-tour`, `tour-card`, and `tour-step`** (P1, ~30 min). Those are the three most-trafficked pages in the docs and they're all dead-ends.
3. Wire the headings on `/docs/api/core` into links to the dedicated hook pages (P2, ~30 min). Highest density of natural-link candidates anywhere in the docs.

That's a ~3× improvement to the inbound count of `use-tour` and the three core React component pages, and converts the migration section from "SEO black hole" to "linked landers" — all in one focused sitting.
