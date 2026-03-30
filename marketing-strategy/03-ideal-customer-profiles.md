# Ideal Customer Profiles (ICPs)

> Every content decision, channel choice, and feature highlight in the tour-kit marketing strategy traces back to these profiles. If a marketing action doesn't serve one of these three ICPs, it doesn't get prioritized.

---

## Primary ICP: The Frontend Lead / Senior React Developer

### Who They Are

**Title:** Senior Frontend Engineer, Frontend Lead, Staff Engineer, Principal Engineer, or "the person who picks the libraries."

**Role and responsibilities:** They own the frontend architecture decisions for a product team. They evaluate, select, and integrate third-party libraries. They set coding standards, review PRs, and are the technical voice in product discussions. When the product team says "we need onboarding tours," this person decides how it gets built.

**Company size and stage:** Series A through Series C SaaS companies, 20-200 employees, 3-15 person engineering team. Revenue typically $1M-$30M ARR. The company is past the scrappy MVP phase but hasn't yet built a dedicated platform or growth engineering team. Engineering resources are scarce and expensive -- every hour of developer time has visible opportunity cost.

**Age range:** 27-38. 5-12 years of professional experience. Has been through at least one major React version migration and is tired of libraries that don't keep up.

### Tech Stack

- **Framework:** React 18/19 or Next.js 14/15 (App Router)
- **Language:** TypeScript in strict mode (non-negotiable for this persona)
- **Styling:** Tailwind CSS, increasingly with shadcn/ui as the component foundation
- **State management:** Zustand, Jotai, or React context (moved on from Redux years ago)
- **Testing:** Vitest or Jest, React Testing Library, Playwright for E2E
- **Build tooling:** Vite, Turbopack, or webpack via Next.js
- **Package manager:** pnpm or bun (npm feels legacy to them)
- **Hosting:** Vercel, AWS, or Cloudflare

This person lives in the React + TypeScript + Tailwind + shadcn/ui ecosystem. When a library doesn't fit that stack cleanly, they move on immediately.

### Pain Points with Current Solutions

| Pain Point | Context |
|-----------|---------|
| **React Joyride is showing its age** | Despite 400K+ weekly npm downloads, Joyride has had persistent React 19 compatibility issues (missing `unmountComponentAtNode`, broken peer deps). It uses inline styles that clash with Tailwind workflows, relies on the obscure `react-floater` for positioning, and the spotlight effect breaks in dark mode via `mix-blend-mode`. The v3 rewrite helps but trust is damaged. |
| **Vanilla JS libraries feel wrong in React** | Shepherd.js (Svelte-based, React wrapper feels bolted on), Driver.js (lightweight but no React-native API), Intro.js (looks outdated, commercial license required). None of these give you a hooks-based, composable React experience. |
| **SaaS tools are absurdly expensive** | Appcues starts at $249-$300/mo. Pendo averages ~$48,000/year. UserGuiding is cheaper ($69-$389/mo) but still a recurring cost for something that could be 200 lines of well-structured code. For a Series A company watching burn rate, $3,000-$10,000/year on product tours feels indefensible to engineering. |
| **SaaS tools lack developer control** | Appcues and Pendo inject scripts, require CSS overrides to look native, and create vendor lock-in. When the frontend lead wants pixel-perfect integration with their design system, SaaS tools fight them instead of helping. |
| **Accessibility is an afterthought** | Most tour libraries fail basic WCAG 2.1 AA requirements. Missing ARIA attributes, broken focus management, no keyboard navigation, no `prefers-reduced-motion` support. For teams shipping accessible products, this is a blocker. |
| **No headless option exists** | They want to own the UI completely -- render their own components, use their own design tokens, integrate with their existing tooltip/popover primitives. Every existing library forces its own UI opinions. |

### Buying Triggers

These are the moments when this person actively starts searching for a solution:

1. **New product launch or major feature release.** Product says "users need to be guided through this." Engineering needs something fast that doesn't create tech debt.
2. **Onboarding metrics are tanking.** Activation rate dropped, time-to-first-value is too long, and the PM is asking for guided flows. The team tried building it from scratch and realized it's harder than it looks (positioning, scroll management, focus trapping, step sequencing).
3. **React 19 migration breaks existing tour library.** They were using React Joyride, it broke on upgrade, and now they need a replacement that actually supports modern React.
4. **Cost-cutting initiative kills SaaS subscriptions.** Finance or the CTO is cutting $5K+/mo in SaaS spend. Appcues/Pendo is on the chopping block. Engineering is asked to find an open-source replacement.
5. **Switching to shadcn/ui-based design system.** They're rebuilding the frontend with shadcn/ui and Tailwind. The old product tour solution (which used Material UI or custom CSS) no longer fits the stack.
6. **Accessibility audit fails.** Legal or compliance flags that the product tour overlay isn't accessible. They need a solution with ARIA support baked in, not bolted on.

### Decision-Making Process

```
Day 1:    Googles "react product tour library 2026" or "react joyride alternative"
          Scans 2-3 blog posts, clicks through to GitHub repos

Day 1:    Evaluates on GitHub in under 5 minutes:
          - README quality (does it show code? is it TypeScript? does it look maintained?)
          - Star count (social proof threshold: 500+ feels safe, 2000+ feels established)
          - Last commit date (anything older than 3 months feels abandoned)
          - Issue count and response time
          - Bundle size (checks Bundlephobia)
          - License (MIT is expected)

Day 1-2:  Clones the repo or installs via npm, tries the basic example
          If it works in 15 minutes: keeps going
          If it doesn't: moves to the next option

Day 2-3:  Integrates with actual codebase (their design system, their routing)
          Tests edge cases: dynamic elements, scroll containers, multi-page flows
          Checks TypeScript types quality (are they generic? do they infer correctly?)

Week 1:   Ships a basic tour using the free tier (core + react + hints)

Week 2-8: Realizes they need analytics, checklists, or announcements
          Evaluates Pro tier: $99 one-time vs building it themselves vs SaaS alternative
          $99 is an impulse buy on a corporate card -- no procurement process needed

Week 2-8: Buys Pro. Ships extended features. Becomes an internal advocate.
```

**Key insight:** This person evaluates libraries the way they evaluate code -- through the README, the types, and a 15-minute spike. Marketing copy doesn't matter. Code quality does.

### Objections and How to Overcome Them

| Objection | Response |
|-----------|----------|
| "It doesn't have enough GitHub stars yet" | Star count correlates with age, not quality. Show real adoption signals: npm download trajectory, companies using it, quality of TypeScript types. Encourage starring -- it's a legitimate social proof mechanism. |
| "What if the maintainer abandons it?" | Tour-kit is MIT licensed. The code is yours forever. Unlike SaaS tools where your tours vanish when you cancel, tour-kit tours are just React components in your codebase. Point to the active commit history and contributor count. |
| "We should just build our own" | Building a production-grade tour system (positioning engine, scroll management, focus trapping, accessibility, keyboard navigation, persistence) takes 2-4 weeks of senior engineer time. At $80-150/hr, that's $6,400-$24,000 in eng time vs $99 for Pro or $0 for free tier. And you'll maintain it forever. |
| "React Joyride already works for us" | Does it support React 19? Does it work with your Tailwind setup without CSS hacks? Does it pass an accessibility audit? Does it support headless rendering? If the answer to any of these is no, you're accumulating tech debt. |
| "I don't trust a paid open-source library" | The free tier (core + react + hints) is fully MIT, covers 80% of use cases, and has zero limitations. Pro is for teams that need analytics, checklists, announcements, and other extended features. It's the same model as Tailwind UI, shadcn/ui pro components, and tRPC -- open core with paid extensions. |
| "$99 seems too cheap -- what's the catch?" | One-time pricing, no recurring fees, no per-seat, no MAU limits. The code ships to your `node_modules`. There's no server, no tracking, no vendor dependency. $99 is the honest price for well-engineered code when there's no SaaS infrastructure to maintain. |

### Where They Hang Out

| Channel | How They Use It | Our Play |
|---------|----------------|----------|
| **Twitter/X** | Follow React core team, library authors, tech influencers. Discover tools through threads and retweets. | Ship-in-public threads, code snippet posts, engage with React ecosystem conversations. |
| **r/reactjs** (525K+ members) | Ask for library recommendations, share projects, evaluate tools through community discussion. | Answer "what product tour library should I use?" threads honestly. Post launch announcement. Don't shill. |
| **r/nextjs** | Next.js-specific tooling questions. | Publish "How to add product tours to Next.js App Router" guide and link from Reddit. |
| **Hacker News** | Discover tools through Show HN posts. Skeptical, detail-oriented audience. | Show HN launch. Technical, no-hype framing. Acknowledge limitations upfront. |
| **This Week in React newsletter** (~40K subscribers) | Weekly digest of React ecosystem news. Primary discovery channel for new libraries. | Sponsor placement ($400/issue). Get featured in the "Libraries" section organically. |
| **GitHub Trending** | Browse trending repos weekly. Evaluate libraries by code quality. | Optimize for trending: coordinated star campaign at launch. Quality README with GIF demos. |
| **Dev.to / Hashnode** | Read tutorials, compare libraries. | Publish comparison articles: "Tour-Kit vs React Joyride," "Building Accessible Product Tours in React." |
| **Discord (Reactiflux, Next.js, shadcn/ui)** | Ask technical questions, get recommendations. | Be present and helpful. Answer onboarding/tour questions. Don't spam. |
| **YouTube** | Watch tutorials, conference talks, code-alongs. | Partner with React YouTubers (Theo, Jack Herrington, Web Dev Simplified) for review/tutorial content. |
| **Bytes newsletter** (200K+ subscribers) | Short, witty JavaScript newsletter. | Sponsorship or organic mention via newsworthy launch. |

### What They Search For (Google Keywords)

**High-intent (ready to choose):**
- "react product tour library 2026"
- "react joyride alternative"
- "react joyride react 19"
- "best react onboarding library"
- "react tour component typescript"
- "headless product tour react"
- "react step by step guide component"

**Problem-aware (know the pain, exploring solutions):**
- "how to build product tour in react"
- "react onboarding flow tutorial"
- "next.js product tour"
- "add user onboarding to react app"
- "react tooltip tour library"

**Comparison (evaluating options):**
- "react joyride vs shepherd"
- "react joyride vs reactour"
- "appcues alternative open source"
- "pendo alternative react"
- "product tour library comparison"

**Cost-driven (triggered by SaaS spend review):**
- "appcues alternative free"
- "open source appcues"
- "self hosted product tour"
- "product tour without saas"
- "appcues too expensive"

---

## Secondary ICP: The Solo Founder / Indie Hacker

### Who They Are

**Title:** Founder, Solo Developer, Indie Hacker, "I do everything myself."

**Profile:** Building a SaaS product solo or with 1-2 co-founders. Typically a full-stack developer who chose React/Next.js because it's the fastest path to a shipped product. Revenue: $0-$30K MRR. May or may not have raised money -- many are bootstrapped.

**Age range:** 24-40. Technical enough to build the product, business-minded enough to care about activation rates and onboarding UX.

### What Makes Them Different from the Primary ICP

- They don't evaluate libraries for a team -- they evaluate for themselves
- Decision time is 15 minutes, not a week. If the `npx` command works, they're in
- They don't have a design system. They're using shadcn/ui because it's the fastest way to look professional
- Every dollar matters. A $300/mo SaaS tool is a meaningful percentage of revenue
- They're building in public and sharing their stack decisions on Twitter/X

### Tech Stack

The "2025-2026 indie stack":
- Next.js 14/15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma or Drizzle
- Vercel for hosting
- Stripe for payments
- Better Auth or Clerk for authentication

This is remarkably uniform -- the indie hacker stack has converged, and tour-kit is built for exactly this stack.

### Pain Points

| Pain Point | Context |
|-----------|---------|
| **SaaS tools eat into slim margins** | At $5K MRR, paying $300/mo for Appcues is 6% of revenue. That's unacceptable. |
| **Subscription fatigue is real** | They already pay for hosting, auth, email, analytics, error tracking, and a dozen other services. Another monthly subscription is psychologically painful. |
| **Need something that works in an afternoon** | They can't spend a week evaluating libraries. Time is their scarcest resource. If the getting-started guide doesn't have them shipping in 30 minutes, they'll build a janky custom solution instead. |
| **Want it to look native to shadcn/ui** | Their entire UI is shadcn/ui. A tour library that introduces visual inconsistency (different shadows, different borders, different animations) looks unprofessional. Headless + shadcn/ui primitives = perfect fit. |
| **Building in public means the stack gets visibility** | When they tweet "Just added onboarding tours to my SaaS using @tour_kit -- took 20 minutes," that's organic marketing for both of us. |

### Buying Triggers

1. **Launched on Product Hunt and got feedback that onboarding is confusing.** Users are signing up but not activating. They need guided tours immediately.
2. **Hit $1K MRR and want to optimize activation.** Now taking the business seriously. Onboarding is the lowest-hanging fruit.
3. **Saw another indie hacker share their tour-kit setup on Twitter.** Social proof from a peer is the strongest signal.
4. **Evaluating their SaaS stack for one-time vs recurring costs.** Moving from Appcues to tour-kit saves $3,000-$10,000/year.

### Decision-Making Process

```
Minute 0:    Sees tweet, Reddit post, or HN comment mentioning tour-kit
Minute 2:    Opens GitHub README, scans for shadcn/ui mention and code example
Minute 5:    Runs `pnpm add @tour-kit/react` in their project
Minute 15:   First tour is working in their app
Minute 30:   Customized to match their shadcn/ui theme
Day 2-7:     Realizes they want analytics or checklists
Day 7:       Buys Pro for $99. Expense it? No. Personal card. It's $99.
```

**Key insight:** The entire evaluation-to-purchase funnel is measured in minutes, not weeks. The getting-started experience IS the sales pitch.

### Objections and How to Overcome Them

| Objection | Response |
|-----------|----------|
| "The free tier might be enough forever" | Great! That's the point. If free solves your problem, use it. When your product grows and you need analytics, checklists, or announcements, Pro is $99. We're not going to artificially cripple the free tier to force upgrades. |
| "I can build this myself in a weekend" | You can build basic tooltips in a weekend. You can't build scroll-aware positioning, focus trapping, keyboard navigation, ARIA compliance, persistence, multi-page tours, and a step sequencing engine in a weekend. We've spent months so you don't have to. |
| "$99 is still money when I'm pre-revenue" | Start with the free tier. It's genuinely powerful. Buy Pro when you have revenue to justify it. There's no time limit on the free tier. |

### Where They Hang Out

| Channel | Priority |
|---------|----------|
| **Twitter/X (Indie Hacker Twitter)** | Primary. They live here. Follow @levelsio, @marc_louvion, @tdinh_me. Share stack decisions publicly. |
| **Indie Hackers forum** | Active for product discussions, milestone sharing, tool recommendations. |
| **Product Hunt** | Both as a launch platform for their product and as a discovery channel for tools. |
| **r/SaaS, r/indiehackers** | Ask for tool recommendations, share MRR milestones, discuss stack choices. |
| **YouTube (indie SaaS builders)** | Watch channels like Simon Hoiberg, Marc Lou, Fireship for tool recommendations. |
| **Hacker News** | Read Show HN posts. Aspire to post their own. Trust the community's judgment. |

### What They Search For

- "best product tour for nextjs"
- "add onboarding tour shadcn ui"
- "react tour library free"
- "product tour one time price"
- "appcues alternative cheap"
- "saas onboarding tutorial react"
- "how to improve saas activation rate"

---

## Tertiary ICP: The Product Manager / Growth Lead

### Who They Are

**Title:** Product Manager, Head of Product, Growth Lead, Head of Growth, Product Marketing Manager.

**Profile:** Non-technical or semi-technical. They don't write React code, but they evaluate and champion tools. They're currently managing product tours through a SaaS platform (Appcues, Pendo, UserGuiding, Chameleon) and feeling the pain of cost, limitations, or both.

**Company size:** 50-500 employees. $5M-$100M ARR. Has a dedicated product team and an engineering team they need to convince.

### What Makes Them Different

- They don't install npm packages -- they write requirements and convince engineering
- They care about outcomes (activation rate, time-to-value) not implementation details
- They manage a tool budget and are under pressure to reduce it
- They need to justify the switch to both engineering (technical merit) and finance (cost savings)
- They've used the WYSIWYG editors in Appcues/Pendo and may worry about losing that

### Current Tool Stack and Spending

| Tool | Monthly Cost | Annual Cost | What They Use It For |
|------|-------------|-------------|---------------------|
| Appcues | $249-$879/mo | $3,000-$10,500/yr | Onboarding tours, tooltips, checklists, announcements |
| Pendo | ~$4,000/mo (avg) | ~$48,000/yr | Product analytics + guides (often overpaying for bundled analytics they don't use) |
| UserGuiding | $69-$389/mo | $828-$4,668/yr | Budget-friendly onboarding tours |
| Chameleon | $279-$999/mo | $3,348-$11,988/yr | In-app messaging and tours |

**The pattern:** They're spending $3,000-$48,000/year on product tour functionality. Tour-kit Pro at $99 one-time is a 97-99% cost reduction. That number gets finance excited.

### Pain Points

| Pain Point | Context |
|-----------|---------|
| **SaaS costs are escalating** | MAU-based pricing means costs grow with success. A startup that grew from 5K to 50K MAUs saw their Appcues bill go from $249/mo to $879/mo without changing their usage. |
| **Vendor lock-in is real** | All tours, checklists, and announcements live inside the SaaS vendor. Switching means rebuilding everything from scratch. This creates a hostage situation they resent. |
| **Limited customization frustrates engineering** | The WYSIWYG editor produces tours that don't match the product's design system. Engineering has to write CSS hacks to make Pendo guides look native. This creates friction between product and engineering. |
| **Performance impact** | SaaS tools inject third-party scripts that add 50-200KB to the page and can cause layout shifts. Engineering complains about Core Web Vitals impact. |
| **They need engineering help anyway** | Appcues and Pendo promise "no-code" but in practice, targeting dynamic elements, handling SPAs, and custom styling all require engineering involvement. The "no-code" promise is a marketing claim, not reality. |

### Buying Triggers

1. **Annual SaaS budget review.** Finance is cutting costs. Product tour tools are on the list because the ROI is hard to quantify.
2. **Engineering pushback on SaaS tool performance.** The frontend team is complaining about Pendo's script slowing down the app. LCP and CLS scores are suffering.
3. **Product redesign or design system migration.** Moving to a new design system (shadcn/ui, Radix) and the SaaS tool's styling can't keep up.
4. **Merger/acquisition due diligence.** Buyer wants to reduce SaaS spend and vendor dependencies.
5. **Competitor launched better onboarding.** They need to upgrade their onboarding but can't justify increasing the budget for the current SaaS tool.

### Decision-Making Process

```
Week 1:     Googles "appcues alternatives 2026" or "cheaper alternative to pendo"
            Reads G2/Capterra comparison reviews
            Asks peers in Slack communities or LinkedIn groups

Week 2:     Creates a shortlist (3-4 options)
            Writes an internal doc comparing features, pricing, and migration effort

Week 3:     Presents to engineering lead: "What do you think of this?"
            Engineering evaluates technical fit (this is where our Primary ICP takes over)

Week 4-6:   Engineering spikes on tour-kit free tier
            PM sees it working in the staging environment

Week 6-8:   PM builds the business case:
            - Current cost: $X,000/year
            - Tour-kit Pro cost: $99 one-time
            - Engineering migration effort: 2-3 days
            - Annual savings: $X,000/year minus $99

Week 8:     Gets approval. Engineering buys Pro and migrates.
```

**Key insight:** The PM discovers and champions, but the engineer decides and buys. Our content needs to serve both: ROI calculators and comparison pages for the PM, technical docs and code quality for the engineer.

### Objections and How to Overcome Them

| Objection | Response |
|-----------|----------|
| "We lose the no-code editor" | The reality is your engineers are already involved in styling and targeting. Tour-kit makes that explicit rather than pretending otherwise. For teams with engineering resources (which you have), code-first is faster and more maintainable than WYSIWYG. |
| "Migration will take too long" | Provide a migration guide from Appcues/Pendo to tour-kit. Typical migration: 2-3 days for a mid-size app. The annual savings pay for the migration time in the first month. |
| "What about analytics and reporting?" | Tour-kit Pro includes the analytics package with plugin support for PostHog, Mixpanel, Amplitude, and custom integrations. You keep your existing analytics stack and get tour-specific events piped directly in. No separate dashboard to check. |
| "Our company needs enterprise support" | Acknowledge this gap honestly. Tour-kit is ideal for teams with frontend engineering capability. If you need 24/7 phone support and SLA guarantees, Pendo or WalkMe might be a better fit today. Honesty builds trust. |
| "I can't justify switching based on cost alone" | It's not just cost. It's: native design system integration, zero performance impact (no third-party scripts), full accessibility compliance, no MAU limits, no vendor lock-in, and engineering actually enjoys working with it. Cost savings is the cherry on top. |

### Where They Hang Out

| Channel | Priority |
|---------|----------|
| **Google Search** | Primary discovery. Searching for alternatives, comparisons, and reviews. |
| **G2, Capterra, Product Hunt** | Reading and writing reviews. Comparing tools. |
| **LinkedIn** | Following product leaders, reading about PLG strategies. |
| **Lenny's Newsletter / Reforge** | Product management thought leadership. |
| **Slack communities** (Product-Led Growth, Mind the Product) | Asking peers for tool recommendations. |
| **Twitter/X** | Following product thought leaders. Less active than developers. |

### What They Search For

- "appcues alternative 2026"
- "pendo alternative cheaper"
- "best product tour software comparison"
- "reduce onboarding tool costs"
- "open source product tour platform"
- "appcues vs userguiding vs pendo pricing"
- "product tour tool for react apps"
- "in-app guidance tools comparison"
- "self-hosted onboarding tool"
- "product tour software G2 reviews"

---

## Anti-Personas (Who We Don't Target)

Knowing who we don't serve is as important as knowing who we do. These are audiences we will not invest marketing resources to reach, and we will be honest when they ask if tour-kit is right for them.

### 1. Enterprise Companies Needing No-Code Builders

**Who they are:** 500+ employees, non-technical product teams building tours via drag-and-drop WYSIWYG editors, need SOC 2 compliance, SSO, audit trails, role-based access control, and enterprise SLAs.

**Why not us:** Tour-kit is code-first by design. There is no visual editor and no plans for one. These teams should use WalkMe, Whatfix, or Pendo Enterprise. Trying to serve them would dilute our developer-first positioning.

**What to say when they ask:** "Tour-kit is built for engineering teams that want full control through code. If your team needs a visual, no-code builder, we'd recommend looking at WalkMe or Pendo -- they're purpose-built for that workflow."

### 2. Teams Without React

**Who they are:** Teams using Vue, Angular, Svelte, vanilla JS, or server-rendered frameworks like Laravel Blade or Rails ERB.

**Why not us:** Tour-kit's component model, hooks, and context-based architecture are fundamentally React-native. A Vue wrapper would be a second-class citizen, not a first-class experience. Shepherd.js or Driver.js serve these teams better today.

**What to say when they ask:** "Tour-kit is React-first. For Vue or Angular projects, we'd recommend Shepherd.js. If there's enough community demand, framework adapters might come in the future, but React is our focus."

### 3. Teams Needing Desktop App Overlays

**Who they are:** Companies building Electron apps, desktop software, or hybrid desktop/web products that need overlays on native UI elements.

**Why not us:** Tour-kit renders in the browser DOM. It doesn't hook into native desktop rendering, OS-level overlays, or Electron's multi-window architecture.

**What to say when they ask:** "Tour-kit is web-only. For desktop app walkthroughs, you'll need a solution designed for native overlays."

### 4. Companies Requiring SOC 2 / HIPAA Compliance Tooling

**Who they are:** Healthcare, finance, and regulated-industry companies that need vendor compliance certifications, data processing agreements, and audit-ready documentation.

**Why not us:** Tour-kit is a client-side library with no server component, no data collection, and no cloud infrastructure. This is actually a privacy advantage (zero data leaves the browser), but we can't provide SOC 2 reports because there's no service to audit. Companies with compliance checklists that require vendor certifications will need a SaaS tool that provides those documents.

**What to say when they ask:** "Tour-kit runs entirely in the browser -- no data is sent to any server, which is actually the strongest privacy position possible. However, if your procurement process requires vendor SOC 2 certification, we can't provide that because there's no cloud service to certify. Your security team may actually prefer this architecture."

### 5. Non-Technical Marketers Working Without Engineering Support

**Who they are:** Growth marketers or product marketers at companies where engineering is a bottleneck and they need to ship tours independently using a visual builder.

**Why not us:** Tour-kit requires writing React code. Without engineering involvement, these users can't implement or modify tours. Appcues and UserGuiding are purpose-built for this workflow.

**What to say when they ask:** "Tour-kit requires React development skills. If you need to build tours without engineering involvement, tools like Appcues or UserGuiding offer visual builders designed for that use case."

---

## Buyer Journey Map

### Primary ICP: Frontend Lead / Senior React Developer

| Stage | What Happens | Tour-Kit Touchpoint | Key Content |
|-------|-------------|---------------------|-------------|
| **1. Awareness** | Existing tour library breaks on React 19 upgrade. Or PM asks for onboarding flows and they start researching. Or they see a tweet about tour-kit. | Twitter/X post, HN Show HN, r/reactjs thread, This Week in React mention | "Headless product tours for React -- built for the shadcn/ui era" |
| **2. Consideration** | Opens GitHub repo. Reads README. Checks stars, commits, TypeScript quality. Scans docs site. Compares to React Joyride, Shepherd, Reactour. | GitHub README, docs site, comparison pages ("Tour-Kit vs React Joyride"), interactive examples | Side-by-side code comparison. Bundle size comparison. Feature matrix. Accessibility compliance checklist. |
| **3. Decision** | Installs free tier. Tries it in their project for 15-30 minutes. Types feel right. Positioning works. Integrates with their design system cleanly. | `pnpm add @tour-kit/react` experience, getting-started guide, TypeScript autocompletion quality | "Working tour in 5 minutes" tutorial. shadcn/ui integration example. |
| **4. Activation** | Ships first tour to production. Team sees it working. PM is happy. Other engineers start using it. | First production tour shipped. Docs for advanced patterns (multi-page tours, conditional steps, persistence). | "Advanced patterns" guide. "Integrating with Next.js App Router" guide. |
| **5. Expansion** | Needs analytics on tour completion. Wants onboarding checklists. Needs announcement banners. Free tier doesn't cover these. | Pro tier pricing page. Feature comparison (free vs Pro). | ROI calculator: "$99 once vs build-it-yourself cost." Package-by-package feature breakdown. |

### Secondary ICP: Solo Founder / Indie Hacker

| Stage | What Happens | Tour-Kit Touchpoint | Key Content |
|-------|-------------|---------------------|-------------|
| **1. Awareness** | Sees a peer tweet "Just added tours to my SaaS with @tour_kit." Or Googles "add onboarding to nextjs." | Twitter/X indie hacker community, Product Hunt launch, "best tools for SaaS" listicles | "Ship onboarding tours in 20 minutes, not 20 days" |
| **2. Consideration** | Clicks through to GitHub. Sees shadcn/ui compatibility. Sees "free tier = core + react + hints." Sees $99 one-time for Pro. | GitHub README (must mention shadcn/ui prominently), pricing clarity on docs site | "Built for the Next.js + shadcn/ui stack" messaging. Clear free vs Pro comparison. |
| **3. Decision** | Installs and tries in under 15 minutes. It works. It matches their shadcn/ui theme. Decision made. | npm install experience, "Quick Start" that actually takes 5 minutes | Minimal, copy-paste-ready getting started guide. No configuration rabbit holes. |
| **4. Activation** | First tour live in production. Tweets about it. Screenshots in their build-in-public thread. | Production tour shipped. Social share moment. | Tweetable one-liner. "Built with tour-kit" badge for their site (optional, organic). |
| **5. Expansion** | Product grows. Needs checklists for multi-step onboarding. Needs analytics to track completion. $99 is obvious. | Pro pricing page. "Solo founder to growing team" upgrade narrative. | "You've outgrown the free tier -- and that's a good problem. $99, once, forever." |

### Tertiary ICP: Product Manager / Growth Lead

| Stage | What Happens | Tour-Kit Touchpoint | Key Content |
|-------|-------------|---------------------|-------------|
| **1. Awareness** | Appcues bill increases (again). Or annual budget review puts tool costs under scrutiny. Or engineering complains about SaaS tool performance. | Google search results for "appcues alternative," G2 comparison pages, peer recommendation in Slack community | "Stop paying $300/mo for product tours. $99, once, forever." |
| **2. Consideration** | Reads comparison page. Builds internal evaluation doc. Compares features, pricing, migration effort. Shares with engineering lead. | "Tour-Kit vs Appcues" comparison page, ROI calculator, migration guide overview | Feature comparison matrix. Total cost of ownership calculator. Case study / testimonial from similar company. |
| **3. Decision** | Engineering lead evaluates technical fit (becomes Primary ICP journey). PM builds business case. Finance approves based on cost savings. | Business case template. Engineering spike results. | "Switching from Appcues: A Guide for Product Teams" -- covers both the business case and the technical migration. |
| **4. Activation** | Engineering migrates existing tours. PM sees new tours working in staging. Ships to production. | Migration guide (Appcues-to-tour-kit, Pendo-to-tour-kit). Post-migration checklist. | Step-by-step migration guide. "What to expect in the first week after switching." |
| **5. Expansion** | Wants more packages (announcements, checklists, scheduling). Already has Pro from initial purchase. Expansion is about adoption of additional packages. | Package documentation. "What's possible with Pro" showcase. | "You bought Pro for tours -- here's what else you can do: announcements, checklists, adoption tracking, scheduling..." |

---

## Messaging by ICP

### Primary ICP: Frontend Lead / Senior React Developer

**The one sentence that gets their attention:**
> "Headless product tours for React -- hooks-based, accessible, and built for the shadcn/ui era."

**The value prop that matters most:**
Developer experience and architectural fit. This person cares that tour-kit is TypeScript-strict, hooks-based, composable, headless-first, and works natively with their React + Tailwind + shadcn/ui stack. They want to own the UI, not fight a library's opinions.

**The objection they'll raise:**
"It's new and doesn't have the community/ecosystem that React Joyride has."

**The response:**
"React Joyride has 400K weekly downloads and years of history. It also has years of accumulated design decisions that don't fit modern React patterns -- inline styles instead of Tailwind, a custom positioning library instead of Floating UI, and accessibility gaps that require manual patching. Tour-kit is built from scratch for how React developers build in 2026: hooks for logic, your components for UI, and accessibility that passes audits without extra work. Try the free tier for 15 minutes -- the code will speak for itself."

---

### Secondary ICP: Solo Founder / Indie Hacker

**The one sentence that gets their attention:**
> "Product tours for your Next.js SaaS. Free tier forever. Pro is $99 once -- not $300/month."

**The value prop that matters most:**
Speed and cost. This person wants to add onboarding tours in an afternoon and never think about it again. They want it to look native to their shadcn/ui setup. And they absolutely do not want another monthly subscription.

**The objection they'll raise:**
"The free tier is probably enough for me."

**The response:**
"That's exactly how it should work. The free tier covers tours, hints, and beacons -- everything most indie products need. If you ever need analytics tracking, onboarding checklists, product announcements, or media embeds, Pro is $99 one-time. No rush. No trial expiration. Build your product first."

---

### Tertiary ICP: Product Manager / Growth Lead

**The one sentence that gets their attention:**
> "Replace your $300/month Appcues subscription with a $99 one-time purchase your engineering team will actually enjoy using."

**The value prop that matters most:**
Cost elimination plus engineering buy-in. This person needs to reduce SaaS spend AND get engineering to agree to the switch. Tour-kit solves both: 97%+ cost reduction and a developer experience that engineers actively prefer over SaaS tools.

**The objection they'll raise:**
"We lose the visual editor, and I won't be able to create tours myself anymore."

**The response:**
"Be honest: how often do you create tours without engineering involvement today? Most Appcues and Pendo users report needing CSS help, dynamic element targeting, and SPA routing fixes from engineering for every non-trivial tour. Tour-kit makes the engineering involvement explicit rather than hidden. The result: tours that match your design system perfectly, load instantly (no third-party scripts), and cost $99 instead of $3,600-$10,500 per year. Your engineers will ship tours faster because they're working with tools they already know -- React, TypeScript, and their existing component library."

---

## How to Use This Document

1. **Content creation:** Every blog post, tutorial, and comparison page should target one specific ICP. Tag it internally. If a piece of content doesn't serve a named ICP, question whether it's worth creating.

2. **Channel selection:** Allocate marketing time proportionally: 50% to Primary ICP channels (Twitter/X, r/reactjs, HN, This Week in React), 30% to Secondary ICP channels (indie hacker Twitter, Product Hunt, r/SaaS), 20% to Tertiary ICP channels (Google SEO, G2, comparison pages).

3. **Feature prioritization:** When deciding which features to highlight in marketing, ask: "Which ICP does this serve?" Analytics and checklists serve the Tertiary ICP's migration needs. shadcn/ui integration and headless APIs serve the Primary ICP's architectural requirements. Quick setup serves the Secondary ICP's speed needs.

4. **Objection handling:** Sales conversations (even async ones via GitHub issues or Discord) should use the objection/response pairs above. Keep them updated as new objections surface.

5. **Anti-persona filtering:** When someone from an anti-persona segment asks about tour-kit, use the prepared responses. Being honest about who we don't serve builds more trust than overpromising and underdelivering.

6. **Keyword targeting:** The search terms listed for each ICP should directly feed into the SEO & Content Strategy (document 06). Every high-intent keyword should have a dedicated page or section ranking for it.
