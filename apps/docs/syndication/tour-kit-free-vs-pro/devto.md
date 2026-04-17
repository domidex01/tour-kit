---
title: "Can you use Tour Kit without the Pro license? (free vs Pro breakdown)"
published: false
description: "Tour Kit's 3 core packages are MIT and free forever. Here's exactly what ships for free, what Pro adds, and when $99 is worth it."
tags: react, opensource, webdev, javascript
canonical_url: https://usertourkit.com/blog/tour-kit-free-vs-pro
cover_image: https://usertourkit.com/og-images/tour-kit-free-vs-pro.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-free-vs-pro)*

# Can you use Tour Kit without the Pro license?

Yes. Tour Kit's three core packages are MIT-licensed and free forever. You can ship production product tours, multi-step onboarding flows, and persistent feature hints without paying anything or hitting a usage cap. The free tier isn't a trial. There's no time limit, no watermark, no gate on the core tour functionality.

We built Tour Kit, so take everything below with that context. Every claim maps to a specific package you can inspect on GitHub, and every number comes from bundlephobia or the source code.

```bash
npm install @tour-kit/core @tour-kit/react
```

## What is Tour Kit's free vs Pro model?

Tour Kit uses an open-core licensing model where the foundational packages (`@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`) are MIT-licensed and free, while nine extended packages (analytics, checklists, surveys, announcements, media, scheduling, adoption, AI, license validation) require a one-time $99 Pro license. Unlike SaaS onboarding tools that charge $129-$599 per month, Tour Kit's Pro is a single payment with no MAU limits, no seat limits, and no recurring fees.

## What exactly ships in the free tier?

Tour Kit's free tier includes three MIT-licensed npm packages totaling under 25KB gzipped. These aren't stripped-down demos. They contain the same position engine, accessibility layer, and component architecture that the Pro packages build on top of.

| Package | License | Size (gzipped) | What it does |
|---------|---------|----------------|--------------|
| `@tour-kit/core` | MIT | <8KB | Hooks, position engine, focus management, keyboard nav, persistence, storage adapters, branching logic, RTL support |
| `@tour-kit/react` | MIT | <12KB | Tour components, card system, overlay, navigation, progress, router adapters (Next.js, React Router), headless variants, multi-tour registry |
| `@tour-kit/hints` | MIT | <5KB | Persistent hotspot beacons, hint tooltips, independent dismiss/hide state per hint |

### What you can build with the free packages alone

With `@tour-kit/core` + `@tour-kit/react`, you get:

```tsx
// src/components/OnboardingTour.tsx
import { Tour, TourCard, TourCardContent, TourCardFooter,
         TourNavigation, TourOverlay, TourProgress } from '@tour-kit/react'

const steps = [
  { id: 'welcome', target: '#sidebar', content: 'Start here.' },
  { id: 'search', target: '#search-bar', content: 'Find anything.' },
  { id: 'profile', target: '#avatar', content: 'Your settings live here.' },
]

export function OnboardingTour() {
  return (
    <Tour tourId="onboarding" steps={steps}>
      <TourOverlay />
      <TourCard>
        <TourCardContent />
        <TourCardFooter>
          <TourNavigation />
          <TourProgress variant="dots" />
        </TourCardFooter>
      </TourCard>
    </Tour>
  )
}
```

That gives you element targeting, scroll-into-view, keyboard navigation (arrow keys, Escape, Enter), WCAG 2.1 AA focus management, and `prefers-reduced-motion` respect. No Pro license involved.

### Free tier capabilities

- Multi-step sequential tours with branching logic
- Element highlighting with configurable spotlight
- Keyboard navigation and full focus trapping
- Router-aware tours (Next.js App Router, Pages Router, React Router)
- Multi-tour registry (run different tours for different user segments)
- LocalStorage persistence (resume where the user left off)
- Custom storage adapters (cookie, sessionStorage, or your own backend)
- RTL/LTR support with automatic placement mirroring
- Headless mode (bring your own components, keep the logic)
- shadcn/ui and Tailwind compatibility via class-variance-authority variants

## What does Pro add?

The Pro license ($99 one-time per project) adds nine additional packages:

| Pro package | What it adds | The DIY alternative |
|-------------|-------------|---------------------|
| `@tour-kit/analytics` | Plugin-based analytics (PostHog, Mixpanel, GA4, Plausible, custom) | Wire up event callbacks manually per provider |
| `@tour-kit/checklists` | Onboarding checklists with task dependencies and progress tracking | Build a checklist UI + state machine from scratch |
| `@tour-kit/announcements` | Product announcements (modal, toast, banner, slideout, spotlight) | Build 5 announcement components + frequency/dismissal logic |
| `@tour-kit/surveys` | In-app microsurveys (NPS, CSAT, CES) with fatigue prevention | Build survey UI + scoring engine + rate limiting |
| `@tour-kit/adoption` | Feature adoption tracking, nudge scheduler, adoption dashboard | Custom tracking + nudge logic + dashboard UI |
| `@tour-kit/media` | Embed YouTube, Vimeo, Loom, Wistia, GIF, Lottie in tour steps | Build embed components with proper aspect ratios and a11y |
| `@tour-kit/scheduling` | Time-based scheduling with timezone support and recurring patterns | Build a scheduler with date-fns/Luxon + cron expressions |
| `@tour-kit/ai` | AI-powered tour generation and content suggestions | Integrate an LLM yourself |

## When does Pro become worth the $99?

When you'd spend more than a few hours building the equivalent yourself. Developer time at US market rates runs $75-150/hour. If `@tour-kit/analytics` saves you four hours of wiring up PostHog event callbacks, the math already works.

## How Tour Kit's model compares to alternatives

| Tool | Free tier | Paid tier | Pricing model |
|------|-----------|-----------|---------------|
| Tour Kit | Core tours, hints, components (MIT) | Analytics, checklists, surveys, announcements, media, scheduling, AI | $99 one-time per project |
| React Joyride | Full library (MIT) | None | Free (community maintained) |
| Shepherd.js | Full library (AGPL) | Commercial license removes AGPL obligation | Contact sales |
| Appcues | None | Full platform | $249/mo+ (per MAU) |
| Pendo | Free tier (500 MAU limit) | Full platform | Custom pricing (per MAU) |

Full article with licensing details and FAQ: [https://usertourkit.com/blog/tour-kit-free-vs-pro](https://usertourkit.com/blog/tour-kit-free-vs-pro)
