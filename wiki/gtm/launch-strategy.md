---
title: Launch Strategy
type: gtm
sources:
  - ../../marketing-strategy/go-to-market.md
  - ../../marketing-strategy/07-launch-strategy.md
  - ../../marketing-strategy/tour-kit-shipping-plan.md
updated: 2026-04-19
---

*Supabase-style: multiple launches, not one big bang. Each Pro package is a new launch moment.*

## Launch philosophy

**Multiple launches, not one bang.** Supabase launched on Product Hunt 16 times. Each extended package is a new launch moment.

| # | What | Story angle |
|---|---|---|
| 1 | Core + React + Hints (main) | "Headless product tours for React — the open-source Appcues" |
| 2 | Analytics package | "Track tour completion in PostHog, Mixpanel, or Amplitude" |
| 3 | Checklists package | "Onboarding checklists with task dependencies — $99, not $300/mo" |
| 4 | Announcements package | "Product announcements: modals, toasts, banners, slideouts" |
| 5 | Adoption package | "Feature adoption tracking and nudge system for React" |
| 6 | Media package | "Embed YouTube, Vimeo, Loom, Lottie in your product tours" |
| 7 | Scheduling package | "Time-based scheduling with timezone support" |
| 8+ | Future packages | Each one = new PH launch, Show HN, Reddit post |

**Authenticity over hype.** Link to GitHub, not marketing site. Let devs evaluate the TypeScript types, README, and getting-started experience. If those are excellent, the community does the marketing.

## Pre-launch (4 weeks out)

### Week -4: Infrastructure
- README polished: GIF demo, one-liner, quick-start code, comparison table
- CONTRIBUTING.md, issue templates, PR template, CI passing
- Docs site live with Getting Started (<5 min), API reference, interactive examples
- All packages published to npm; `pnpm add @tour-kit/react` works cleanly
- Next.js App Router + Vite example apps (both shadcn/ui, Vercel deploy button)

### Week -3: Audience seeding
- 2–3 technical tweets/week about problems TourKit solves (don't name it yet)
- Reddit: answer product tour questions, build karma in r/reactjs, r/webdev
- Reactiflux Discord: help with positioning/overlay/tooltip questions
- First tutorial: "Building Accessible Product Tours in React" on Dev.to
- Submit PR to awesome-react

### Week -2: Community priming
- Building-in-public thread: technical insight about positioning engines
- Share GIF of TourKit working (no branding, just the UX)
- Bundle size comparison post
- Email newsletter editors: This Week in React, React Status, JS Weekly, Bytes

### Week -1: Final prep
- All launch-day copy written and reviewed (HN, PH, Reddit, Twitter, Dev.to)
- Demo assets recorded (30s GIF, 60s GIF, 2min video, screenshots)
- Dry-run all links, test `npm install` in fresh project
- Analytics on docs site
- Product Hunt "Upcoming" page (Tuesday–Thursday launch)

## Launch week (Supabase-style daily reveals)

### Monday — Main launch
- **12:01 AM PT** — Product Hunt goes live
- **8:00 AM PT** — Show HN: "Tour-Kit — Headless product tours for React (open source)" (link to GitHub)
- **8:30 AM** — Twitter/X launch thread (pin to profile)
- **10:00 AM** — Reddit (r/reactjs → r/webdev 30 min later → r/nextjs)
- **Evening** — Dev.to article
- **All day** — Respond to EVERY comment on HN, PH, Reddit. Fix bugs in real-time. Share metrics transparently.
- **Shoutouts (Dub.co tactic):** Thank Floating UI, shadcn/ui, Radix UI, Turborepo, tsup — each gets retweeted by their audiences

### Tuesday: Checklists + Announcements spotlight
### Wednesday: Analytics + Adoption spotlight
### Thursday: Media + Scheduling spotlight
### Friday: Roadmap + Community (feature requests, contributor invite)

## Post-launch (weeks +1 to +4)

| Week | Focus |
|---|---|
| +1 | "What We Learned from Launching on HN" post. Share metrics transparently. Triage top 10 feature requests. |
| +2 | Comparison page: TourKit vs React Joyride. Migration guide from Joyride. Tutorial: "Add a Product Tour to Next.js in 5 Min." |
| +3 | Launch GitHub Discussions. First contributor spotlight. Comparison page: TourKit vs Appcues. Newsletter follow-up with traction proof. |
| +4 | Pro tier soft launch. "Why $99 once, not $300/month" pricing philosophy thread. Optional early-adopter incentive ($79 for first 100). |

*(TODO for second-pass ingest: full launch checklist from `../../marketing-strategy/launch-checklist.md`, launch copy kit from `../../marketing-strategy/launch-copy-kit.md`, minute-by-minute launch-day schedule.)*

## Related

- [gtm/seo-content-strategy.md](seo-content-strategy.md)
- [gtm/community-building.md](community-building.md)
- [gtm/social-media.md](social-media.md)
- [gtm/paid-channels.md](paid-channels.md)
- [gtm/success-metrics.md](success-metrics.md)
- [brand/positioning.md](../brand/positioning.md)
