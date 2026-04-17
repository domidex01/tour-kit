# The Open-Source Onboarding Stack: Build Your Own With Code

## Why composable beats monolithic for product tours, analytics, and user guidance

*Originally published at [usertourkit.com](https://usertourkit.com/blog/open-source-onboarding-stack)*

Most teams treat onboarding as a single tool decision. Pick a SaaS platform, drop in a script tag, let product managers drag and drop. It works until the quarterly invoice hits $15,000, your tours load 300KB of vendor JavaScript, and every tooltip change requires a deployment ticket.

There's a third option. Instead of building from scratch ($60,000+ for a startup, per Userpilot's analysis) or buying a platform that scales with your MAU count, you assemble a stack from open-source libraries. Each layer handles one concern. You own the code, the data, and the deployment.

## The five layers

An open-source onboarding stack maps to five concerns:

1. **Guidance** — product tours, tooltips, hints, checklists (Tour Kit, Shepherd.js, Driver.js)
2. **Analytics** — completion tracking, drop-off analysis, retention (PostHog, Plausible)
3. **Feature flags** — targeting tours to user segments (PostHog, GrowthBook)
4. **Feedback** — NPS/CSAT surveys after tour completion (Tour Kit Surveys, Formbricks)
5. **UI** — rendering steps with your design system (shadcn/ui, Radix UI)

SaaS platforms bundle all five into one product. Convenient, but it means you get their analytics, their targeting logic, and their UI. The open-source stack gives you the same capabilities without the coupling.

## The math: three approaches compared

**SaaS platform:** $249-$8,000+/month depending on MAU. At 10,000 MAU, expect $3,000-5,000/month for Appcues. Pendo enterprise runs $36,000-96,000/year.

**Build from scratch:** $60,000 for a startup (two-month build), $200,000 for mid-market, up to $3.5M/3yr for enterprise. Plus 15-20% annual maintenance.

**Open-source stack:** Zero license cost. Engineering time for assembly (days, not months) and ongoing maintenance. Total bundle under 55KB gzipped versus 150-400KB for a SaaS script tag.

## Choosing a guidance library

The guidance layer is the core decision. As of April 2026, only a handful of open-source options are actively maintained and React 19 compatible.

React Joyride dominates with 400K+ weekly downloads. But it hasn't been updated in nine months and doesn't support React 19. Teams upgrading need alternatives.

Tour Kit and OnboardJS are the two genuinely headless options — they give you hooks and state management, you bring your own components. Shepherd.js and React Joyride ship their own UI.

Tour Kit goes further by providing separate packages for checklists, announcements, surveys, hints, and analytics. Other libraries only handle tours.

## The PostHog connection

PostHog is the natural analytics companion. It offers product analytics, session replay, feature flags, and A/B testing in a single open-source deployment. But it explicitly cannot deliver in-app guidance.

That gap is exactly what a tour library fills. Wire Tour Kit's analytics package to PostHog and every tour event flows into the same analytics tool your product team already uses.

## When to choose SaaS instead

The open-source stack isn't right for every team. Choose a SaaS platform if your product team needs to create tours without deploying code, or if you don't have React developers. Tour Kit requires React 18+ and TypeScript developers. No visual builder exists.

Choose the open-source stack if you have React developers, your design system demands pixel-perfect styling, you run your own analytics, and you want to avoid per-MAU pricing.

---

*Full article with comparison tables, code examples, and the complete reference architecture: [usertourkit.com/blog/open-source-onboarding-stack](https://usertourkit.com/blog/open-source-onboarding-stack)*
