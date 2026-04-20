---
title: SEO Audit Rerun — usertourkit.com
date: 2026-04-19
tool: SEOmator 3.0.0 (251 rules, 20 categories)
scope: 4 segmented crawls — landing (20), compare (20), docs (100), blog (100) = 240 page instances
cwv: Skipped (no Chrome — `--no-cwv`)
---

# SEO Rerun Delta vs Baseline (same-day)

## Overall scores

| Segment | Baseline (AM) | Rerun (PM) | Δ |
|---|---|---|---|
| Landing (20 pg) | 95 / A | **96 / A** | **+1** |
| Compare (20 pg) | 95 / A | 95 / A | 0 |
| Docs (100 pg) | 95 / A | 95 / A | 0 |
| Blog (100 pg) | 95 / A | 95 / A | 0 |

**The projected "95 → 97+" gain did not land** — scores are flat. Three theories for why the top-level number barely moved:

1. Category weights are the constraint: perf (12%) and content/eeat/social/schema together cap the score. The warning counts in those categories are huge (e.g. 949 perf warns across docs) and those bring the category score down.
2. Big P0 fixes below are real but they replace old fails with *new* fails surfaced once the easier ones cleared.
3. The audit already ran with in-progress fixes — the "AM" baseline and the "PM" rerun reflect the same site state.

## Rule-level deltas (failing page count)

| Rule | Baseline fails | Rerun fails | Δ | Notes |
|---|---|---|---|---|
| `core-canonical-present` | ~240 (all) | **16 URLs** | −93% | Remaining: `/`, `/compare`, `/llms.txt`, `/blog/page/N`, `/blog/category/*`, `/compare/*` |
| `technical-www-redirect` | ~240 (all) | **16 URLs** | −93% | Same set — still both `www.` and non-`www.` respond 200 on these routes |
| `social-og-url` | 46+ | **17 URLs** | −63% | Blog listing + pagination + compare listing |
| `core-h1-single` | 46+ docs | **1 URL** | −98% | Only `/llms.txt` flagged — Fumadocs duplicate H1 fix shipped |
| `core-h1-present` | `/pricing`, `/docs/core/types` | **1 URL** | −50% | Only `/llms.txt` remains |
| `social-og-image` | 30 | **47 URLs** | **+57%** ⚠ | Regression — more listing/category/pagination pages now flagged |
| `content-keyword-stuffing` | — | **82 URLs** | new | Listing + docs/blog root pages — new or newly-visible |
| `mobile-horizontal-scroll` | 33 | **33 URLs** | 0 | No change — still wide code/tables in blog/docs |
| `perf-page-weight` / `perf-js-file-size` | — | 64 / 66 | — | Weight-heavy perf category dragging scores |

## What shipped (derived from deltas)

✓ Canonical tags on most content pages
✓ www→apex redirect on most content pages
✓ `og:url` on most pages
✓ Fumadocs duplicate H1 stripped from 46 docs pages
✓ H1 added to `/pricing`

## What's still broken (priority order)

### P0 — quick wins

1. **Canonical + www-redirect on 16 listing/pagination URLs**
   Pages: `/`, `/compare`, `/blog/page/N`, `/blog/category/*`, `/compare/*`, `/llms.txt`
   Fix: add `metadata.alternates.canonical` in the corresponding `page.tsx`/`generateMetadata`. Verify Vercel domain config covers these paths.
2. **`og:image` regression — 47 unique URLs** (listings, categories, pagination)
   Fix: add a default OG image to `layout.tsx` so listing routes fall back to it; keep per-post OG overrides.
3. **`og:url` on 17 listing/pagination URLs**
   Same root cause as #1 — derive from canonical.

### P1 — content/perf cleanup

4. **Keyword stuffing on 82 pages** (`content-keyword-stuffing`)
   Likely repeated terms in titles/descriptions/H1 on listing pages. Audit `/blog`, `/docs`, category pages for term repetition.
5. **Mobile horizontal scroll on 33 blog pages** — wide code/tables. Wrap `<pre>`, wide tables in `overflow-x-auto`.
6. **Performance page-weight (64) + JS file-size (66)** — bundle audit / route splitting.

### Unchanged from baseline

- CSP report-only → enforce (100% of pages, `security/security-csp` warn)
- `datePublished` missing on 29 docs article schemas
- eeat: author bylines, trust signals (warn count in the hundreds, category ~84-91)

## Files

- `reports/seo-landing-20260419-rerun.json`
- `reports/seo-compare-20260419-rerun.json`
- `reports/seo-docs-20260419-rerun.json`
- `reports/seo-blog-20260419-rerun.json`
