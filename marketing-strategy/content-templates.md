# TourKit Content Templates

> Ready-to-use templates for every content type. Fill in the brackets and publish.

---

## Template 1: Comparison Page ("Tour-Kit vs X")

**URL:** `/compare/tour-kit-vs-[competitor-slug]`
**Target:** High-intent devs evaluating alternatives (highest conversion rate)
**SEO:** Target "[competitor] alternative" and "tour-kit vs [competitor]"

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

---

## Template 2: Tutorial

**URL:** `/blog/how-to-[action]-[technology]`
**Target:** Problem-aware devs searching for implementation guidance
**SEO:** Target "how to [action] in react" and "[technology] product tour"

```markdown
# How to [Do X] with [Technology]

> [1-sentence summary of what the reader will build and how long it takes]

## Prerequisites

- [Framework] [version]+ project
- [Package manager] installed
- Basic knowledge of [relevant concept]

## What We're Building

[1-2 sentences describing the end result. Include a screenshot or GIF.]

## Step 1: Install Tour-Kit

```bash
pnpm add @tour-kit/react
```

## Step 2: [First meaningful action]

[Code block with file path comment]
[1-2 sentences explaining what this does]

## Step 3: [Next action]

[Code block]
[Brief explanation]

## Step [N]: [Final action]

[Code block]
[Brief explanation]

## Result

[Screenshot or GIF of the working tour]

## Common Issues

**[Issue 1]:** [Solution]
**[Issue 2]:** [Solution]

## What's Next

- [Link to advanced guide]
- [Link to related feature]
- [Link to API reference]

## Full Source Code

[Link to GitHub repo or CodeSandbox]
```

---

## Template 3: Technical Twitter/X Thread

```
Tweet 1: [Hook — state the problem or insight]
Tweet 2: [Context — why this matters, 2-3 sentences]
Tweet 3: [Code screenshot — the solution in 6-10 lines]
Tweet 4: [Explanation — what the code does, one key insight]
Tweet 5: [Result — GIF or screenshot showing it working]
Tweet 6: [Link to docs + invite feedback]
```

**Rules:**
- No emojis as bullet points
- Max 0-2 hashtags (#reactjs #opensource when relevant)
- Lead with the problem, not the product
- Code screenshots via ray.so (dark theme, 16px+ font, TypeScript)
- Post Tuesday-Thursday, 9-11 AM ET

---

## Template 4: Weekly Technical Tip (Twitter/X)

```
[One-sentence insight or trick]

[Code screenshot: 4-8 lines showing the pattern]

[One-sentence explanation of why this is useful]

Docs: [specific page link with UTM]
```

**Cadence:** Monday + Friday
**Tool:** ray.so or carbon.sh for code screenshots

---

## Template 5: Reddit Answer (When Asked About Tour Libraries)

```
Depends on your requirements. For React projects, the main options are:

- **React Joyride** — most established, large community, but has React 19 compatibility issues and uses inline styles
- **Shepherd.js** — framework-agnostic, but AGPL license and the React wrapper isn't native
- **Driver.js** — lightweight, vanilla JS, no native React hooks
- **Tour-Kit** — headless, hooks-based, shadcn/ui native (disclosure: I maintain this one)

If you need headless control and accessibility out of the box, tour-kit fits that. If you want something battle-tested with a huge community, Joyride is the safe bet. If you need Vue/Angular support, Shepherd.

Happy to answer questions about any of them.
```

---

## Template 6: Blog Announcement (New Package/Feature)

```markdown
# Tour-Kit [version]: [What's New — the headline feature]

[Package name] is now available. Here's what it does, why we built it, and how to use it.

## What Changed

[2-3 bullet points with the most impactful changes]

## Why We Built This

[2-3 sentences on the problem this solves. Be specific.]

## How to Use It

```bash
pnpm add @tour-kit/[package]
```

```tsx
[Minimal code example — 8-15 lines]
```

## What's Next

[1-2 sentences on upcoming work]

## Changelog

[Link to full changelog]
```

---

## Template 7: Newsletter Sponsorship Copy

### This Week in React (~40K subscribers, technical audience)
```
Tour-Kit — Headless product tours for React. Hooks-based, accessible (WCAG 2.1 AA), TypeScript-strict. Works natively with shadcn/ui. Free core (MIT) + extended packages for $99 once. No subscriptions.
→ [docs link with UTM: ?utm_source=thisweekinreact&utm_medium=newsletter&utm_campaign=launch]
```

### Bytes (~200K subscribers, witty/casual tone)
```
Remember paying $300/month for product tour overlays that looked nothing like your app? Tour-Kit is a headless React library that handles the hard stuff (positioning, focus traps, keyboard nav) while you keep your own components. Free core, $99 one-time for the full toolkit. Your design system will thank you.
→ [docs link with UTM]
```

### React Status (~25K subscribers, editorial tone)
```
Tour-Kit is a new headless React library for product tours and onboarding. TypeScript strict mode, WCAG 2.1 AA accessible, and designed to work natively with shadcn/ui. The core is MIT-licensed (<8KB gzipped), with extended packages for analytics, checklists, and announcements at $99 one-time.
→ [docs link with UTM]
```

---

## Template 8: YouTube Creator Outreach

### Subject
```
Tour-Kit — possible video collab?
```

### Body
```
Hey [name],

Big fan of your [specific recent video title] — especially the part about [specific detail].

I'm building Tour-Kit, a headless React library for product tours. Hooks-based, TypeScript-strict, works with shadcn/ui. Thought it might make a good tutorial or review for your channel.

I've got a demo repo ready to clone that shows it working in a Next.js app: [link]

Happy to provide a free Pro license and cover a sponsorship fee if you're interested. No pressure either way.

Domi
```

---

## Template 9: LinkedIn Post (Cost-Saving Angle)

```
The math on product tour tools for SaaS:

Appcues: $2,988/year
UserGuiding: $1,068/year
Pendo: ~$6,000/year

Tour-Kit: $99. Once. Forever.

Same features: tours, checklists, announcements, analytics.

The difference: Tour-Kit is a React library, not a SaaS platform. Your engineering team builds with their own components. No iframe overlays. No vendor lock-in. No MAU limits.

For a startup watching burn rate, that's $3,000-$10,000/year back in the budget.

[link to comparison page]
```
