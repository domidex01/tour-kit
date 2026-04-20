# Log

Append-only. Most recent at the bottom. `grep "^## \[" log.md | tail` for a quick timeline.

## [2026-04-19] scaffold | Wiki initialized

Created the wiki skeleton under `/home/domidex/projects/tour-kit/wiki/`. Directories: product, brand, audience, market, competitors (with oss/ and saas/ subdirs), gtm, content, sources. Wrote `CLAUDE.md` schema, `README.md`, `index.md` skeleton, and this log.

## [2026-04-19] ingest | First pass on pillar files

Ingested the context summary files from `../marketing-strategy/` (manifest.md, tourkit-product.md, tourkit-brand.md, tourkit-icps.md, positioning.md, tone-and-voice.md, go-to-market.md, competitive-landscape.md, market-analysis.md) and the root `../CLAUDE.md`. Created pillar pages across product/, brand/, audience/, market/, competitors/, gtm/. These are high-density summaries; detailed strategy files (marketing-strategy/00-10-*.md, launch-copy-kit.md, content-templates.md, content-calendar.md, launch-checklist.md, Articles/, landing-pages/) remain to ingest in a second pass.

## [2026-04-19] ingest | Second pass — tactical GTM, content plan, new competitors, docs map

**New wiki pages (14):**

- gtm/launch-checklist.md, gtm/launch-copy-kit.md, gtm/content-calendar.md, gtm/content-templates.md, gtm/shipping-plan.md — tactical execution docs from `../marketing-strategy/`
- competitors/saas/userpilot.md, competitors/saas/userflow.md — two new SaaS competitors from `Articles/competitors/` (incl. the Usertour.io category-confusion risk)
- content/article-ideas.md — 75-article master list
- content/landing-pages.md — 12 landing page index
- content/styleguide.md — homepage visual system from `apps/docs/STYLEGUIDE.md`
- content/comparison-template.md — verbatim template
- content/comparison-drafts.md — 13 TourKit-vs-X drafts index
- content/competitor-articles.md — 14 long-form competitor research articles index
- sources/docs-content.md — structure map of `apps/docs/content/`
- sources/300-article-plan.md — pointer to the `.xlsx` SEO plan

**Updated:** competitors/index.md (added Userpilot + Userflow entries), index.md (full rewrite with new sections).

**What's NOT deeply ingested (still raw sources):**

- `../marketing-strategy/00-10-*.md` — long-form versions of context summaries already ingested (positioning, voice, ICPs, competitors, GTM). Low marginal value; check in a later lint pass for any detail missed.
- The 14 full competitor articles in `Articles/competitors/` — research depth preserved as sources only. Userpilot and Userflow got full wiki pages (highest-value for new competitive ground). Others enriched existing pages.
- The 13 comparison drafts in `Articles/drafts/` — referenced but not duplicated. They *are* the content.
- The 12 landing-page drafts in `landing-pages/` — indexed; full copy in-place in source.
- `../marketing-strategy/tour-kit-300-articles.xlsx` — binary, requires CSV export to ingest.

**Counts:** 53 markdown files in wiki, 7 directory sections (product, brand, audience, market, competitors, gtm, content, sources).

## [2026-04-19] ingest | Additions — roadmap, glossary, migration guides, thesis page

**New wiki pages (7):**

- `roadmap.md` (top-level) — fuses marketing roadmap (5 phases, 23 docs) with product launch sequence (Supabase-style multi-launch). Tracks current status vs plan.
- `glossary.md` (top-level) — shared vocabulary across product concepts, marketing/business terms, technical terms, and naming conventions.
- `why-tourkit-wins.md` (top-level) — single-page thesis. Fuses positioning + market + competitors + timing + economics. Quarterly re-read anchor.
- `migration/index.md` — overview + publication workflow for migration guides.
- `migration/from-react-joyride.md` — **P0**. Side-by-side API migration, feature mapping, pitfalls.
- `migration/from-appcues.md` — P0. ROI math, feature mapping (including segmentation → feature flags), PM-handoff notes.
- `migration/from-shepherd-js.md` — P1. Drop-AGPL angle, imperative → declarative API.
- `migration/from-intro-js.md` — P1. Legacy DOM attributes → React composition.

**Updated:** `index.md` (new Entry-points section with 3 top-level pages; new Migration section).

**Counts:** 61 markdown files, 9 directory sections (added `migration/`).

## [2026-04-20] ingest | SEO audit + GEO improvements shipped

**New wiki page (1):**

- `gtm/seo-geo-shipped.md` — documents the 2026-04-19 SEO audit journey (baseline 68.1/D → rerun 95–96/A across 240 pages) and the GEO (Generative Engine Optimization) work shipped 2026-04-20: 5 of 6 tasks complete (HowTo schema, entity mentions, Speakable schema, `dateModified` freshness check, `llms.txt` CI regeneration verified). Task 1 (E-E-A-T author schema) plumbed but awaits LinkedIn/X/jobTitle/knowsAbout values for DomiDex.

**Updated:** `index.md` (GTM section entry).

**Implementation footprint (in `apps/docs/`):**
- Added: `lib/entities.ts` (14-entity registry), `scripts/check-mdx-freshness.ts`
- Modified: `lib/structured-data.tsx` (added `SpeakableJsonLd`, extended `ArticleJsonLd` with author E-E-A-T fields and `mentions`), `lib/blog.ts` (`getHowToFromMdx`, `readMdxBody`), `lib/authors.ts` (optional `x`, `jobTitle`, `knowsAbout`), `app/blog/[slug]/page.tsx`, `app/page.tsx`, `components/landing/hero.tsx`, `components/article/article-layout.tsx` (`data-speakable` attrs), `package.json` (`check:freshness` script).

**Open gaps:** author data pending; `scripts/generate-llm-files.ts` still scans only `content/docs`, not `content/blog`; pre-existing `/blog` prerender failure (Next canary `useMemo` null on `Image`) blocks `pnpm build` — unrelated to GEO work.

**Counts:** 62 markdown files.

## [2026-04-20] content-gen | SEO P0 residual fixes from rerun audit

Worked the P0 list from `reports/SEO-SYNTHESIS-20260419-RERUN.md`. Most items were already shipped in commit `e841a13` (canonicals + og:image + www-redirect on /, /compare, /compare/[slug], /blog, /blog/page/N, /blog/category/*; CSP enforced not report-only). The audit predates the deploy.

**Two real residual gaps closed:**

1. **`/llms.txt` + `/llms-full.txt` canonical** — static text files cannot use HTML `<link rel="canonical">`. Added `Link: <…>; rel="canonical"` HTTP header in `apps/docs/next.config.mjs` `headers()`.
2. **`datePublished` missing on 29 docs schemas** — root cause: `_page-logic.tsx` returned `undefined` when `page.absolutePath` was missing (e.g. shallow git clone on Vercel). Fix:
   - `lib/git-dates.ts` — exported `SITE_LAUNCH_FALLBACK`, made `getGitLastModified` fall back to it instead of `new Date()` (build-time timestamps stop drifting on every deploy).
   - `app/docs/_page-logic.tsx` — fall back to `SITE_LAUNCH_FALLBACK` when `absPath` is unavailable.
   - `lib/structured-data.tsx` — `TechArticleJsonLd` now always emits `datePublished` (defaults to `2025-01-01`) and a `dateModified` (defaults to `datePublished`).

**No-op items (already correct):** CSP enforcement, www→apex 301, all 16 listed routes already had `metadata.alternates.canonical` and `openGraph.images`. Vercel domain config is environment, not code.

`pnpm --filter docs typecheck` clean.

## [2026-04-20] content-gen | SEO P1 — keyword stuffing + mobile scroll + perf

Worked the P1 list from `reports/SEO-SYNTHESIS-20260419-RERUN.md` (target: lift score to ~98).

**P1.6 — keyword stuffing (82 URLs, mostly listing/card false positives):**
- Dropped `year: 'numeric'` from card dates in `blog-list-page.tsx`, `article-card.tsx`, and `app/blog/category/[category]/page.tsx`. Cards now show "Apr 19" instead of "Apr 19, 2026" — kills repeated-token pattern.
- Expanded `/blog` hero intro from 29 → ~110 words (covers categories + audience).
- New `CATEGORY_INTROS` registry in `lib/blog.ts` with 80–120 word paragraphs for 16 categories (Build vs Buy, Comparisons, Deep-Dives, GEO, Glossary, Industry, Industry Guides, Integrations, Listicle/Listicles, Metrics/Metrics & Analytics, Pillar Pages, Thought Leadership, Tutorial/Tutorials, Use Cases). Wired via `getCategoryIntro()` into the category page.
- Expanded `/compare` and `/alternatives` headers to ~120-word intros covering trade-offs and migration framing.

**P1.7 — mobile horizontal scroll (33 blog pages):**
- New `lib/mdx-overrides.tsx` exporting `articleMdxComponents`. Wraps MDX `<table>` in `<div className="not-prose my-6 w-full overflow-x-auto">`.
- Wired into `app/blog/[slug]/page.tsx`, `app/compare/[slug]/page.tsx`, and `app/alternatives/[slug]/page.tsx` (replaced raw `defaultMdxComponents`).
- Defensive `html, body { overflow-x: clip; }` added to `globals.css` so any rogue wide element gets clipped at viewport without disabling inner scroll containers.

**P1.8 — performance pass:**
- Converted `components/landing/packages.tsx` from `'use client'` → server component. Removed `useReveal` hook + IntersectionObserver + `useEffect/useRef/useState` imports. Dropped dead `animate-fade-in-up` class (no keyframes ever defined per `STYLEGUIDE.md`) and `opacity-0 → animate-fade-in-up` toggle. Cards now render statically — smaller client bundle on `/`.
- Added `loading="eager" decoding="async" fetchPriority="high"` to LCP background `<img>` in `components/landing/hero.tsx` and the blog hero in `blog-list-page.tsx` + category page.
- Added `loading="lazy" decoding="async"` to below-fold CTA bg images in `app/page.tsx`.
- Verified fonts already use `next/font` (Geist Sans + Mono via `geist/font`) — no manual preload needed.
- Verified all `<Image>` instances have `sizes` prop (or fixed `width`/`height`).
- Verified `DemoTour`, `ComparisonTable`, `SocialProof` already `dynamic()`-loaded with skeleton placeholders.

**Skipped:** Hero stays `'use client'` (auto-cycling demo + positioned tooltip is genuinely interactive — splitting into shell + client island is out-of-scope). `pain-points.tsx` is dead code (not imported), no bundle impact. Bundle analyzer dive deferred (would need `next build` + `.next/analyze` output to act on).

`pnpm --filter docs typecheck` clean.
