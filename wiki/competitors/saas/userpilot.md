---
title: Userpilot
type: competitor
sources:
  - ../../../marketing-strategy/Articles/competitors/11-userpilot.md
  - ../../../marketing-strategy/competitive-landscape.md
updated: 2026-04-19
---

*Most credible full-platform competitor in product adoption. 4.6/5 G2 (~966 reviews). Dominant in SEO.*

## Stats

| | |
|---|---|
| Starter | $299/mo (~$3,588/yr) — 2,000 MAU cap |
| Growth | $799/mo (~$9,588/yr) — 5,000–100,000 MAU |
| Enterprise | Custom (est. $18K–$60K/yr) |
| Vendr median | ~$18,000/yr |
| G2 | 4.6/5, 966 reviews |
| Capterra | 57 reviews |

**Pricing escalation:** Starter went $199 → $249 → $299. Growth went $499 → $799. Trend: rising.

## Feature gating problem

Starter at $299/mo is functionally a trial masquerading as production. Missing at Starter:

- **No real analytics** — only trend reports. No funnels, paths, retention cohorts.
- **No surveys beyond NPS** — CSAT, CES, PMF, custom all gated to Growth. NPS capped at 250/month.
- **No Resource Center** — their genuinely differentiated self-service help hub.
- **No A/B testing, localization, custom CSS.**
- **No webhooks, HTTP API, CRM integrations.**
- **Only 10 segments, 10 feature tags.**

**Real starting price for production use: $799/mo ($9,588/yr).**

## Developer pain points (ranked by evidence)

1. **No headless / component-level API** — renders proprietary DOM overlay. 79 G2 mentions of "limited customization", 60 of technical limitations.
2. **SPA integration requires `userpilot.reload()` manually** on every route change. No React hooks, no App Router integration.
3. **npm package is a shim, not a real SDK** — 8.38KB wrapper that buffers API calls; actual SDK loads from `js.userpilot.io` at runtime. Self-hosting is a multi-step process, Growth+ only.
4. **No TypeScript support** — no `.d.ts` in npm package, no `@types/userpilot`.
5. **Dynamic class names break targeting** — CSS Modules, Styled Components, Tailwind JIT generate names that change between builds. Analysis estimates 15–25 hrs/month of flow-maintenance for fast-shipping teams.
6. **CSP compliance requires whitelisting 15+ subdomains** + `'unsafe-inline'` for `style-src`. Loads Google Fonts externally.
7. **Ad-blocker vulnerability** — CDN-loaded → commonly blocked. Custom domain is Growth+ only, takes 5 business days.
8. **Performance overhead** — docs recommend script at beginning of `<head>`, no async/defer. Persistent WebSocket (`wss://analytex.userpilot.io`).

## Feature matrix (key dimensions)

| | TourKit | Userpilot |
|---|---|---|
| Headless architecture | Yes | No |
| Design system native | shadcn, Radix, Base UI | Proprietary overlay |
| TypeScript strict | Full inference | No `.d.ts` |
| Self-hosted | Default | Partial (complex), Growth+ |
| Bundle | <8KB core, <12KB react | 8KB shim + CDN SDK |
| WCAG 2.1 AA | Certified, Lighthouse 100 | "Aligns with" (not certified) |
| NPS surveys | — | All plans |
| CSAT/CES/custom surveys | — | Growth+ only |
| Resource Center | — | Growth+ only |
| Analytics | Pro (self-hosted) | Growth+ (full suite) |
| No-code visual builder | — | Chrome extension |
| Mobile SDKs | — | Growth+ add-on |

## Where Userpilot genuinely wins

- PM-led teams with no frontend eng capacity — Chrome extension builder is a real force multiplier
- Organizations needing surveys + NPS + feedback in one platform — Userpilot's survey suite (incl. AI-powered 32-language translation) is comprehensive
- Teams wanting analytics + engagement in one platform (analyze → act loop)
- Resource Center use case (knowledge base search across Zendesk/Freshdesk/Intercom/Salesforce) — no direct TourKit equivalent
- Mid-market ($1M–$10M ARR) where $10K–$18K/yr is acceptable line item and engineering time is expensive

## Where TourKit wins

- Developer teams that value control, TypeScript, design system integration (shadcn/ui)
- Startups where $3,600–$9,600/yr is material
- Strict CSP requirements
- Performance-sensitive apps (third-party script overhead)
- Teams that want to own infrastructure, not rent it

## Content opportunities (specific to Userpilot)

1. **Headless onboarding manifesto** — category-create like Contentful did for CMS. Target: "headless onboarding", "headless product tour"
2. **React onboarding libraries compared** — bundle sizes, Lighthouse, TS. No incumbent can write this authentically
3. **"Why your $10K/yr onboarding platform breaks every sprint"** — cite 15–25 hrs/month maintenance figure
4. **Build onboarding in Next.js with shadcn/ui** — Userpilot literally cannot produce this
5. **Userpilot vs code-first decision framework** — fair, honest, include Resource Center / surveys acknowledgments

## Key keywords

- "userpilot alternative" (200–500/mo)
- "userpilot pricing" (500–1,000/mo)
- "react onboarding library" (200–500/mo) — **primary structural target**
- "headless onboarding library" (10–50/mo) — **blue ocean, category-defining**
- "shadcn onboarding" (50–200/mo) — emerging demand, no authoritative content

## Related

- [competitors/index.md](../index.md)
- [competitors/saas/userflow.md](userflow.md) — Similar segment, different positioning
- [competitors/saas/appcues.md](appcues.md)
- [gtm/seo-content-strategy.md](../../gtm/seo-content-strategy.md)
- [content/article-ideas.md](../../content/article-ideas.md) — Comparison page is in the master list
