---
title: 300-Article SEO Plan (spreadsheet)
type: source
sources:
  - ../../marketing-strategy/tour-kit-300-articles.xlsx
  - ../../marketing-strategy/Articles/blog-article-ideas.md
updated: 2026-04-19
---

*Pointer to the 300-article SEO plan. The file is binary `.xlsx` and can't be rendered as markdown. Open locally to view.*

## Location

`../../marketing-strategy/tour-kit-300-articles.xlsx` (47KB, last modified 2026-03-31).

Also present at: `../../marketing-strategy/Articles/templates/tour-kit-300-articles.xlsx` (same file, templates directory copy).

## How to use it

- **Master list for long-tail SEO** — 300 articles mapped to keywords across the onboarding/product-tour space.
- **Superset of the 75-article list** — the publishable-priority subset is in [content/article-ideas.md](../content/article-ideas.md); the spreadsheet extends it with ~225 additional long-tail angles.

## Ingest plan (when the spreadsheet is needed)

The agent can't read `.xlsx` directly. To ingest:

1. Export the sheet to CSV: open in Excel/LibreOffice → Save As → `.csv`. Drop at `../../marketing-strategy/tour-kit-300-articles.csv`.
2. Agent reads the CSV and synthesizes a flat markdown index at `content/article-ideas-300.md` (similar structure to [content/article-ideas.md](../content/article-ideas.md)).
3. Sort and prioritize by keyword difficulty × search volume × conversion intent.

Until then, treat this file as an external asset and reference only.

## Related

- [content/article-ideas.md](../content/article-ideas.md) — 75-article prioritized subset
- [gtm/content-calendar.md](../gtm/content-calendar.md) — 24-article 12-week calendar (further subset)
- [gtm/seo-content-strategy.md](../gtm/seo-content-strategy.md) — Pillars and keyword strategy
