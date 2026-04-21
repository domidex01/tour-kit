---
title: SEO & GEO Shipped
type: gtm
sources:
  - ../../reports/SEO-SYNTHESIS-20260419.md
  - ../../reports/SEO-SYNTHESIS-20260419-RERUN.md
  - ../../apps/docs/lib/structured-data.tsx
  - ../../apps/docs/lib/entities.ts
  - ../../apps/docs/lib/blog.ts
  - ../../apps/docs/scripts/check-mdx-freshness.ts
  - ../../apps/docs/scripts/generate-llm-files.ts
updated: 2026-04-20
---

*Audit-driven technical SEO fixes and GEO (Generative Engine Optimization) wiring. Complements the content strategy with on-page and schema-layer improvements.*

## SEO audit journey

| Date | Event | Score |
|---|---|---|
| 2026-04-19 (AM) | Baseline SEOmator audit, 50 pages | 68.1 / D |
| 2026-04-19 (mid) | P0 fixes (canonical, www-redirect, og:url, duplicate-H1) | — |
| 2026-04-19 (PM) | Rerun, 4 segmented crawls × 240 pages | 95–96 / A |

**Score jump:** 68.1 → 95 (+27 pts). Category-weight ceiling limits further gains above 95 without tackling perf (12%), EEAT, social, and schema at once.

### Rule-level deltas (2026-04-19 rerun vs baseline)

| Rule | Δ | Notes |
|---|---|---|
| `core-canonical-present` | −93% | 16 listing/pagination URLs still failing |
| `technical-www-redirect` | −93% | Same residual set |
| `social-og-url` | −63% | 17 URLs remain |
| `core-h1-single` | −98% | Fumadocs duplicate H1 fix landed |
| `social-og-image` | +57% ⚠ | Regression on listing/category/pagination |
| `content-keyword-stuffing` | new 82 URLs | Mostly false positives on cards |

Full rerun report: [`reports/SEO-SYNTHESIS-20260419-RERUN.md`](../../reports/SEO-SYNTHESIS-20260419-RERUN.md).

### Residual P0 (unshipped)

1. Canonical + www-redirect on 16 listing URLs (`/`, `/compare`, `/blog/page/N`, `/blog/category/*`, `/compare/*`, `/llms.txt`).
2. Default `og:image` fallback in `layout.tsx` for listing routes.
3. CSP report-only → enforce.
4. `datePublished` missing on 29 docs article schemas.
5. Pre-existing `/blog` prerender failure blocking `pnpm --filter docs build` (Next canary + React canary `useMemo` null on `Image`). Unrelated to GEO work.

## GEO shipped (2026-04-20)

Six GEO improvements to help AI search engines (ChatGPT, Perplexity, Google AI Overviews, Claude) correctly cite usertourkit.com. **5 of 6 complete**; Task 1 awaits author-data confirmation.

| # | Task | Status | Files |
|---|---|---|---|
| 1 | E-E-A-T author schema extension | plumbed, values pending | `lib/authors.ts`, `lib/structured-data.tsx` |
| 2 | HowTo schema on tutorial articles | shipped | `lib/blog.ts`, `app/blog/[slug]/page.tsx` |
| 3 | Entity mentions on articles | shipped | `lib/entities.ts`, `lib/structured-data.tsx`, `app/blog/[slug]/page.tsx` |
| 4 | Speakable schema | shipped | `lib/structured-data.tsx`, `hero.tsx`, `article-layout.tsx`, `app/page.tsx`, `app/blog/[slug]/page.tsx` |
| 5 | `dateModified` freshness check | shipped | `scripts/check-mdx-freshness.ts`, `package.json` |
| 6 | `llms.txt` CI regeneration | verified (already wired) | `package.json` prebuild → `scripts/generate-llm-files.ts` |

### Task details

**1. E-E-A-T author schema.** `ArticleJsonLd` accepts `authorLinkedin`, `authorX`, `authorJobTitle`, `authorKnowsAbout`. `Author` interface extended with optional `x?`, `jobTitle?`, `knowsAbout?`. Values for domidex01 not filled in — LinkedIn URL, X URL, jobTitle, knowsAbout topics need human confirmation before emission.

**2. HowTo schema.** `getHowToFromMdx(slug)` extracts step H2s from tutorial articles. Matches `## Step N:`, `## Step N —`, `## Step N -`, `## Step N …`, `## 1. …`. Gated by slug regex `^(add-|how-|migrate-|setup-|build-|integrate-)` OR `schema_type: HowTo` frontmatter. Skips emission when `steps.length < 2` (Google minimum).

Verified on 11 candidate slugs — examples: `add-product-tour-react-19` → 5 steps, `migrate-react-joyride-tour-kit` → 5 steps, `ai-onboarding-future` → null (correctly skipped).

**3. Entity mentions.** Registry of 14 tools (7 OSS with GitHub URLs, 7 commercial SaaS with corporate sites). `findMentionedEntities(body)` uses case-insensitive word-boundary regex, caps at 10. Emits into `mentions` array on `ArticleJsonLd`.

| Type | Count | Entities |
|---|---|---|
| OSS | 7 | React Joyride, Shepherd.js, Driver.js, Intro.js, Reactour, Onborda, OnboardJS |
| SaaS | 7 | Appcues, Pendo, WalkMe, Userpilot, Chameleon, Whatfix, Userflow |

Verified on `replace-intro-js-react.mdx` → Shepherd.js + Intro.js; `best-appcues-alternatives-developers.mdx` → 6 tools.

**4. Speakable schema.** `SpeakableJsonLd({ url?, cssSelectors })` emitter. `data-speakable="headline"` + `data-speakable="summary"` on hero H1/subhead and article header. Emitted on homepage + every blog article. Tells voice assistants which spans to read aloud.

**5. `dateModified` freshness check.** `pnpm --filter docs check:freshness` — Node script that diffs MDX body between a git base ref (default `origin/main`) and working tree. Warns when body changed but `lastUpdated` frontmatter didn't. Never mutates, exit 0 always. Intended for local pre-commit and CI.

**6. `llms.txt` CI regeneration.** Already wired: `"prebuild": "pnpm generate:llm"` in `apps/docs/package.json` regenerates `public/llms.txt` + `public/llms-full.txt` on every build. Manual run via `pnpm --filter docs generate:llm`.

### Files changed

```
M apps/docs/app/blog/[slug]/page.tsx          Tasks 2/3/4 wiring
M apps/docs/app/page.tsx                       Task 4 homepage
M apps/docs/components/landing/hero.tsx        Task 4 data-speakable attrs
M apps/docs/components/article/article-layout.tsx  Task 4 data-speakable attrs
M apps/docs/lib/blog.ts                        Task 2 getHowToFromMdx
M apps/docs/lib/structured-data.tsx            Tasks 1/3/4 schema extensions
M apps/docs/lib/authors.ts                     Task 1 optional fields
M apps/docs/package.json                       Task 5 check:freshness entry
A apps/docs/lib/entities.ts                    Task 3 entity registry
A apps/docs/scripts/check-mdx-freshness.ts     Task 5 freshness checker
```

Constraints honored: TypeScript strict, no `any`, no new runtime deps, no MDX content regenerated. `pnpm --filter docs typecheck` passes.

## Gaps / open questions

- **Task 1 author data** — LinkedIn, X, jobTitle, knowsAbout for domidex01 still required. Type surface ready; blocked on values.
- **`llms.txt` blog coverage** — `generate-llm-files.ts` currently scans only `content/docs/**`, not `content/blog/**`. Blog articles do not flow into `llms.txt`. Follow-up to decide whether to extend.
- **QAPage schema** — deliberately skipped (FAQPage already covers).
- **DefinedTerm glossary** — deliberately skipped (no glossary page exists).
- **Reviews / aggregateRating** — deliberately skipped (policy risk without verified review data).

## Related

- [gtm/seo-content-strategy.md](seo-content-strategy.md) — Keyword strategy and content pillars
- [gtm/content-calendar.md](content-calendar.md) — 12-week content cadence
- [competitors/index.md](../competitors/index.md) — Source of the entity-mentions registry
- [roadmap.md](../roadmap.md) — Where SEO/GEO sits in execution
