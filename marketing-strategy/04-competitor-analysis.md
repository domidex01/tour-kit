# Competitor Analysis

> Last updated: March 2026

## Competitive Landscape Overview

### Market Map

The product tour and user onboarding market splits into three distinct categories:

| Category | Examples | Price Range | Target Buyer |
|----------|----------|-------------|--------------|
| **OSS Libraries** | React Joyride, Shepherd.js, Intro.js, Driver.js, Reactour, Onborda | Free - $300 one-time | Developers building in-house |
| **Low-Code SaaS** | Appcues, UserGuiding, Userpilot, Chameleon, ProductFruits | $96 - $879/mo | Product teams, growth teams |
| **Enterprise DAPs** | Pendo, WalkMe, Whatfix, Gainsight PX | $1,000 - $10,000+/mo | Enterprise CS/product orgs |

### Where Tour-Kit Sits

Tour-kit occupies a unique position that bridges the OSS library and SaaS categories:

- **Developer experience of an OSS library** -- headless, composable, TypeScript-first, works with shadcn/ui
- **Feature depth of a SaaS platform** -- tours, hints, checklists, announcements, analytics, adoption tracking, media, scheduling
- **One-time $99 Pro license** -- orders of magnitude cheaper than SaaS, with no recurring cost and no vendor lock-in

This positioning lets tour-kit compete on two fronts simultaneously: it offers everything OSS libraries offer plus 8 additional packages, and it delivers SaaS-level features at a fraction of the cost.

---

## Open-Source Competitors

### React Joyride

**Key Metrics:**
- GitHub stars: ~7,500
- npm weekly downloads: ~680,000 (v3.0.0) + ~296,000 (v2.x)
- Last updated: v3.0.0 released in 2025 (v2.x stale for 9+ months)
- License: MIT
- Bundle size: ~15KB gzipped

**Strengths:**
- Most downloaded React tour library by a wide margin
- Large community and ecosystem -- many tutorials, Stack Overflow answers, and blog posts reference it
- Mature API with extensive configuration options
- Declarative React-first approach with component-based API
- MIT licensed with no commercial restrictions

**Weaknesses:**
- React 19 incompatibility is a critical issue -- relies on deprecated `unmountComponentAtNode` and `unstable_renderSubtreeIntoContainer` APIs removed in React 19
- v3.0.0 attempted to fix React 19 support but has reliability issues per user reports
- Peer dependency conflicts with `@gilbarbara/hooks` constrained to React 16.8-18
- No extended features beyond basic step-by-step tours (no checklists, announcements, analytics, hints)
- Single maintainer (gilbarbara) -- bus factor of 1
- Not headless -- opinionated styling that is difficult to customize to match design systems
- No TypeScript-first design (types are added on, not core)

**Their Positioning and Messaging:**
- "Create guided tours in your apps" -- positioned purely as a tour library
- Documentation focuses on configuration props, not broader onboarding patterns
- Homepage at react-joyride.com emphasizes simplicity and React integration

**SEO Keywords They Rank For:**
- "react joyride" (branded)
- "react product tour"
- "react guided tour"
- "react onboarding tour library"

**Tour-Kit Advantage:**
- Full React 19 compatibility out of the box
- Headless architecture works with any design system, especially shadcn/ui
- 8 additional packages (hints, checklists, announcements, analytics, adoption, media, scheduling)
- TypeScript strict mode from day one
- WCAG 2.1 AA accessibility built-in (Joyride has minimal a11y)
- Active maintenance with a clear roadmap

---

### Shepherd.js

**Key Metrics:**
- GitHub stars: ~13,600
- npm weekly downloads: ~130,000
- Last updated: v15.2.2 (actively maintained)
- License: AGPL-3.0 + Commercial ($50-$300 lifetime)
- Bundle size: ~25KB gzipped

**Strengths:**
- Framework-agnostic with official React, Vue, and Angular wrappers
- High star count signals strong brand recognition
- Active development and regular releases
- Floating UI-based positioning engine
- Good documentation site at shepherdjs.dev
- Step-based architecture with hooks for lifecycle events

**Weaknesses:**
- AGPL license is a dealbreaker for most commercial projects -- requires full source disclosure or purchasing a commercial license
- React wrapper (`react-shepherd`) is a thin adapter, not a native React experience
- No headless/composable architecture -- ships with opinionated UI
- Limited to tours only -- no checklists, announcements, analytics, or extended features
- Commercial license pricing ($50-$300) funds a small team, not a full product roadmap
- Shepherd Pro consulting upsell muddies the open-source positioning

**Their Positioning and Messaging:**
- "Guide your users through a tour of your app"
- Emphasizes framework-agnostic nature (works with React, Vue, Angular, Ember)
- Pricing page pushes toward "Shepherd Consulting" for enterprise needs

**Pricing Model (Closest Monetization Comp):**
- Free: AGPL for non-commercial/OSS use
- Business: $50 lifetime (up to 5 projects, 1 month support)
- Enterprise: $300 lifetime (unlimited projects, 6 months support, prioritized issues)
- Consulting: Custom quote

**SEO Keywords They Rank For:**
- "shepherd.js" (branded)
- "javascript product tour"
- "vanilla js tour library"
- "product tour library"

**Tour-Kit Advantage:**
- MIT-licensed core with no AGPL complications
- Native React experience (not a wrapper around vanilla JS)
- Headless architecture vs. opinionated UI
- 8 additional packages beyond tours
- $99 one-time Pro license includes everything -- no confusing free/AGPL/commercial tiers
- shadcn/ui compatibility out of the box

---

### Intro.js

**Key Metrics:**
- GitHub stars: ~22,900
- npm weekly downloads: ~157,000
- Last updated: v8.3.2 (8 months ago as of March 2026)
- License: AGPL-3.0 + Commercial ($9.99-$299.99 lifetime)
- Bundle size: ~10KB gzipped

**Strengths:**
- Highest star count among tour libraries (legacy popularity)
- Simple data-attribute-based API that works without framework integration
- Lightweight bundle size
- Established brand -- one of the oldest tour libraries (founded ~2013)
- Lifetime commercial licensing is developer-friendly

**Weaknesses:**
- AGPL license requires commercial license for any revenue-generating project
- Not React-native -- requires `intro.js-react` wrapper (separate package, different maintainer)
- Maintenance has slowed significantly -- 8 months since last release
- DOM-based approach conflicts with React's virtual DOM paradigm
- No TypeScript-first design
- No extended features (checklists, announcements, analytics, adoption tracking)
- Dated UI that looks like 2015-era onboarding
- No headless/composable option

**Their Positioning and Messaging:**
- "Step-by-step guide and feature introduction for your website"
- Positioned as a generic website tour tool, not specifically for React/SPA
- Pricing page emphasizes "lifetime license" value

**Pricing Model (Closest Monetization Comp to Tour-Kit):**
- Starter: $9.99 lifetime (1 project, no support)
- Business: $49.99 lifetime (5 projects, 1 month support, 1 custom theme)
- Premium: $299.99 lifetime (unlimited projects, 6 months support, 3 custom themes, 24/7 priority)
- Free: AGPL for non-commercial use

**SEO Keywords They Rank For:**
- "intro.js" (branded)
- "website tour library"
- "product introduction library"
- "javascript onboarding"
- "step by step guide javascript"

**Tour-Kit Advantage:**
- React-native with hooks and components (not a wrapper)
- Headless architecture with full design system control
- TypeScript strict mode throughout
- 8 additional packages vs. tours-only
- $99 one-time includes unlimited projects and all packages
- Modern composition patterns vs. imperative DOM manipulation
- Active maintenance and React 19 support

---

### Driver.js

**Key Metrics:**
- GitHub stars: ~25,300
- npm weekly downloads: ~390,000
- Last updated: v1.4.0 (4+ months ago)
- License: MIT
- Bundle size: ~5KB gzipped (smallest in category)

**Strengths:**
- Highest star count in the entire category (25K+)
- Smallest bundle size -- zero dependencies, ~5KB gzipped
- Clean, modern API design
- Beautiful default UI with smooth animations
- MIT licensed with no commercial restrictions
- Strong Product Hunt launch drove awareness
- Created by Kamran Ahmed (roadmap.sh founder) -- personal brand amplifies reach

**Weaknesses:**
- Not React-specific -- vanilla JS that requires manual integration with React lifecycle
- No official React wrapper or hooks
- Limited to highlighting and simple tours -- no multi-step wizard flows
- No extended features (checklists, announcements, analytics)
- Single maintainer with competing priorities (roadmap.sh is primary project)
- No TypeScript-first design (types available but not core)
- Maintenance pace has slowed -- last release 4+ months ago
- No headless/composable architecture

**Their Positioning and Messaging:**
- "A light-weight, no-dependency, vanilla JavaScript engine to drive user's focus across the page"
- Emphasizes lightweight nature and zero dependencies
- Positions as a "focus driver" rather than a full onboarding solution

**SEO Keywords They Rank For:**
- "driver.js" (branded)
- "lightweight product tour"
- "javascript highlight library"
- "vanilla js onboarding"
- "product tour no dependencies"

**Tour-Kit Advantage:**
- Native React hooks and components vs. vanilla JS
- Headless composable architecture for full design control
- Complete onboarding platform (8 packages beyond core tours)
- TypeScript strict mode from the ground up
- Accessibility-first (WCAG 2.1 AA) vs. minimal a11y in Driver.js
- Active development with clear multi-package roadmap
- shadcn/ui compatibility

---

### Onborda

**Key Metrics:**
- GitHub stars: ~1,300
- npm weekly downloads: ~5,500
- Last updated: v1.2.5 (active development)
- License: MIT
- Bundle size: ~8KB gzipped (estimated)

**Strengths:**
- Purpose-built for Next.js App Router -- first-class support for server components
- Designed around shadcn/ui and Tailwind CSS
- Framer Motion animations built-in
- Modern stack alignment (Next.js + Tailwind + shadcn)
- Growing community in the Next.js ecosystem
- Clean, developer-friendly API

**Weaknesses:**
- Next.js-only -- does not work with Vite, CRA, Remix, or other React setups
- Very small community (1.3K stars, ~5.5K weekly downloads)
- Limited feature set -- tours/tooltips only, no checklists, announcements, or analytics
- Tight coupling to Framer Motion and Tailwind CSS
- Young project with limited production battle-testing
- No headless option -- requires their UI primitives
- No TypeScript strict mode

**Their Positioning and Messaging:**
- "An onboarding wizard flow / product tour for Next.js animated by framer motion"
- Targets the Next.js + shadcn/ui developer specifically
- Positioned as the "shadcn-native" tour solution

**SEO Keywords They Rank For:**
- "onborda" (branded)
- "next.js product tour"
- "next.js onboarding"
- "shadcn product tour"

**Tour-Kit Advantage:**
- Works with any React setup (Next.js, Vite, Remix, CRA), not just Next.js
- Headless architecture -- bring your own UI, including shadcn/ui
- 8 additional packages (hints, checklists, announcements, analytics, adoption, media, scheduling)
- No hard dependency on Framer Motion or Tailwind (works with any animation/styling)
- TypeScript strict mode throughout
- Larger scope -- full onboarding platform vs. simple tour widget
- shadcn/ui compatible *without* being locked to it

---

### Reactour

**Key Metrics:**
- GitHub stars: ~3,500
- npm weekly downloads: ~46,000
- Last updated: Inactive -- no new releases in 12+ months
- License: MIT
- Bundle size: ~8KB gzipped

**Strengths:**
- Simple, easy-to-use API with minimal configuration
- React-native implementation (not a wrapper)
- MIT licensed
- Small bundle size
- Good for quick, basic tour implementations

**Weaknesses:**
- Effectively abandoned -- no releases, no PR activity, no issue responses in 12+ months
- No React 19 support or testing
- Very limited feature set -- basic step tours only
- No TypeScript-first design
- No accessibility features
- No extended features (checklists, announcements, analytics)
- No headless/composable option
- Small community with declining engagement

**Their Positioning and Messaging:**
- "Tourist guide into your React Components"
- Minimal positioning -- project appears dormant

**SEO Keywords They Rank For:**
- "reactour" (branded)
- "react tour component"
- "simple react tour"

**Tour-Kit Advantage:**
- Actively maintained with clear roadmap
- Full React 19 support
- Headless composable architecture
- TypeScript strict mode
- WCAG 2.1 AA accessibility
- 8 additional packages for complete onboarding
- shadcn/ui compatibility

---

## SaaS Competitors

### Appcues ($249-$879/mo)

**Features by Tier:**
- **Essentials ($249/mo):** Product tours, tooltips, modals, slideouts, banners, NPS surveys, basic analytics, up to 5 segments
- **Growth ($879/mo):** Everything in Essentials + checklists, A/B testing, advanced analytics, premium integrations, unlimited segments
- **Enterprise (custom):** Everything in Growth + localization, SSO, dedicated CSM, SLA, unlimited seats

**Strengths:**
- No-code visual builder -- product managers can create tours without developers
- Mature platform (founded 2013) with proven enterprise track record
- A/B testing and advanced analytics built-in
- Extensive template library for common onboarding patterns
- Strong content marketing and SEO presence
- 14-day free trial with no credit card required
- Good integration ecosystem (Segment, Amplitude, Mixpanel, HubSpot)

**Weaknesses:**
- Expensive -- $249/mo minimum, $879/mo for checklists and A/B testing
- MAU-based pricing means costs scale unpredictably with user growth
- Limited customization -- constrained to their visual editor's capabilities
- Vendor lock-in -- migrating away means rebuilding all onboarding flows
- Performance overhead from loading their SDK (additional network requests, DOM manipulation)
- Cannot match the pixel-perfect design control of a code-first approach
- No headless/composable option for developers who want full control

**Target Customer Overlap with Tour-Kit:**
- Low overlap on the no-code buyer (tour-kit requires code)
- High overlap on developer-led teams at startups/scaleups who want power and customization
- Tour-kit wins when the team has React developers and wants design-system consistency

**SEO and Content Strategy:**
- Ranks for "product tour software", "user onboarding tool", "in-app messaging"
- Publishes extensive comparison content ("Appcues vs X" for every competitor)
- Blog targets product managers and growth teams, not developers
- Their "build vs buy" content positions OSS libraries as incomplete

**How They Position Against OSS:**
- "OSS libraries give you tours, but you still need to build the editor, targeting, analytics, and lifecycle logic yourself"
- Emphasizes time-to-value and non-developer access
- Positions code-based solutions as maintenance burdens

**Tour-Kit Counter-Positioning:**
- "Same features, $99 once instead of $3,000-$10,000/year"
- "Your team already has React developers -- why pay $10K/year for a no-code tool?"
- "Full design system control vs. Appcues' constrained visual editor"

---

### UserGuiding ($174-$499/mo)

**Features by Tier:**
- **Starter ($174/mo):** Product tours, tooltips, hotspots, checklists, resource center, segmentation, analytics, up to 2,000 MAU
- **Growth ($349/mo):** Everything in Starter + advanced analytics, custom CSS, A/B testing, more MAU
- **Professional ($299/mo):** Up to 20,000 MAU, expanded features
- **Corporate ($499+/mo):** Custom MAU, priority support, advanced integrations

**Strengths:**
- Lower entry price than Appcues ($174/mo vs $249/mo)
- 30-day money-back guarantee (unique in the industry)
- Free tier (Support Essentials) for knowledge base and product updates
- AI Assistant feature (50 free resolutions on free tier)
- Strong SEO content strategy -- ranks well for competitor comparison pages
- Transparent pricing calculator on website

**Weaknesses:**
- Complex pricing tiers are confusing (Starter, Growth, Professional, Corporate)
- MAU-based pricing still creates unpredictable costs
- Lower customization than code-first approaches
- Performance overhead from external SDK
- Vendor lock-in on all onboarding content
- Limited developer experience -- no headless option, no component composition

**Target Customer Overlap:**
- Moderate overlap -- UserGuiding targets small-to-mid SaaS teams
- Tour-kit wins with developer-led teams who want code control
- UserGuiding wins with non-technical product teams

**SEO and Content Strategy:**
- Aggressive comparison content ("What is X used for?" for every competitor)
- Blog targets both product managers and occasionally developers
- Publishes pricing analysis of every competitor
- Ranks for "user onboarding tool", "product tour software", "[competitor] alternative"

**Tour-Kit Counter-Positioning:**
- "$99 once vs. $2,088+/year -- save 95% in year one alone"
- "Own your onboarding code -- no SDK dependency, no vendor lock-in"
- "TypeScript-first with full design system control"

---

### Userpilot ($299+/mo)

**Features by Tier:**
- **Starter ($299/mo):** Product tours, tooltips, modals, banners, checklists, NPS, basic analytics, up to 2,000 MAU, 10 segments
- **Growth ($799+/mo):** Everything in Starter + session replays, in-app surveys, advanced analytics, unlimited segments
- **Enterprise (custom):** Everything in Growth + SSO, premium integrations, localization, dedicated CSM

**Strengths:**
- Comprehensive product analytics alongside onboarding (session replays, funnel analysis)
- Strong survey and NPS capabilities
- Good for product-led growth companies that need analytics + onboarding in one tool
- Resource center feature for self-serve support
- Chrome extension-based builder for easy flow creation

**Weaknesses:**
- Expensive -- $299/mo minimum, $799+/mo for meaningful analytics
- No free plan or free tier
- 14-day trial only
- MAU limits are restrictive (2,000 on Starter, requires Growth for more)
- Heavy SDK adds performance overhead
- Limited design customization
- Vendor lock-in on flows and analytics data

**Target Customer Overlap:**
- Low-to-moderate -- Userpilot targets product teams at growth-stage SaaS
- Tour-kit wins with teams that already use dedicated analytics (Mixpanel, Amplitude, PostHog)
- Tour-kit's @tour-kit/analytics plugin integrates with existing analytics stacks

**SEO and Content Strategy:**
- Publishes competitor pricing breakdowns and "is it worth it?" content
- Targets "product-led growth" and "user onboarding" keywords
- Blog focuses on product management and growth metrics

**Tour-Kit Counter-Positioning:**
- "$99 once vs. $3,588+/year -- integrate with the analytics tools you already pay for"
- "Tour-kit's analytics plugin works with Mixpanel, Amplitude, PostHog -- don't pay for redundant analytics"
- "Headless architecture means zero SDK performance overhead"

---

### Pendo ($1,300+/mo)

**Features by Tier:**
- **Free:** Up to 500 MAU, basic analytics, in-app guides, NPS, roadmaps
- **Base (~$7,000/year):** Expanded MAU, core analytics and guides
- **Core (~$20,000/year):** Full analytics suite, guides, NPS, roadmaps
- **Pulse (~$47,000/year):** Everything in Core + session replays, advanced features
- **Ultimate ($100,000+/year):** Full platform with all capabilities

**Strengths:**
- Most comprehensive enterprise DAP -- analytics, guides, feedback, roadmaps in one platform
- Free tier (500 MAU) provides a foothold for startups to grow into
- Strong enterprise sales motion and brand recognition
- Product analytics are genuinely best-in-class for understanding user behavior
- Retroactive analytics -- capture data even before you set up events
- Mobile SDK alongside web

**Weaknesses:**
- Extremely expensive -- most customers pay $15K-$142K/year
- Opaque pricing requires sales calls for quotes
- Heavy SDK impacts page performance
- Limited design customization on in-app guides
- Vendor lock-in is severe -- migrating away from Pendo analytics is painful
- Overkill for teams that just need onboarding flows
- Long sales cycles and annual contracts

**Target Customer Overlap:**
- Very low overlap -- Pendo targets enterprise product orgs with $50K+ budgets
- Tour-kit could capture teams that want onboarding without the analytics lock-in
- Pendo's free tier (500 MAU) is the only real overlap point

**SEO and Content Strategy:**
- Dominates "product analytics" and "digital adoption platform" keywords
- Content targets VP Product and CPO personas
- Case studies emphasize enterprise logos and ROI metrics

**Tour-Kit Counter-Positioning:**
- "If you just need onboarding, why pay $20K-$100K/year for analytics you don't need?"
- "$99 once for the onboarding features, use PostHog/Amplitude (free tiers) for analytics"
- "Zero vendor lock-in -- your onboarding lives in your codebase"

---

### Chameleon ($279+/mo)

**Features by Tier:**
- **HelpBar (Free):** CMD+K search bar, help center integration, AI-generated answers
- **Startup ($279/mo):** Tours, tooltips, microsurveys (5), launchers (1), HelpBar, unlimited demos
- **Growth (~$1,000/mo):** Everything in Startup + unlimited surveys, A/B testing, advanced targeting, 5K+ MAU
- **Enterprise (custom):** Full platform with SSO, SLA, dedicated support

**Strengths:**
- HelpBar (CMD+K) is a genuine differentiator -- free CMD+K search with AI answers
- Beautiful default UI and strong design focus
- Tours and demos are well-implemented
- Free HelpBar tier creates a growth funnel
- Good mid-market positioning between cheap tools and enterprise DAPs

**Weaknesses:**
- Expensive for what you get ($279/mo starting price)
- MTU (Monthly Tracked Users) pricing scales costs with growth
- Limited to 5 microsurveys and 1 launcher on Startup plan
- No comprehensive analytics (relies on integrations)
- Vendor lock-in on tour and survey content
- No headless/composable option

**Target Customer Overlap:**
- Moderate -- Chameleon targets mid-market SaaS product teams
- The HelpBar differentiator is unique and not something tour-kit competes with directly
- Tour-kit wins on developer experience, customization, and cost

**SEO and Content Strategy:**
- Strong blog with library comparison posts ("Top 8 React Product Tour Libraries")
- Targets "product tour" and "user onboarding" keywords
- Comparison content positions Chameleon as the "design-forward" choice

**Tour-Kit Counter-Positioning:**
- "$99 once vs. $3,348+/year for the same tour and checklist features"
- "Headless architecture gives you more design control than Chameleon's 'design-forward' platform"
- "HelpBar is cool, but a CMD+K is a 50-line component with cmdk -- you don't need a $279/mo subscription for it"

---

### ProductFruits ($96-$149/mo)

**Features by Tier:**
- **Starter ($96/mo):** Tours, tooltips, checklists, hints, banners, knowledge base, up to 3 team members
- **Pro ($149/mo):** Everything in Starter + AI-powered automation (Copilot), expanded usage limits
- **Enterprise (custom):** Custom MAU, unlimited team members, priority support

**Strengths:**
- Lowest SaaS entry price ($96/mo) -- closest SaaS price competitor to tour-kit
- No per-seat, per-domain, or per-language charges (unusual in the space)
- Comprehensive feature set even on Starter (tours, checklists, hints, banners, knowledge base)
- AI Copilot feature on Pro tier
- Good value proposition for small teams

**Weaknesses:**
- Still $1,152/year minimum vs. tour-kit's $99 one-time
- Limited to 3 team members on Starter
- MAU-based pricing still scales with growth
- Less design customization than code-first solutions
- Smaller brand recognition than Appcues/Pendo/Userpilot
- No headless/developer-first option

**Target Customer Overlap:**
- Highest overlap among SaaS competitors -- similar feature set, targets similar company size
- Tour-kit wins on price, design control, and developer experience
- ProductFruits wins on no-code access for non-developers

**SEO and Content Strategy:**
- Targets "product tour software" and "user onboarding tool" keywords
- Positions on value -- "everything included, no hidden fees"
- Smaller content marketing presence than Appcues/UserGuiding

**Tour-Kit Counter-Positioning:**
- "$99 once vs. $1,152/year -- pay once, own forever"
- "Same features (tours, hints, checklists) plus announcements, analytics, adoption tracking, media, and scheduling"
- "Full design system control with headless components"

---

## Feature Comparison Matrix

| Feature | tour-kit (Free) | tour-kit (Pro) | React Joyride | Shepherd.js | Intro.js | Driver.js | Appcues | UserGuiding | Pendo |
|---------|----------------|----------------|---------------|-------------|----------|-----------|---------|-------------|-------|
| **Product Tours** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **Hints/Hotspots** | Yes | Yes | No | No | Limited | No | Yes | Yes | Yes |
| **Checklists** | No | Yes | No | No | No | No | Growth+ | Yes | No |
| **Announcements** | No | Yes | No | No | No | No | Yes | Yes | Yes |
| **Surveys/NPS** | No | No | No | No | No | No | Yes | Yes | Yes |
| **Segmentation** | No | No | No | No | No | No | Yes | Yes | Yes |
| **A/B Testing** | No | No | No | No | No | No | Growth+ | Growth+ | Yes |
| **Resource Center** | No | No | No | No | No | No | Yes | Yes | Yes |
| **Analytics** | No | Yes | No | No | No | No | Yes | Yes | Yes |
| **Adoption Tracking** | No | Yes | No | No | No | No | No | No | Yes |
| **Media Embedding** | No | Yes | No | No | No | No | No | No | No |
| **Scheduling** | No | Yes | No | No | No | No | No | No | No |
| **AI Features** | No | No | No | No | No | No | No | Free tier | No |
| **Headless/Composable** | Yes | Yes | No | No | No | No | No | No | No |
| **React-Native API** | Yes | Yes | Yes | Wrapper | Wrapper | No | N/A | N/A | N/A |
| **TypeScript Strict** | Yes | Yes | Partial | Partial | No | Partial | N/A | N/A | N/A |
| **WCAG 2.1 AA** | Yes | Yes | Minimal | Minimal | No | No | Partial | Partial | Partial |
| **shadcn/ui Compatible** | Yes | Yes | No | No | No | No | No | No | No |
| **One-Time Pricing** | Free | $99 | Free | $50-$300 | $9.99-$299 | Free | No | No | No |
| **No-Code Builder** | No | No | No | No | No | No | Yes | Yes | Yes |

---

## Pricing Comparison

| Solution | Monthly Cost | Annual Cost | 3-Year TCO | Pricing Model |
|----------|-------------|-------------|------------|---------------|
| **tour-kit (Free)** | $0 | $0 | **$0** | Free forever (core + hints) |
| **tour-kit (Pro)** | $0 | $0 | **$99** | $99 one-time, lifetime |
| **React Joyride** | $0 | $0 | $0 | Free (MIT) |
| **Shepherd.js** | $0 | $0 | $50-$300 | Free (AGPL) / $50-$300 commercial |
| **Intro.js** | $0 | $0 | $9.99-$299 | Free (AGPL) / $9.99-$299 commercial |
| **Driver.js** | $0 | $0 | $0 | Free (MIT) |
| **Onborda** | $0 | $0 | $0 | Free (MIT) |
| **Reactour** | $0 | $0 | $0 | Free (MIT) |
| **ProductFruits** | $96 | $1,152 | **$3,456** | Per MAU, monthly |
| **UserGuiding** | $174 | $2,088 | **$6,264** | Per MAU, monthly |
| **Appcues (Essentials)** | $249 | $2,988 | **$8,964** | Per MAU, monthly |
| **Chameleon** | $279 | $3,348 | **$10,044** | Per MTU, monthly |
| **Userpilot** | $299 | $3,588 | **$10,764** | Per MAU, monthly |
| **Appcues (Growth)** | $879 | $10,548 | **$31,644** | Per MAU, monthly |
| **Pendo (Core)** | ~$1,667 | ~$20,000 | **~$60,000** | Per MAU, annual contract |
| **Pendo (Pulse)** | ~$3,917 | ~$47,000 | **~$141,000** | Per MAU, annual contract |

**The cost difference is staggering:** A team choosing tour-kit Pro ($99 one-time) over Appcues Growth ($879/mo) saves **$31,545 over 3 years**. Even against the cheapest SaaS option (ProductFruits at $96/mo), tour-kit saves **$3,357 over 3 years**.

---

## SEO Keyword Ownership

| Keyword | Current #1-3 Ranking | Tour-Kit Opportunity |
|---------|---------------------|---------------------|
| **"react product tour library"** | Chameleon blog, Whatfix blog, UserGuiding blog | High -- SaaS companies dominate with comparison content; tour-kit can rank with a dedicated guide |
| **"react onboarding library"** | OnboardJS, Whatfix, UserGuiding | High -- no OSS library owns this keyword; tour-kit docs could rank |
| **"best product tour library 2026"** | Amplitude, Storylane, LogRocket blog | Medium -- listicle content from platforms; tour-kit needs to be included in these lists |
| **"react joyride alternative"** | UserGuiding, Chameleon, Usertour | Very High -- React 19 incompatibility creates migration demand; tour-kit should own this keyword |
| **"shepherd.js alternative"** | UserGuiding, various blog posts | High -- AGPL license concerns drive searches; tour-kit's MIT license is a clear win |
| **"intro.js alternative"** | UserGuiding, Produktly | High -- AGPL + stale maintenance drives searches |
| **"how to build product tour react"** | LogRocket blog, DhiWise, Medium posts | Very High -- tutorial content with tour-kit code examples could rank well |
| **"appcues alternative"** | Userpilot, UserGuiding, various blogs | Medium -- dominated by other SaaS tools; tour-kit needs "open-source Appcues alternative" angle |
| **"open source onboarding tool"** | Usertour.io, various blogs | Very High -- few strong results; tour-kit can own this with targeted content |

**Key SEO Insight:** SaaS companies (UserGuiding, Chameleon, Whatfix, Userpilot) dominate product tour comparison content because they invest heavily in SEO. No OSS library has a strong content marketing presence. Tour-kit can differentiate by publishing developer-focused technical content (tutorials, guides, architecture deep-dives) that SaaS marketing blogs cannot credibly create.

---

## SWOT Analysis

### Strengths
- **Unique positioning:** Only headless, composable onboarding library with extended packages (checklists, announcements, analytics, adoption, media, scheduling)
- **One-time pricing:** $99 lifetime is dramatically cheaper than any SaaS and competitive with OSS commercial licenses
- **Modern stack:** React 19, TypeScript strict mode, shadcn/ui compatible, WCAG 2.1 AA
- **Developer experience:** Headless architecture, hooks-based API, composition over configuration
- **Comprehensive scope:** 8 packages cover features typically requiring $300-$800/mo SaaS subscriptions
- **No vendor lock-in:** Code lives in the customer's codebase, not behind a SaaS dashboard

### Weaknesses
- **New entrant:** No brand recognition, no GitHub stars, no npm download history yet
- **Requires developers:** Cannot serve non-technical product managers (no visual builder)
- **No no-code builder:** SaaS tools win when the buyer is a product team without React developers
- **Unproven at scale:** No enterprise case studies or production battle-testing stories
- **Content gap:** No SEO presence, no comparison pages, no blog content yet
- **Community size:** Starting from zero vs. established libraries with thousands of stars

### Opportunities
- **React 19 migration wave:** React Joyride's incompatibility with React 19 creates a natural migration moment -- hundreds of thousands of weekly installs looking for alternatives
- **AGPL fatigue:** Developers increasingly avoid AGPL-licensed tools (Shepherd.js, Intro.js); tour-kit's MIT license is a clear advantage
- **OSS library stagnation:** Reactour abandoned, Intro.js slowing, Driver.js slowing -- the category is ripe for a modern replacement
- **SaaS cost backlash:** Economic pressure drives teams to replace $3K-$100K/year SaaS subscriptions with owned solutions
- **shadcn/ui ecosystem:** Rapidly growing ecosystem has no dedicated onboarding solution -- tour-kit can become the default
- **Content marketing vacuum:** No OSS tour library invests in content; first mover advantage on developer-focused SEO
- **"[competitor] alternative" keywords:** Every competitor's weakness creates a keyword opportunity

### Threats
- **React Joyride v3 stabilizes:** If v3 achieves reliable React 19 support, the migration urgency disappears
- **SaaS tools add developer modes:** Appcues or Chameleon could add headless/code-first options
- **New competitors:** Other developers could build similar headless onboarding libraries
- **AI-native onboarding:** AI tools that auto-generate onboarding flows could disrupt code-based approaches
- **Market education cost:** Convincing teams to code their onboarding instead of using no-code tools requires significant content investment
- **Maintenance burden perception:** Solo/small-team OSS projects face skepticism about long-term maintenance

---

## Competitive Positioning Statement

### vs. OSS Libraries (React Joyride, Shepherd.js, Intro.js, Driver.js)
> "Everything they offer -- tours, hints, tooltips -- plus checklists, announcements, analytics, adoption tracking, media embedding, and scheduling. Headless and composable, built for React 19 and TypeScript strict mode, with WCAG 2.1 AA accessibility. The open-source tour libraries give you a tour widget. Tour-kit gives you a complete onboarding platform."

### vs. SaaS Platforms (Appcues, UserGuiding, Userpilot, Pendo)
> "Same features -- tours, hints, checklists, announcements, analytics -- for $99 once instead of $3,000-$100,000 per year. No MAU pricing, no vendor lock-in, no SDK performance overhead. Your onboarding lives in your codebase, styled with your design system, shipped with your deploys."

### vs. Onborda (Closest Architectural Comp)
> "Works everywhere React works, not just Next.js. Eight packages instead of one. Headless instead of opinionated. TypeScript strict mode. WCAG 2.1 AA. And a $99 Pro license that funds sustained development."

---

## Competitive Response Playbook

### "Why not just use React Joyride?"
> "Joyride is the most popular option and served the community well for years. However, it has critical React 19 compatibility issues -- it relies on deprecated APIs (`unmountComponentAtNode`, `unstable_renderSubtreeIntoContainer`) that were removed in React 19. Version 3.0.0 attempted to fix this but remains unreliable. Beyond compatibility, Joyride only provides tours -- no checklists, announcements, analytics, or hints. Tour-kit is React 19 native, headless, fully accessible, and comes with 8 additional packages. If you're starting a new project or upgrading to React 19, tour-kit is the modern choice."

### "Why not just use Shepherd.js?"
> "Shepherd is a solid library with great framework-agnostic support. Two things to consider: First, it's AGPL-licensed, which means any commercial use requires purchasing their commercial license ($50-$300) or open-sourcing your entire application. Second, its React support is a thin wrapper around vanilla JS, not a native React experience with hooks and composition. Tour-kit is MIT-licensed (free core), offers a native React API with headless components, and includes 8 packages beyond basic tours. For $99 one-time (Pro), you get more than Shepherd's $300 Enterprise tier."

### "Why not just use Intro.js?"
> "Intro.js has been around since 2013 and has the most GitHub stars in the category. However, it's AGPL-licensed (requiring a commercial license for any revenue-generating use), it's DOM-based (which conflicts with React's virtual DOM), and it hasn't had a release in 8 months. The React wrapper is maintained by a different person. Tour-kit is React-native, TypeScript-first, actively maintained, and includes checklists, announcements, analytics, and 5 more packages that Intro.js simply doesn't have."

### "Why not just use Driver.js?"
> "Driver.js is beautifully designed and impressively small (~5KB). If all you need is a lightweight highlight/focus driver and you're not using React, it's a great choice. But Driver.js is vanilla JS with no official React integration, no headless architecture, and no features beyond basic highlighting and tours. Tour-kit gives you a native React API, headless composable components, and 8 additional packages for the complete onboarding experience. Different tools for different jobs -- Driver.js is a highlighting utility; tour-kit is an onboarding platform."

### "Why not just use Appcues?"
> "Appcues is excellent if your team doesn't have React developers and needs a no-code builder. But if you do have developers -- and most teams reading this do -- you're paying $249-$879/month ($3K-$10K/year) for features you could own for $99 one-time. With tour-kit, you get full design system control (Appcues constrains you to their visual editor), zero SDK performance overhead, no MAU pricing surprises, and no vendor lock-in. Your onboarding ships with your code, not behind someone else's dashboard."

### "Why not just use UserGuiding?"
> "UserGuiding offers good value for a SaaS tool at $174/mo. But $174/mo is still $2,088/year and $6,264 over three years. Tour-kit Pro is $99 once and includes tours, hints, checklists, announcements, analytics, adoption tracking, media embedding, and scheduling. If your team can write React components, you'll have more control, better performance, and dramatically lower cost with tour-kit."

### "Why not just use Pendo?"
> "Pendo is a fantastic enterprise analytics platform that happens to include onboarding guides. If you need Pendo's analytics depth (session replays, retroactive analytics, product usage scoring), it may be worth the $20K-$100K/year investment. But if you primarily need onboarding features and already use a dedicated analytics tool (Mixpanel, Amplitude, PostHog), tour-kit gives you tours, checklists, announcements, and analytics integration for $99. Use the $19,901 you save to buy your team something nice."

### "Why not just use Onborda?"
> "Onborda is a great project that shares our love for the Next.js + shadcn/ui stack. The key differences: tour-kit works with any React setup (Next.js, Vite, Remix), not just Next.js. Tour-kit is headless, so you can use shadcn/ui without being locked to it. And tour-kit includes 8 packages (hints, checklists, announcements, analytics, adoption, media, scheduling) vs. Onborda's tours-only feature set. If you're building exclusively for Next.js and want a quick, simple tour widget, Onborda is fine. If you need a complete onboarding platform, tour-kit is the choice."

### "Why not just use ProductFruits?"
> "ProductFruits is the best-value SaaS option at $96/mo with no per-seat charges. We respect their pricing model. But $96/mo is still $1,152/year and $3,456 over three years. Tour-kit Pro is $99 one-time and includes comparable features (tours, hints, checklists, announcements) plus analytics, adoption tracking, media embedding, and scheduling. If you have React developers, tour-kit offers more features, more design control, and 97% lower cost over three years."
