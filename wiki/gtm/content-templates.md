---
title: Content Templates
type: gtm
sources:
  - ../../marketing-strategy/content-templates.md
updated: 2026-04-19
---

*9 ready-to-use templates for every content type. Fill in the brackets and publish.*

## 1. Comparison page ("TourKit vs X")

**URL:** `/compare/tour-kit-vs-[competitor-slug]`
**Target:** High-intent devs evaluating alternatives (highest conversion)
**SEO:** "[competitor] alternative" and "tour-kit vs [competitor]"

Structure:
- TL;DR (3 sentences)
- Quick comparison table (license, React support, TS, headless, bundle, a11y, shadcn, checklists, analytics, announcements, Y1/Y3 pricing)
- Code comparison (same tour in competitor vs TourKit, competitor first)
- Where [Competitor] wins (2–3 genuine strengths — builds credibility)
- Where TourKit wins (2–3 clear advantages)
- Pricing breakdown (Year 1, 2, 3 side-by-side)
- When to use [Competitor] instead (be honest — 2–3 scenarios)
- When to use TourKit (2–3 scenarios)
- Migration guide (link or brief overview)
- FAQ (production-ready? maintenance risk? free trial?)

See the full template at `../../marketing-strategy/content-templates.md` for the exact markdown.

## 2. Tutorial

**URL:** `/blog/how-to-[action]-[technology]`
**Target:** Problem-aware devs searching implementation guidance

Structure:
- Prerequisites
- What we're building (1–2 sentences + screenshot/GIF)
- Step 1: Install
- Step 2–N: Meaningful actions (code + 1–2 sentence explanation each)
- Result (screenshot/GIF)
- Common issues (2–3 Q&A)
- What's next (3 links)
- Full source code (GitHub/CodeSandbox link)

## 3. Twitter/X technical thread

6 tweets:
1. Hook — state the problem or insight
2. Context — why it matters (2–3 sentences)
3. Code screenshot — solution in 6–10 lines
4. Explanation — what the code does, one key insight
5. Result — GIF or screenshot
6. Link to docs + invite feedback

**Rules:**
- No emojis as bullet points
- Max 0–2 hashtags (#reactjs #opensource when relevant)
- Lead with the problem, not the product
- Code screenshots via ray.so (dark, 16px+, TypeScript)
- Post Tuesday–Thursday, 9–11 AM ET

## 4. Weekly technical tip (Twitter/X)

4 lines:
```
[One-sentence insight]
[Code screenshot: 4-8 lines]
[One-sentence explanation of why useful]
Docs: [specific link with UTM]
```

Cadence: Monday + Friday. Tool: ray.so or carbon.sh.

## 5. Reddit answer (when asked about tour libraries)

Pattern:

> Depends on your requirements. For React projects, the main options are:
>
> - **React Joyride** — most established, large community, but has React 19 compatibility issues and uses inline styles
> - **Shepherd.js** — framework-agnostic, but AGPL license and the React wrapper isn't native
> - **Driver.js** — lightweight, vanilla JS, no native React hooks
> - **Tour-Kit** — headless, hooks-based, shadcn/ui native (disclosure: I maintain this one)
>
> If you need headless control and accessibility out of the box, tour-kit fits that. If you want something battle-tested with a huge community, Joyride is the safe bet. If you need Vue/Angular support, Shepherd.
>
> Happy to answer questions about any of them.

## 6. Blog announcement (new package/feature)

Structure:
- Title: `TourKit [version]: [Headline feature]`
- What changed (2–3 bullets)
- Why we built this (2–3 sentences, specific)
- How to use (install command + 8–15 line code example)
- What's next (1–2 sentences on upcoming work)
- Changelog link

## 7. Newsletter sponsorship copy

### This Week in React (~40K subs, technical)
> Tour-Kit — Headless product tours for React. Hooks-based, accessible (WCAG 2.1 AA), TypeScript-strict. Works natively with shadcn/ui. Free core (MIT) + extended packages for $99 once. No subscriptions.
> → [docs link with UTM]

### Bytes (~200K subs, witty/casual)
> Remember paying $300/month for product tour overlays that looked nothing like your app? Tour-Kit is a headless React library that handles the hard stuff (positioning, focus traps, keyboard nav) while you keep your own components. Free core, $99 one-time for the full toolkit. Your design system will thank you.
> → [docs link with UTM]

### React Status (~25K subs, editorial)
> Tour-Kit is a new headless React library for product tours and onboarding. TypeScript strict mode, WCAG 2.1 AA accessible, designed to work natively with shadcn/ui. The core is MIT-licensed (<8KB gzipped), with extended packages for analytics, checklists, and announcements at $99 one-time.
> → [docs link with UTM]

## 8. YouTube creator outreach email

**Subject:** `Tour-Kit — possible video collab?`

**Body:**
> Hey [name],
>
> Big fan of your [specific recent video title] — especially the part about [specific detail].
>
> I'm building Tour-Kit, a headless React library for product tours. Hooks-based, TypeScript-strict, works with shadcn/ui. Thought it might make a good tutorial or review for your channel.
>
> I've got a demo repo ready to clone that shows it working in a Next.js app: [link]
>
> Happy to provide a free Pro license and cover a sponsorship fee if you're interested. No pressure either way.
>
> Domi

## 9. LinkedIn post (cost-saving angle)

> The math on product tour tools for SaaS:
>
> Appcues: $2,988/year
> UserGuiding: $1,068/year
> Pendo: ~$6,000/year
>
> Tour-Kit: $99. Once. Forever.
>
> Same features: tours, checklists, announcements, analytics.
>
> The difference: Tour-Kit is a React library, not a SaaS platform. Your engineering team builds with their own components. No iframe overlays. No vendor lock-in. No MAU limits.
>
> For a startup watching burn rate, that's $3,000-$10,000/year back in the budget.
>
> [link to comparison page]

## Related

- [gtm/content-calendar.md](content-calendar.md) — When to publish which template
- [gtm/seo-content-strategy.md](seo-content-strategy.md)
- [gtm/launch-copy-kit.md](launch-copy-kit.md) — Launch-specific copy
- [brand/voice.md](../brand/voice.md) — Voice rules every template follows
- [content/comparison-template.md](../content/comparison-template.md) — Full comparison template verbatim
