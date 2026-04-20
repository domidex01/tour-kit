---
title: Comparison Page Template
type: content
sources:
  - ../../marketing-strategy/Articles/templates/comparaison-template.md
  - ../../marketing-strategy/content-templates.md
updated: 2026-04-19
---

*Full "TourKit vs X" comparison page template. Copy verbatim; replace bracketed values.*

**URL:** `/compare/tour-kit-vs-[competitor-slug]`
**Target:** High-intent devs evaluating alternatives — highest conversion rate on the site.
**SEO:** "[competitor] alternative" and "tour-kit vs [competitor]".

```markdown
# Tour-Kit vs [Competitor]: [Specific Differentiator Headline]

> Last updated: [date]. We keep this comparison honest — if [Competitor] is a better fit for your use case, we'll tell you.

## TL;DR

[3-sentence summary of key differences for skimmers]

## Quick Comparison

| Feature | Tour-Kit | [Competitor] |
|---------|----------|-------------|
| License | MIT (free) / $99 Pro | [their license] |
| React Support | Native hooks + components | [their approach] |
| TypeScript | Strict mode, full inference | [their TS support] |
| Headless Mode | Yes (default) | [yes/no] |
| Bundle Size | <8KB core (gzip) | [their size] |
| Accessibility | WCAG 2.1 AA built-in | [their a11y] |
| shadcn/ui Support | Native | [their support] |
| Checklists | Yes (Pro) | [yes/no/paid] |
| Analytics | Yes (Pro) | [yes/no/paid] |
| Announcements | Yes (Pro) | [yes/no/paid] |
| Pricing (Year 1) | $0-99 | [their year 1] |
| Pricing (Year 3) | $0-99 | [their year 3] |

## Code Comparison

**The same tour in [Competitor]:**

```[language]
[Their code example — 15-25 lines showing typical setup]
```

**The same tour in Tour-Kit:**

```tsx
[Tour-kit code — aim for noticeably cleaner/shorter]
```

## Where [Competitor] Wins

[Honest section — 2-3 genuine strengths. Builds credibility. Examples:
- Larger community with more Stack Overflow answers
- Framework-agnostic (supports Vue, Angular)
- Longer track record in production
- Visual editor for non-technical users]

## Where Tour-Kit Wins

[2-3 clear advantages. Examples:
- Headless architecture for full design system control
- shadcn/ui native integration
- 8 extended packages (checklists, analytics, announcements...)
- TypeScript strict mode from day one
- WCAG 2.1 AA accessibility built-in
- $99 once vs $X/month]

## Pricing Breakdown

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Tour-Kit (Free) | $0 | $0 | $0 |
| Tour-Kit (Pro) | $99 | $99 | $99 |
| [Competitor] | $[X] | $[2X] | $[3X] |

## When to Use [Competitor] Instead

[Be honest. 2-3 scenarios:
- If you need a no-code visual builder
- If you use Vue/Angular/Svelte
- If you need enterprise SLA and SOC 2 certification]

## When to Use Tour-Kit

[2-3 scenarios:
- React team that wants headless control
- shadcn/ui stack that needs native integration
- Cost-conscious team replacing $300/mo SaaS
- Team that needs accessibility compliance]

## Migration Guide

[If it exists: link to /docs/migrate/from-[competitor]]
[If not: "We're working on a step-by-step migration guide. In the meantime, [brief overview of migration approach]."]

## FAQ

**Q: Is Tour-Kit production-ready?**
A: [honest answer with proof points — test coverage, TypeScript strict, CI]

**Q: What if Tour-Kit stops being maintained?**
A: [MIT license, code is yours, no server dependency]

**Q: Can I try Tour-Kit for free?**
A: [Yes — free tier covers tours, hints, spotlights. `pnpm add @tour-kit/react`]
```

## Applying the template

Per competitor:
1. Grab the competitor wiki page (e.g. [competitors/saas/appcues.md](../competitors/saas/appcues.md)) for stats, strengths, weaknesses, pricing
2. Use that data to fill the table
3. Reference the competitor article (see [content/competitor-articles.md](competitor-articles.md)) for deeper analysis
4. Check [content/comparison-drafts.md](comparison-drafts.md) for an existing draft to start from
5. Run the copy through [brand/voice.md](../brand/voice.md) checklist before publishing

## Related

- [gtm/content-templates.md](../gtm/content-templates.md) — Summary + 8 other templates
- [content/competitor-articles.md](competitor-articles.md) — Source research per competitor
- [content/comparison-drafts.md](comparison-drafts.md) — 13 drafts already written
- [competitors/index.md](../competitors/index.md) — All competitor data
