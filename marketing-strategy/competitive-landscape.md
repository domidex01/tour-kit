# TourKit Competitive Landscape

> Last updated: March 2026

## Market Map

| Category | Examples | Price Range | Target Buyer |
|----------|----------|-------------|--------------|
| **OSS Libraries** | React Joyride, Shepherd.js, Intro.js, Driver.js, Reactour, Onborda | Free - $300 one-time | Developers |
| **Low-Code SaaS** | Appcues, UserGuiding, Userpilot, Chameleon, ProductFruits | $96-$879/mo | Product/growth teams |
| **Enterprise DAPs** | Pendo, WalkMe, Whatfix, Gainsight PX | $1K-$10K+/mo | Enterprise CS/product |

Tour-kit bridges OSS + SaaS: developer experience of an OSS library + feature depth of SaaS + $99 one-time.

---

## OSS Competitors

### React Joyride (Primary Competitor)
- **Stars:** ~7,500 | **Downloads:** ~680K/week (v3) + ~296K (v2) | **License:** MIT | **Bundle:** ~15KB
- **Strengths:** Most downloaded React tour library, large community, mature API
- **Weaknesses:** React 19 incompatibility (deprecated APIs), not headless, opinionated inline styles clash with Tailwind, no TypeScript-first, single maintainer (bus factor 1), no extended features
- **Tour-kit wins:** React 19 support, headless, 8 additional packages, TS strict, WCAG 2.1 AA, shadcn/ui native

### Shepherd.js
- **Stars:** ~13,600 | **Downloads:** ~130K/week | **License:** AGPL-3.0 + Commercial ($50-$300) | **Bundle:** ~25KB
- **Strengths:** Framework-agnostic (React/Vue/Angular wrappers), high star count, active development, Floating UI positioning
- **Weaknesses:** AGPL = dealbreaker for commercial projects, React wrapper is thin adapter (not native), no headless, tours-only, confusing free/AGPL/commercial tiers
- **Tour-kit wins:** MIT license, native React (not wrapper), headless, 8 packages, $99 includes everything

### Intro.js
- **Stars:** ~22,900 | **Downloads:** ~157K/week | **License:** AGPL-3.0 + Commercial ($9.99-$299.99) | **Bundle:** ~10KB
- **Strengths:** Highest star count (legacy), simple data-attribute API, lightweight, established since ~2013
- **Weaknesses:** AGPL, not React-native (separate `intro.js-react` wrapper), maintenance slowed (8 months stale), DOM-based conflicts with React's virtual DOM, dated UI, no extended features
- **Tour-kit wins:** React-native hooks/components, MIT, headless, TS strict, modern composition, active maintenance

### Driver.js
- **Stars:** ~25,300 | **Downloads:** ~390K/week | **License:** MIT | **Bundle:** ~5KB (smallest)
- **Strengths:** Highest stars in category, smallest bundle, clean modern API, beautiful default UI, MIT, creator = Kamran Ahmed (roadmap.sh)
- **Weaknesses:** Not React-specific (vanilla JS, manual integration), no official React hooks/wrapper, limited to highlighting + simple tours, single maintainer with competing priorities, maintenance slowed
- **Tour-kit wins:** Native React hooks/components, headless composable, 8 packages, TS strict, WCAG 2.1 AA, shadcn/ui

### Onborda
- **Stars:** ~1,300 | **Downloads:** ~5,500/week | **License:** MIT | **Bundle:** ~8KB
- **Strengths:** Purpose-built for Next.js App Router, designed for shadcn/ui + Tailwind, Framer Motion animations
- **Weaknesses:** Next.js ONLY (no Vite, CRA, Remix), tiny community, tours/tooltips only, tight coupling to Framer Motion, no headless, no TS strict
- **Tour-kit wins:** Works with any React setup, headless, 8 packages, no Framer Motion dependency, shadcn/ui compatible without being locked to it

### Reactour
- **Stars:** ~3,500 | **Downloads:** ~46K/week | **License:** MIT | **Bundle:** ~8KB
- **Effectively abandoned** (no releases in 12+ months). No React 19, no TS, no a11y, no extended features.

### New Entrants (2026)
- **OnboardJS:** Positioning as "open-source headless onboarding framework for React and Next.js" -- direct competitor
- **NextStepjs:** Lightweight React/Next.js onboarding, zero deps beyond Motion
- **Flows.sh:** "You build UI, we handle orchestration" -- product adoption platform

---

## SaaS Competitors

### Appcues ($249-$879/mo)
- **Essentials ($249):** Tours, tooltips, modals, NPS, basic analytics, 5 segments
- **Growth ($879):** + Checklists, A/B testing, advanced analytics, unlimited segments
- **Strengths:** No-code visual builder, mature platform (2013), A/B testing, 14-day free trial
- **Weaknesses:** Expensive, MAU-based pricing, limited customization, vendor lock-in, performance overhead, can't match code-first design control
- **Tour-kit counter:** Same features, $99 once vs $3K-$10K/year. Your team already has React devs.

### UserGuiding ($174-$499/mo)
- Lower entry than Appcues. 30-day money-back. AI Assistant feature. Strong SEO content.
- Still MAU-based, still limited customization vs code-first.

### Pendo (~$4,000/mo avg, ~$48K/yr)
- Enterprise product analytics + guides. Often overpaying for bundled analytics.
- Tour-kit angle: "$99 once vs $20K/year" for teams that only need onboarding, not full product analytics.

### Chameleon ($279-$999/mo)
- Strong SEO content strategy. Ranks well for "react product tour library" listicles.

---

## Key SEO Insight

SaaS companies (UserGuiding, Chameleon, Whatfix, Userpilot) dominate every product tour keyword with blog content. **No open-source library has a meaningful content presence.** Tour-kit can be the first OSS project to invest seriously in developer-focused content marketing for this category.

High-value keyword gaps:
- "appcues alternative open source" -- no actual OSS project ranks (all SaaS blogs)
- "react 19 product tour" -- uncontested
- "headless product tour react" -- no strong results
- "shadcn ui product tour" -- minimal competition
- "react joyride alternative" -- growing search volume as React 19 adoption accelerates

---

## Feature Comparison Matrix

| Feature | Tour-Kit | Joyride | Shepherd | Driver.js | Appcues |
|---------|----------|---------|----------|-----------|---------|
| License | MIT / $99 Pro | MIT | AGPL + $50-300 | MIT | $249-879/mo |
| React-native | Yes (hooks) | Yes | Wrapper | No (vanilla JS) | No (DOM injection) |
| Headless mode | Yes (default) | No | No | No | No |
| TypeScript | Strict, native | Partial | Basic | Types available | N/A |
| WCAG 2.1 AA | Built-in | Partial | Minimal | Minimal | Varies |
| shadcn/ui support | Native | None | None | None | None |
| Checklists | Yes (Pro) | No | No | No | Yes ($249+) |
| Analytics | Yes (Pro) | No | No | No | Yes ($249+) |
| Announcements | Yes (Pro) | No | No | No | Yes ($249+) |
| Bundle (core) | <8KB | ~15KB | ~25KB | ~5KB | ~120KB (script) |
| Year 1 cost | $0-99 | $0 | $0-300 | $0 | $2,988+ |
| Year 3 cost | $0-99 | $0 | $0-300 | $0 | $8,964+ |
