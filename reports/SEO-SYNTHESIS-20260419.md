# SEO Audit Synthesis — usertourkit.com
**Date:** 2026-04-19
**Tool:** SEOmator 3.0.0 (251 rules, 20 categories)
**Scope:** 4 segmented crawls — landing (20), compare (20), docs (100), blog (100) = **240 page instances**
**CWV:** Skipped (no Chrome available — `--no-cwv`)

## Scores at a glance

| Segment | Overall | Weakest categories |
|---|---|---|
| Landing (20 pg) | **95 / A** | eeat 83, social 84, perf 87, schema 91 |
| Compare (20 pg) | **95 / A** | eeat 84, perf 86, social 86, schema 93 |
| Docs (100 pg) | **95 / A** | eeat 84, perf 85, social 87, geo 90 |
| Blog (100 pg) | **95 / A** | eeat 84, perf 85, social 87, geo 90 |

**Baseline improvement:** the memory #163 baseline (2026-02 audit) scored **68.1 (D)**. Current **95 (A)** → substantial gains, likely from fixes since then. But **the 231 warnings persist** and the specific failure clusters have shifted.

---

## P0 — Ship this week (site-template, one-line fixes per ~100 pages)

### 1. Missing canonical tag → 85+ pages per section
**Rule:** `core/core-canonical-present`
**Failing:** /, /docs, /docs/api, /blog, /blog/*, /compare, /compare/*, /pricing — effectively all pages.
**Fix:** Add `<link rel="canonical">` in `apps/docs/app/layout.tsx` (or per-route `generateMetadata`). Use `metadata.alternates.canonical`.
```ts
// apps/docs/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://usertourkit.com'),
  alternates: { canonical: '/' }, // override per-page via generateMetadata
};
```

### 2. Both www and non-www resolve → 83+ pages per section
**Rule:** `technical/technical-www-redirect`
**Evidence:** `https://usertourkit.com` and `https://www.usertourkit.com` both return 200.
**Fix:** Vercel domain config — set `www.usertourkit.com` to **301 redirect** to `usertourkit.com` (or vice-versa). Pick one canonical host.

### 3. Missing `og:url` on 46+ pages (docs + blog)
**Rule:** `social/social-og-url`
**Fix:** Add to Next `metadata.openGraph.url` per page; derive from canonical URL.

### 4. Missing `og:image` on 30 pages (blog + compare)
**Rule:** `social/social-og-image`
**Evidence:** Primarily new blog posts + compare pages lacking OG images.
**Fix:** Run `og-image-composer` skill for the 30 affected slugs, then set `metadata.openGraph.images`.

### 5. `/pricing` and `/docs/core/types` have **NO `<h1>`**
**Rule:** `core/core-h1-present`
**Fix:** Add H1 to these pages. `/pricing` is especially critical (core conversion page).

### 6. Duplicate H1 on docs index pages (memory #165)
**Rule:** `core/core-h1-single` (warn in 46 docs pages)
**Pages:** `/docs`, `/docs/api`, `/docs/examples`, `/docs/core`, `/docs/getting-started`, some blog posts (e.g. `/blog/add-product-tour-react-19`).
**Root cause:** Fumadocs `<DocsTitle>` renders `<h1>`, and MDX content adds another `#` H1.
**Fix:** Either remove Fumadocs' DocsTitle (and rely on MDX H1) or audit MDX to strip leading `#` heading — see `apps/docs/CLAUDE.md` for convention.

### 7. Content-Security-Policy in report-only mode → 100% of pages
**Rule:** `security/security-csp` (warn)
**Fix:** Change `Content-Security-Policy-Report-Only` header to `Content-Security-Policy` in `next.config.ts` / middleware once violations are triaged.

### 8. robots.txt syntax error → site-wide
**Rule:** `technical/technical-robots-txt-valid` (warn on every page)
**Fix:** Open `apps/docs/app/robots.ts` (or `public/robots.txt`) and fix the 1 syntax issue flagged.

---

## P1 — High value, scoped fixes

### 9. Hero images use `loading="lazy"` → LCP tanking on 21 blog posts
**Rules:** `perf/perf-lazy-above-fold`, `perf/perf-lcp-hints`
**Affected:** `/blog/add-product-tour-react-19`, `/blog/tour-kit-vs-react-joyride`, etc. (header img).
**Fix:** For the first/hero image in blog layout, use `priority` in `next/image` or `loading="eager"` + `fetchPriority="high"`. Likely in `apps/docs/components/article/article-layout.tsx`.

### 10. Mobile horizontal scroll → 33 blog + docs pages
**Rule:** `mobile/mobile-horizontal-scroll` ("10–20 elements that may cause horizontal scrolling")
**Fix:** Audit wide code blocks, tables, diagrams — add `overflow-x-auto` wrappers; check `<pre>`, `<table>`, wide images on mobile.

### 11. Missing `datePublished` on Article/TechArticle schema → 29 docs pages
**Rule:** `schema/schema-article`
**Fix:** Add `datePublished` (and `dateModified`) to the JSON-LD schema generator for docs layout. Blog likely already has this — docs layout is missing it.

### 12. AI bot access blocked in robots.txt (5/9 bots) → site-wide
**Rule:** `geo/geo-ai-bot-access` (warn)
**Blocked:** GPTBot, Google-Extended, CCBot, Bytespider, Amazonbot
**Tension:** This contradicts GEO / AI-readiness strategy. **Decision needed** — if you want AI indexing (llms.txt + AI search citations), unblock at least GPTBot + Google-Extended. If intentional, leave.

### 13. Meta descriptions too wide (pixel width truncates in SERP)
**Rule:** `content/content-description-pixel-width` — 22 pages
**Evidence:** "estimated 1167px (max ~920px)"
**Affected:** `/compare`, several blog posts
**Fix:** Shorten descriptions to ~150–160 chars and avoid wide chars (em-dashes, etc.).

### 14. Blog category URLs have spaces + uppercase
**Rule:** `technical/technical-url-structure` + `url/url-spaces`
**Examples:** `/blog/category/Build%20vs%20Buy`, `/blog/category/Comparison`, `/blog/category/Industry%20Guides`
**Fix:** Slugify category names to lowercase-with-hyphens in `apps/docs/app/blog/category/[category]/page.tsx` — e.g. `build-vs-buy`, `industry-guides`.

### 15. Page weight + inline JS budgets exceeded
**Rules:** `perf/perf-page-weight` (HTML 321KB > 100KB), `perf/perf-js-file-size` (202KB inline JS / 48 scripts > 50KB)
**Scope:** 28 pages
**Fix:** Next.js RSC payload is inflating HTML. Check for client components that could be server-rendered; reduce MDX compiled size; audit `/docs/api` and `/docs/guides/accessibility` first (largest).

### 16. DOM size too large
**Rule:** `perf/perf-dom-size` (1,500–2,000 nodes vs 800 target)
**Worst:** `/docs/guides/accessibility` (2,035 nodes).
**Fix:** Paginate or collapse long content; lazy-render below-fold sections.

### 17. Broken internal link (1 link, cited 20× across crawls)
**Rule:** `links/links-broken-internal`
**Fix:** Find it — likely a nav/footer link since it appears on every page. Grep `apps/docs/components/landing/footer.tsx` and layout files.

---

## P2 — Long tail / E-E-A-T & housekeeping

| # | Issue | Count | Fix |
|---|---|---|---|
| 18 | No privacy-policy link | 100% | Add to footer |
| 19 | No social profile links | 100% | Add GitHub/Twitter/etc. in footer |
| 20 | Only 1 contact method | 100% | Add email/contact form link |
| 21 | No about page link | 100% | Already exists? Link from footer |
| 22 | No social share buttons | 100% | Blog has `share-buttons.tsx` — verify rendering |
| 23 | 0–2 ARIA landmark regions | 100% | Add `<main>`, `<nav>`, `<header>`, `<footer>` semantic wrappers |
| 24 | Sitemap orphans (94–98%) | site-wide | 466+ sitemap URLs not linked from any crawled page — may be stale sitemap or deep content |
| 25 | Keyword stuffing flagged | 78+ pages | Review pages with ≥6 high-density keywords |
| 26 | 8 link-text a11y issues | 16 pages | "Click here", "read more" → descriptive text |
| 27 | HTML size >500KB | 7 pages | `/blog/migrate-driver-js-tour-kit`, `/docs/guides/accessibility` |
| 28 | HTML structure issues | `/docs/guides/accessibility` | Fix broken HTML |
| 29 | Thin content 0 words | `/docs/core/types` | Page is essentially empty |
| 30 | Render-blocking script in `<head>` | 99% | Add `defer`/`async` or move to body |
| 31 | Cache-control header ineffective | 100% | Review Vercel cache headers |
| 32 | Lingering deprecated Lucide icons | share-buttons.tsx | Replace `Twitter`, `Linkedin` (from today's diagnostics) |

---

## Shifts vs 2026-02 baseline (memory #163)

| Baseline failure cluster | Status 2026-04-19 |
|---|---|
| Missing CSP header (49 pages) | ✅ Fixed — now CSP is present, just in report-only mode (warn) |
| Missing canonical tags (46 pages) | ❌ **Regressed** — now 85+ pages per segment fail |
| Missing OG tags (44 pages) | ⚠️ Partial — og:url still missing on 46 pages, og:image on 30 |
| Short titles (27 pages) | Not flagged in top-20 — likely fixed |
| Duplicate H1 on docs pages (26) | ❌ Still present — 46 docs pages have duplicate H1 (memory #165) |
| Short descriptions (26 pages) | Replaced by _too long_ (22 pages exceed pixel width) |

---

## Recommended execution order

1. **Day 0 (this week):** items 1–8 — all template/config fixes, high impact, ~1 day of work
2. **Day 1–2:** items 9–11 + 15/16 — perf wins on blog/docs
3. **Day 3:** items 12 (AI bot decision), 13, 14 — content/URL hygiene
4. **Week 2:** E-E-A-T (18–22), a11y landmarks (23), long-tail

**Gains to expect after P0:** ~95 → 97+. The remaining 3 pts are concentrated in E-E-A-T (trust signals) and perf (CWV — which we couldn't measure without Chrome).

---

## Raw reports (for re-analysis)

- `reports/seo-landing-20260419-172701.json` (2.3MB)
- `reports/seo-compare-20260419-172708.json` (2.3MB)
- `reports/seo-docs-20260419-172706.json` (12MB)
- `reports/seo-blog-20260419-172707.json` (12MB)

Analysis scripts: `reports/analyze.js`, `reports/h1-check.js`
