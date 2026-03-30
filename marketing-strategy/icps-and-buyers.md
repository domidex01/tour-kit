# TourKit ICPs, Buyer Journeys & Objection Handling

## Three ICPs

### Primary: Frontend Lead / Senior React Developer (50% of effort)

**Who:** Senior FE Engineer, Frontend Lead, Staff Engineer. Owns library selection for 3-15 person eng team at Series A-C SaaS (20-200 employees, $1M-$30M ARR). Age 27-38, 5-12 years experience.

**Stack:** React 18/19, Next.js 14/15 (App Router), TypeScript strict, Tailwind + shadcn/ui, Zustand/Jotai, pnpm/bun, Vercel/AWS.

**Pain points:**
- React Joyride showing age (React 19 incompatibility, inline styles clash with Tailwind, broken spotlight in dark mode)
- Vanilla JS libraries (Shepherd, Driver.js) feel wrong in React
- SaaS tools absurdly expensive ($249-$879/mo) with no developer control
- Accessibility is afterthought in all existing options
- No headless option exists that lets them own the UI completely

**Buying triggers:**
1. New product launch needing guided onboarding
2. Onboarding metrics tanking (activation rate, time-to-value)
3. React 19 migration breaks existing tour library
4. Cost-cutting kills SaaS subscriptions
5. Switching to shadcn/ui-based design system
6. Accessibility audit fails

**Decision process:** Evaluates in <5 min on GitHub (README, stars, last commit, TypeScript quality). Tries in 15 min. Ships basic tour week 1. Realizes need for Pro features week 2-8. $99 = impulse corporate card buy.

**Key message:** "Headless product tours for React -- hooks-based, accessible, and built for the shadcn/ui era."

**Channels:** Twitter/X, r/reactjs, HN, This Week in React, GitHub Trending, Reactiflux Discord

---

### Secondary: Solo Founder / Indie Hacker (30% of effort)

**Who:** Building SaaS solo or with 1-2 co-founders. Full-stack, chose React/Next.js. Revenue $0-$30K MRR. Bootstrapped or lightly funded.

**Stack:** "The 2026 indie stack" -- Next.js 14/15, TypeScript, Tailwind + shadcn/ui, Prisma/Drizzle, Vercel, Stripe, Better Auth/Clerk.

**Pain points:**
- SaaS tools eat slim margins ($300/mo = 6% at $5K MRR)
- Subscription fatigue (already paying for hosting, auth, email, analytics...)
- Needs something that works in an afternoon
- Wants native shadcn/ui look
- Building in public means stack gets visibility

**Buying triggers:**
1. Product Hunt launch feedback says onboarding is confusing
2. Hit $1K MRR, optimizing activation
3. Saw peer tweet about tour-kit
4. Evaluating SaaS stack for one-time vs recurring costs

**Decision process:** 0-15 min from discovery to working tour. Entire funnel measured in minutes. Getting-started experience IS the sales pitch.

**Key message:** "Product tours for your Next.js SaaS. Free tier forever. Pro is $99 once -- not $300/month."

**Channels:** Indie hacker Twitter, Product Hunt, r/SaaS, r/indiehackers, YouTube (Simon Hoiberg, Marc Lou)

---

### Tertiary: Product Manager / Growth Lead (20% of effort)

**Who:** PM, Head of Product, Growth Lead at 50-500 employee company ($5M-$100M ARR). Non-technical or semi-technical. Currently managing tours via SaaS platform (Appcues, Pendo, UserGuiding).

**Current spending:** $3,000-$48,000/year on product tour SaaS. Tour-kit Pro at $99 = 97-99% cost reduction.

**Pain points:**
- SaaS costs escalating (MAU-based pricing grows with success)
- Vendor lock-in (all tours live inside vendor, switching = rebuild everything)
- Limited customization frustrates engineering
- Performance impact (50-200KB third-party scripts, Core Web Vitals impact)
- Need engineering help anyway despite "no-code" promises

**Decision process:** 6-8 week cycle. Discovers alternatives (Google, G2), builds internal eval doc, presents to engineering lead (who becomes Primary ICP), engineering spikes, PM builds business case with cost savings, finance approves.

**Key message:** "Replace your $300/month Appcues subscription with a $99 one-time purchase your engineering team will actually enjoy using."

**Channels:** Google Search, G2/Capterra, LinkedIn, Lenny's Newsletter, Slack communities

---

## Anti-Personas (Do NOT Target)

| Anti-Persona | Why Not | What to Say |
|---|---|---|
| Enterprise needing no-code builders | Code-first by design, no visual editor | "Try WalkMe or Pendo -- purpose-built for that workflow." |
| Teams without React (Vue, Angular, Svelte) | Architecture is fundamentally React-native | "Try Shepherd.js or Driver.js." |
| Desktop app overlays (Electron) | Web DOM only | "You need native overlay solutions." |
| SOC 2/HIPAA compliance buyers | No server component to audit | "No data leaves the browser, but we can't provide vendor certifications." |
| Non-technical marketers without eng support | Requires writing React code | "Try Appcues or UserGuiding for visual builders." |

---

## Top Objections & Responses

| Objection | Response |
|---|---|
| "Not enough GitHub stars" | Stars correlate with age, not quality. Show npm trajectory, TS quality, active commits. |
| "What if maintainer abandons it?" | MIT licensed. Code is yours forever. Unlike SaaS where tours vanish when you cancel. |
| "We should build our own" | Production-grade tour system = 2-4 weeks senior eng time ($6,400-$24,000). Tour-kit is $0-99. |
| "React Joyride works for us" | Does it support React 19? Work with Tailwind without CSS hacks? Pass a11y audit? |
| "Don't trust paid open-source" | Free tier is fully MIT, covers 80% of use cases. Same model as Tailwind UI. |
| "$99 seems too cheap" | One-time, no recurring. Code ships to node_modules. No server, no tracking, no vendor dependency. |
| "We already use Appcues" | Does the overlay match your design system? Comfortable with $3K+/yr? What if they raise prices? |
| "We lose the no-code editor" | How often do you create tours without engineering today? Most need CSS help, dynamic targeting, SPA routing fixes anyway. |
| "Need enterprise features (SSO, audit)" | Library, not SaaS. Runs in your bundle, authenticated by your auth, logged by your logging. |

---

## Messaging by Audience

| Audience | Lead With | Tone |
|---|---|---|
| Senior React Devs | Code quality, DX, bundle size, composability, no vendor lock-in | Technical, specific, code samples |
| Engineering Managers | Maintenance burden, team productivity, docs quality, cost predictability | Pragmatic, ROI-focused |
| Product Managers | Feature parity with SaaS, analytics, cost savings | Benefits-first, business outcomes |
| Indie Hackers | Speed, price, one-time cost, "does it just work" | Direct, empathetic to budget constraints |
