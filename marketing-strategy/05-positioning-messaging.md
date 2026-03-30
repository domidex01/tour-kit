# Positioning & Messaging Framework

> The single source of truth for how we talk about tour-kit everywhere. Every page, post, README, and conversation draws from this document.

---

## Positioning Statement

**For React developers building SaaS products**, tour-kit is the **headless onboarding toolkit** that gives you **full control over your UI while handling all the complex logic** — unlike SaaS platforms that charge $300/month for an iframe overlay, or legacy open-source libraries that force their styles on you — because tour-kit is **built natively for the shadcn/ui stack, fully typed, accessible by default, and costs $99 once instead of forever.**

### Compressed Version (for internal alignment)

Tour-kit is the open-source, headless alternative to Appcues for React teams who want to own their onboarding UI.

---

## One-Liners

Use these across different channels. Pick the one that fits the context.

| # | One-Liner | Best For |
|---|-----------|----------|
| 1 | Headless product tours and onboarding for React. | GitHub repo description |
| 2 | The open-source Appcues for React developers. | Twitter bio, HN comments |
| 3 | Product tours that look like your app, not an iframe. | Conference intro, cold outreach |
| 4 | Ship onboarding flows without $300/month SaaS bills. | Indie hacker communities |
| 5 | shadcn/ui-native product tours, hints, and checklists. | React ecosystem channels |
| 6 | Own your onboarding UI. We handle the logic. | Landing page hero alternative |
| 7 | $99 once. Not $300/month. Full onboarding toolkit. | Pricing conversations, email signatures |

---

## Elevator Pitch

### 30-Second Version

Tour-kit is a headless React library for product tours and onboarding. You write the UI with your own components — shadcn/ui, Radix, whatever you use — and tour-kit handles positioning, step sequencing, keyboard navigation, focus management, and accessibility. The core is free and MIT-licensed. Extended packages for analytics, checklists, announcements, and more cost $99 one-time. No subscriptions. No per-seat pricing. No iframe overlays that look nothing like your app.

### 60-Second Version

If you're building a SaaS product in React, you've probably looked at onboarding tools. The SaaS platforms — Appcues, Pendo, WalkMe — charge $250 to $900 a month and inject overlays that don't match your design system. The open-source options — React Joyride, Shepherd.js — give you a tooltip with their styles baked in. Tour-kit takes a different approach. It's headless. You bring your own UI components. If you use shadcn/ui, it works natively with your existing primitives. The core library gives you hooks and utilities for tours, hints, and spotlights — all free, MIT-licensed, under 8KB gzipped. When you need more — analytics integration, onboarding checklists, product announcements, feature adoption tracking — the Pro tier is $99, paid once. That's less than one month of Appcues. It's fully typed in TypeScript strict mode, accessible to WCAG 2.1 AA, and designed so your onboarding looks like it belongs in your product, not like a third-party widget sitting on top of it.

### 2-Minute Version (Blog Intros, Conference Openings)

Every SaaS product needs onboarding, but the tools available force you into a bad tradeoff. On one side, you have SaaS platforms like Appcues, UserGuiding, and Pendo. They give you a WYSIWYG editor and analytics dashboard, but they cost $250 to $900 per month, inject third-party scripts, and render overlays that look nothing like your design system. Your product team can build tours without code, but your engineering team cringes every time they see a tooltip with someone else's border radius.

On the other side, you have open-source libraries like React Joyride and Shepherd.js. They're free, but they come with their own styling opinions, limited accessibility support, and no path to the extended features — checklists, announcements, analytics — that a real onboarding system needs. So you end up either paying SaaS prices forever or building half of it yourself.

Tour-kit exists to end that tradeoff. It's a headless React library: you get hooks and utilities that handle all the complex logic — step sequencing, element positioning, scroll handling, focus traps, keyboard navigation, screen reader announcements — and you provide the UI. If you use shadcn/ui, it works natively with your existing components. If you use something else, it works with that too.

The core packages — tours, hints, and spotlights — are free and MIT-licensed. When your product matures and you need analytics integration, onboarding checklists, product announcements, feature adoption tracking, media embedding, or time-based scheduling, the Pro tier gives you all of that for $99. Paid once. No subscriptions, no per-seat fees, no annual contracts. That's less than a single month of any SaaS alternative.

It's built in TypeScript strict mode with full type inference, accessible to WCAG 2.1 AA out of the box, and the entire core is under 8KB gzipped. Your onboarding finally looks and feels like it belongs in your product.

---

## Core Value Propositions

### 1. Headless & Composable — You Own the UI, We Handle the Logic

**Headline:** Your components. Your styles. Our engine.

**Proof point:** Tour-kit's core is a set of React hooks and utilities — no DOM rendering, no CSS injection, no style conflicts. The `useTour` hook gives you full state control. Wrap it in whatever UI you want.

**Code example:**
```tsx
import { useTour } from '@tour-kit/core';

function MyCustomTooltip() {
  const { currentStep, next, prev, isActive } = useTour('onboarding');

  if (!isActive) return null;

  return (
    <YourDesignSystemPopover>
      <h3>{currentStep.title}</h3>
      <p>{currentStep.content}</p>
      <YourButton onClick={next}>Next</YourButton>
    </YourDesignSystemPopover>
  );
}
```

**Why it matters:** SaaS platforms inject iframes and overlays that clash with your design system. Legacy libraries force their CSS. Tour-kit gives you hooks, not opinions.

---

### 2. shadcn/ui Native — Built for the Modern React Stack

**Headline:** First-class shadcn/ui support. Copy-paste philosophy included.

**Proof point:** Tour-kit follows shadcn/ui's composition patterns and uses the same Radix UI primitives. The `@tour-kit/react` package provides pre-built styled components that match shadcn conventions — or go fully headless and use your own.

**Code example:**
```tsx
import { Tour, TourStep } from '@tour-kit/react';

<Tour id="onboarding" autoStart>
  <TourStep
    id="welcome"
    target="#welcome-btn"
    title="Welcome!"
    content="Let's take a quick tour."
    placement="bottom"
  />
</Tour>
```

**Why it matters:** shadcn/ui is the most popular React component approach in 2025-2026. Tour-kit is the first onboarding library built natively for that ecosystem, not bolted on after the fact.

---

### 3. $99 Once, Not $300/Month — SaaS Features at Indie Pricing

**Headline:** Pay once. Ship forever. No invoice surprise next month.

**Proof point:** Appcues starts at $249/month. UserGuiding at $89/month. Pendo doesn't even publish pricing (it's north of $500/month). Tour-kit Pro is $99 total — one payment, lifetime updates, 5 production sites.

**The math:**
| Tool | Year 1 Cost | Year 3 Cost |
|------|------------|------------|
| Appcues | $2,988 | $8,964 |
| UserGuiding | $1,068 | $3,204 |
| Pendo | ~$6,000+ | ~$18,000+ |
| **Tour-kit Pro** | **$99** | **$99** |

**Why it matters:** For indie hackers and small teams, SaaS onboarding tools are absurdly expensive for what they do. For funded startups, it's still money better spent on your product. One-time pricing removes the "should we keep paying for this?" conversation from every budget review.

---

### 4. TypeScript-First — Full Type Safety, Strict Mode, Inference Everywhere

**Headline:** Autocomplete that actually works. Errors at build time, not runtime.

**Proof point:** TypeScript strict mode across all packages. Generic step types, discriminated unions for events, and full inference for tour configuration. No `any` types, no `@ts-ignore` hacks.

**Code example:**
```tsx
// Step IDs are typed — typos caught at compile time
const steps = [
  { id: 'welcome' as const, target: '#welcome', title: 'Welcome' },
  { id: 'dashboard' as const, target: '#dash', title: 'Dashboard' },
] satisfies TourStep[];

// Event handlers know exactly which step fired
onStepChange={(step) => {
  // step.id is 'welcome' | 'dashboard', not string
}}
```

**Why it matters:** Most tour libraries were written before TypeScript was mainstream. Their types are bolted on — loose, incomplete, full of `any`. Tour-kit was written in strict mode from day one.

---

### 5. Accessibility Built-In — WCAG 2.1 AA, Not an Afterthought

**Headline:** Screen readers, keyboard nav, focus traps. All handled.

**Proof point:** Every component ships with ARIA attributes, focus management, keyboard navigation (arrow keys, Escape to close, Tab to navigate), and respects `prefers-reduced-motion`. Targets Lighthouse Accessibility score of 100.

**What's included out of the box:**
- Focus traps that return focus to the trigger element on close
- `aria-live` announcements for step changes
- Full keyboard navigation (arrows, Tab, Escape, Enter)
- `prefers-reduced-motion` support — animations disabled automatically
- Semantic HTML structure for screen reader compatibility

**Why it matters:** Accessibility lawsuits are increasing. WCAG compliance is a legal requirement in many jurisdictions. Most tour libraries treat a11y as optional. Tour-kit makes it impossible to ship an inaccessible tour without deliberately overriding the defaults.

---

### 6. Beyond Tours — Checklists, Announcements, Analytics, and More

**Headline:** A full onboarding toolkit, not just tooltips.

**Proof point:** Six extended packages cover the complete onboarding lifecycle:

| Package | What It Does |
|---------|-------------|
| `@tour-kit/analytics` | Plugin-based integration (PostHog, Mixpanel, Amplitude, custom) |
| `@tour-kit/checklists` | Task lists with dependencies, progress tracking |
| `@tour-kit/announcements` | Modals, toasts, banners, slideouts, spotlights |
| `@tour-kit/adoption` | Feature adoption tracking and nudge system |
| `@tour-kit/media` | YouTube, Vimeo, Loom, Wistia, GIF, Lottie embeds |
| `@tour-kit/scheduling` | Time-based scheduling with timezone support |

**Why it matters:** Product tours alone don't drive activation. Real onboarding needs checklists ("Complete 3 of 5 steps"), announcements ("New feature shipped!"), adoption tracking ("User hasn't tried feature X"), and analytics ("Where do users drop off?"). SaaS tools charge hundreds per month for this. Tour-kit Pro bundles it all for $99.

---

## Messaging by Audience

### For Senior React Developers

**What they care about:** Code quality, developer experience, bundle size, composability, no vendor lock-in, clean APIs.

**Lead message:** Tour-kit is headless hooks and utilities for onboarding — you write the UI, we handle positioning, focus management, and state. TypeScript strict mode, tree-shakeable, under 8KB gzipped.

**Supporting points:**
- Composition-first API — small hooks that compose, not a monolithic component with 50 props
- Zero runtime CSS injection — no style conflicts, no specificity wars
- Full control over rendering — render props, headless hooks, or use our styled components
- Tree-shakeable ESM + CJS builds via tsup
- Bundle size budgets enforced: core < 8KB, react < 12KB, hints < 5KB (gzipped)
- No wrapper divs, no portals unless you opt in, no DOM pollution

**Tone:** Technical, specific, show-don't-tell. Lead with code samples, not marketing claims.

---

### For Engineering Managers / Tech Leads

**What they care about:** Maintenance burden, team productivity, documentation quality, long-term viability, upgrade costs.

**Lead message:** Tour-kit replaces your SaaS onboarding subscription with an open-source library your team controls. MIT-licensed core, one-time $99 for extended features, full TypeScript coverage, and documentation good enough that junior devs can ship tours on day one.

**Supporting points:**
- No vendor dependency — MIT-licensed core means no "they raised prices" or "they got acquired" risk
- Onboard new team members faster with TypeScript intellisense and comprehensive docs
- No monthly invoices to justify in budget reviews — $99 once and done
- Accessibility compliance built in — one less audit item for your team
- Monorepo-friendly — install only what you need, tree-shake the rest
- Changesets-based versioning — predictable, documented upgrade paths

**Tone:** Pragmatic, ROI-focused. Emphasize reduced maintenance burden and cost predictability.

---

### For Product Managers

**What they care about:** Feature parity with SaaS tools, analytics, ease of requesting changes, cost savings, speed to value.

**Lead message:** Tour-kit gives your engineering team a toolkit to build onboarding flows that match your design system — with analytics, checklists, and announcements — for a one-time $99 instead of $3,000+/year in SaaS fees.

**Supporting points:**
- Feature parity with $300/month tools: tours, checklists, announcements, adoption tracking, analytics
- Analytics integration with tools you already use (PostHog, Mixpanel, Amplitude)
- Onboarding that looks native to your product — no "powered by [vendor]" badges
- Request changes from your devs the same way you request any UI change — it's your code
- Cost savings: $99 total vs $2,988-$10,800/year for SaaS alternatives
- No seat limits — your entire team can use it

**Tone:** Benefits-first, cost-conscious. Translate technical features into business outcomes.

---

### For Indie Hackers / Solo Founders

**What they care about:** Speed to implement, price, one-time cost, no recurring bills, "does it just work."

**Lead message:** Ship your first product tour in 5 minutes with the free tier. When you need checklists and analytics, it's $99 once — not another monthly bill eating your runway.

**Supporting points:**
- Free tier handles 80% of use cases — tours, hints, spotlights, keyboard nav
- `pnpm add @tour-kit/react` and you're running in 5 minutes
- $99 one-time is less than one month of any SaaS alternative
- No usage limits, no MAU caps, no "you've exceeded your plan" emails
- Works on localhost without a license — build and test before you buy
- MIT core means you're never locked in, even if tour-kit disappears tomorrow

**Tone:** Direct, empathetic to budget constraints. Acknowledge the pain of monthly SaaS bills on limited runway.

---

## Differentiator Matrix

| Competitor Category | Their Weakness | Our #1 Differentiator |
|---|---|---|
| **vs React Joyride** | Opinionated styling, limited TypeScript support, no headless mode, no ecosystem beyond tooltips, stale maintenance | **Headless architecture + full onboarding ecosystem.** Joyride gives you styled tooltips. Tour-kit gives you hooks to build any UI plus checklists, analytics, announcements, and more. |
| **vs Shepherd.js / Intro.js** | Framework-agnostic (no React optimization), jQuery-era API patterns, paid licensing for Intro.js, no extended onboarding features | **React-native with modern DX.** These are DOM-manipulation libraries wrapped in React adapters. Tour-kit is hooks and components from the ground up — no imperative API, no DOM refs, just React. |
| **vs Appcues / UserGuiding** | $250-900/month, iframe overlays that don't match your design system, vendor lock-in, no code ownership | **$99 once + you own the code.** Your onboarding looks like your app because it IS your app. No third-party scripts, no monthly bills, no "we changed our pricing" emails. |
| **vs Pendo / WalkMe** | Enterprise pricing ($500+/month), heavy scripts (100KB+), designed for non-technical users, poor developer experience | **Developer-first, lightweight, open-source.** Pendo/WalkMe target product managers with drag-and-drop builders. Tour-kit targets developers who want clean, typed, composable APIs. Different tools for different teams. |

---

## Objection Handling

### 1. "React Joyride is free and has 6K stars."

**Response:** React Joyride is a great library for basic tooltips — we respect what it's done for the ecosystem. Tour-kit solves a different problem. Joyride gives you a styled tooltip component. Tour-kit gives you headless hooks so you can build any UI, plus an ecosystem of extended packages (checklists, analytics, announcements, adoption tracking) that Joyride doesn't offer. If all you need is a simple tooltip tour, Joyride works fine. If you need an onboarding system that matches your design system and grows with your product, that's where tour-kit comes in. And tour-kit's core is also free and MIT-licensed — you only pay for the extended packages.

### 2. "We already use Appcues."

**Response:** If Appcues is working for you, keep using it. But ask yourself: does the overlay match your design system? Is your team comfortable with $3,000+/year? What happens when Appcues raises prices or gets acquired? Tour-kit isn't trying to replace Appcues for teams that need a no-code WYSIWYG builder. It's for engineering teams that want their onboarding to be code they own, components they control, and a one-time $99 cost they never think about again. We have a migration guide to make the switch painless if you decide to try it.

### 3. "Why should I pay $99 when the core is free?"

**Response:** You might not need to. The free tier covers product tours, hints, spotlights, keyboard navigation, and full TypeScript support. It handles 80% of onboarding use cases. The Pro tier adds analytics integration, onboarding checklists, product announcements, feature adoption tracking, media embedding, and scheduling. If your product is mature enough to need those features, $99 one-time is cheaper than building them yourself (estimated 40-80 hours of engineering time) or paying $250+/month for a SaaS tool.

### 4. "Is this maintained? How big is the team?"

**Response:** Tour-kit is actively maintained with regular releases. It's built on a solid foundation — TypeScript strict mode, comprehensive test coverage, automated CI/CD, and Changesets-based versioning. The MIT-licensed core means you're never dependent on us: if maintenance ever stopped, you have full source access to fork and continue. That's a guarantee no SaaS vendor can make. We also accept community contributions and have a growing contributor base.

### 5. "We need no-code for our product team."

**Response:** Tour-kit is a developer tool, not a WYSIWYG builder. If your product team needs to create and edit tours without engineering involvement, a SaaS platform like Appcues or UserGuiding is a better fit. But if your engineering team builds the tours and your product team requests changes through your normal workflow (tickets, PRs, design reviews), tour-kit gives you better results at a fraction of the cost. Many teams find that having developers build the tours once (takes minutes with tour-kit) and iterating based on analytics data works better than a visual editor that produces overlays that don't match the product.

### 6. "What about vendor lock-in?"

**Response:** The core packages are MIT-licensed. You have full source access. There is zero lock-in on the free tier — it's the same as using any open-source library. For Pro packages, the code runs in your bundle (not a SaaS call). If you stop using tour-kit, you remove the imports and replace them with your own logic. Compare that to a SaaS platform where stopping your subscription means your onboarding disappears overnight.

### 7. "Does it work with [framework]?"

**Response:** Tour-kit is built for React. The `@tour-kit/core` package is framework-agnostic (pure TypeScript hooks and utilities), so it could theoretically be adapted, but the primary packages target React. If you use Next.js, Remix, Vite + React, or any React-based framework, tour-kit works out of the box. We don't currently support Vue, Svelte, or Angular — those ecosystems have their own tour libraries. We'd rather be excellent for React than mediocre for everything.

### 8. "The bundle size seems large with all these packages."

**Response:** You only install what you use — that's the whole point of the modular architecture. The core is under 8KB gzipped. React components add under 12KB. Hints add under 5KB. Each extended package is independently tree-shakeable. If you only need tours, you install `@tour-kit/core` and `@tour-kit/react` for under 20KB total. Compare that to SaaS platforms that inject 100-200KB of third-party JavaScript onto every page. Tour-kit is lighter than a single hero image.

### 9. "We need enterprise features (SSO, audit logs, SLA)."

**Response:** Tour-kit is a library, not a SaaS platform. SSO and audit logs don't apply — the code runs in your bundle, authenticated by your existing auth system, logged by your existing logging infrastructure. There's no separate dashboard to secure. For SLA-level support, we offer priority GitHub issues with the Pro license. If you need dedicated support beyond that, reach out — we're open to enterprise support agreements on a case-by-case basis.

### 10. "How is this different from just building our own?"

**Response:** You absolutely can build your own. The question is whether you should. A production-quality tour system needs: element positioning that handles scroll and resize, focus trapping for accessibility, keyboard navigation, step sequencing with conditional logic, persistence across sessions, spotlight overlays, and screen reader announcements. That's 40-80 hours of senior engineering time, plus ongoing maintenance. Tour-kit gives you all of that tested and typed. The core is free — you're literally not paying for it. You're paying your engineers 40-80 hours to rebuild what already exists.

---

## Tagline Options

Ranked by strength, with context recommendations.

| Rank | Tagline | Best Context |
|------|---------|-------------|
| 1 | **Headless onboarding for React.** | GitHub README, docs site hero. Clean, accurate, no fluff. |
| 2 | **The open-source Appcues.** | HN, Twitter, Product Hunt. Instant positioning against a known incumbent. |
| 3 | **Your components. Your styles. Our engine.** | Landing page hero, conference slides. Communicates the headless value prop emotionally. |
| 4 | **Product tours that look like your app.** | Social media, blog titles. Highlights the pain point of ugly third-party overlays. |
| 5 | **$99 once. Not $300/month.** | Pricing page, comparison content, ads. Pure price disruption. |
| 6 | **Onboarding your users deserves more than an iframe.** | Blog intros, long-form content. Provocative, positions against SaaS tools. |
| 7 | **shadcn/ui-native product tours.** | React ecosystem channels, shadcn community. Targets the specific audience. |
| 8 | **Ship onboarding, not invoices.** | Indie hacker communities, Twitter. Punchy, cost-focused. |
| 9 | **The last onboarding library you'll need.** | Email sequences, sales pages. Bold claim, works in contexts where you have space to prove it. |
| 10 | **Accessible, typed, headless. The modern tour library.** | Technical audiences, conference CFPs. Stacks differentiators. |

**Primary recommendation:** Use "Headless onboarding for React" as the default everywhere, and "The open-source Appcues" as the positioning shorthand in conversations and social media.

---

## Proof Points & Social Proof Strategy

### Proof Points We Need to Build

| Proof Point | Priority | How to Get It |
|---|---|---|
| npm weekly downloads | High | Track from day one. Display on README and landing page once above 1,000/week. |
| GitHub stars | High | Star count is the first thing developers check. Target 500 launch week, 2,000 by 90 days. |
| Bundle size benchmarks | High | Publish a comparison table: tour-kit vs React Joyride vs Shepherd.js vs SaaS script sizes. Automate with CI. |
| TypeScript coverage | Medium | "100% TypeScript strict mode" is a verifiable claim. Link to tsconfig. |
| Lighthouse a11y score | Medium | Run Lighthouse on demo pages, publish the 100 score as a badge. |
| User testimonials | High | Collect from early adopters. Even 3-5 genuine quotes from real developers are powerful. |
| "Used by" logos | High | Offer free Pro licenses to 5-10 visible startups in exchange for logo permission. |
| Migration case studies | Medium | Document 1-2 teams that migrated from Appcues or Joyride. Quantify cost savings and bundle size reduction. |
| Feature comparison matrix | High | Publish a detailed feature matrix: tour-kit vs every competitor. Keep it honest — mark where we lose too. |
| Conference talk recordings | Low (long-term) | Submit talks on headless UI patterns, a11y-first design. Recordings become evergreen proof points. |

### Manufacturing Early Social Proof (Pre-Organic Traction)

**Week 1-2: Seed the ecosystem**
- Publish the library and immediately write a "Building tour-kit: why we went headless" blog post on Dev.to and your blog. This creates indexable content before anyone searches for you.
- Post in shadcn/ui Discord, Reactiflux, and Next.js Discord with a genuine "I built this, would love feedback" message. Not promotion — conversation.
- Submit to JavaScript Weekly, React Status, and This Week in React newsletters.

**Week 3-4: Create comparison content**
- Publish "Tour-Kit vs React Joyride: A Detailed Comparison" — be honest, acknowledge Joyride's strengths, and explain where tour-kit adds value.
- Publish "Tour-Kit vs Appcues: Open-Source Alternative" — lead with cost savings, show bundle size comparison.
- These pages become SEO assets that rank for "[competitor] alternative" searches.

**Week 5-8: Leverage early adopters**
- Offer 10 free Pro licenses to developers who agree to try it in a real project and share feedback (positive or negative).
- Ask satisfied early users for a 2-sentence testimonial and permission to use their name/company.
- Create a "Built with tour-kit" showcase page on the docs site.

**Ongoing: Let the numbers speak**
- Add npm download badge to README once downloads are meaningful.
- Add GitHub star badge once above 500.
- Publish monthly "state of tour-kit" updates showing growth metrics — transparency builds trust.

### Benchmark Comparisons We Can Make Today

| Metric | Tour-kit | React Joyride | Shepherd.js | Appcues (script) |
|--------|----------|---------------|-------------|-------------------|
| Core bundle (gzip) | < 8KB | ~15KB | ~25KB | ~120KB |
| TypeScript | Strict mode, native | Partial, DefinitelyTyped | Basic types | N/A (SaaS script) |
| Headless mode | Yes (default) | No | No | No |
| WCAG 2.1 AA | Built-in | Partial | Minimal | Varies |
| Checklists | Yes (Pro) | No | No | Yes ($249+/mo) |
| Analytics | Yes (Pro) | No | No | Yes ($249+/mo) |
| Announcements | Yes (Pro) | No | No | Yes ($249+/mo) |
| Year 1 cost | $0-99 | $0 | $0 | $2,988+ |
| React-native | Yes | Yes | Wrapper | No (DOM injection) |
| shadcn/ui support | Native | None | None | None |

> **Note:** Bundle sizes for competitors are approximate. Verify and update these numbers before publishing. Never publish unverified benchmarks — developer audiences will fact-check you and call you out.

---

## Usage Guidelines

- **Always be honest.** If a competitor does something better, acknowledge it. Developers respect honesty and punish exaggeration.
- **Lead with the free tier.** Never make the first message about money. Show value first, mention Pro only when relevant.
- **Adapt tone to context.** HN wants technical substance. Twitter wants punchy hooks. Docs want clarity. Adjust the message, not the facts.
- **Show, don't claim.** Instead of "best TypeScript support," show a code sample with autocomplete. Instead of "blazing fast," show the bundle size number.
- **Position against categories, not companies.** Say "unlike SaaS onboarding platforms" rather than attacking a specific company by name (except in explicit comparison content designed for that purpose).
