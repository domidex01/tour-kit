---
title: Launch Checklist
type: gtm
sources:
  - ../../marketing-strategy/launch-checklist.md
updated: 2026-04-19
---

*Everything that must be ready before launch day. Minute-by-minute schedule included.*

## Pre-launch assets (Week -4 to -1)

### GitHub repository
- [ ] README: GIF demo, one-liner, quick-start code, feature highlights, comparison table, "why TourKit" section
- [ ] CONTRIBUTING.md with <5 min setup
- [ ] Issue templates: `bug_report.yml`, `feature_request.yml`, `documentation.yml`
- [ ] PR template with checklist
- [ ] CODE_OF_CONDUCT.md (Contributor Covenant v2.1)
- [ ] LICENSE (MIT) at repo root
- [ ] `.github/FUNDING.yml` → Pro purchase page
- [ ] Branch protection on `main`
- [ ] CI passing (build, typecheck, test) on all packages
- [ ] 5–10 "good first issue" items ready
- [ ] Description: "Headless product tours and onboarding for React."
- [ ] Topics: `react`, `product-tour`, `onboarding`, `headless`, `typescript`, `shadcn-ui`, `accessibility`, `hooks`
- [ ] Social preview image (1280×640)

### npm packages
- [ ] All packages published with correct names, descriptions, keywords
- [ ] `pnpm add @tour-kit/react` works cleanly (no peer dep warnings)
- [ ] TypeScript types ship correctly (autocompletion in VS Code)
- [ ] Package READMEs match GitHub quality
- [ ] Badges: npm version, bundle size (bundlephobia), TypeScript, MIT, WCAG AA

### Documentation site
- [ ] Live at production URL
- [ ] Getting Started guide (working tour in <5 min)
- [ ] API reference for all public exports
- [ ] Interactive examples (code + live preview)
- [ ] shadcn/ui integration example
- [ ] Accessibility documentation
- [ ] Pricing page (free vs Pro, clear comparison)
- [ ] OG images and meta tags on all pages
- [ ] Analytics installed (Plausible, Fathom, or PostHog)

### Example apps
- [ ] Next.js App Router example (shadcn/ui + Tailwind)
- [ ] Vite + React example
- [ ] Both deployable via Vercel button

### Demo assets
- [ ] 30s GIF: basic tour setup + execution (README + social)
- [ ] 60s GIF: headless mode with custom shadcn/ui
- [ ] 2min video: full getting-started walkthrough (PH + docs)
- [ ] Screenshot: TS autocompletion in VS Code
- [ ] Screenshot: Lighthouse a11y score of 100
- [ ] Architecture diagram
- [ ] Code screenshots via ray.so (dark theme, 16px+, TypeScript)

### Comparison pages (drafts, hold for post-launch)
- [ ] TourKit vs React Joyride
- [ ] TourKit vs Appcues

## Pre-launch engagement (Week -3 to -2)

- 2–3 technical tweets/week about problems (don't name TourKit yet)
- First tutorial: "Building Accessible Product Tours in React" on Dev.to
- Submit PR to awesome-react
- Reddit: answer tour questions, build karma in r/reactjs, r/webdev, r/nextjs
- Reactiflux Discord: help with positioning/overlay questions
- Newsletter outreach: This Week in React (Sebastien Lorber), React Status (Cooperpress), JS Weekly, Bytes (ui.dev)

### Week -2: Building anticipation
- Twitter thread: "I've been building a headless tour library..."
- Share GIF of working tour (no branding)
- Bundle size comparison post

## Launch day copy (pre-written Week -2)

See [gtm/launch-copy-kit.md](launch-copy-kit.md). Includes:
- Show HN title + founder comment
- Product Hunt listing: tagline, description, first comment, gallery images
- Reddit r/reactjs, r/webdev, r/nextjs (different angles per sub)
- Twitter/X launch thread (8 tweets)
- Dev.to article (long-form)
- Bluesky mirror
- LinkedIn post (business/cost angle)
- Shoutout tweets: Floating UI, shadcn/ui, Radix, Turborepo, tsup
- Newsletter follow-up email

## Launch week (Week -1 setup)

### Product Hunt
- "Upcoming" page created (builds follower notifications)
- Scheduled Tue/Wed/Thu
- Launch time: 12:01 AM PT
- Gallery images ready: code screenshots, architecture, comparison, demo GIFs
- 20–30 supporters notified to give genuine feedback

### Analytics & tracking
- Docs site analytics live
- GitHub star tracking (star-history.com)
- npm download tracking
- UTM parameters on all launch links
- Launch-day dashboard

### Response preparation
- Templates for common questions ready
- Notification monitors: GitHub, HN, Reddit, Twitter
- Pre-answered: "What's the catch?", "How maintained?", "Why not Joyride?", "Does it work with X?"

### Launch rehearsal
- Dry-run all posts with trusted dev friends
- Test every link
- Test `pnpm add @tour-kit/react` in fresh project
- Time the getting-started guide (<5 min or simplify)
- Lighthouse audit on docs site

## Launch day schedule (minute by minute)

| Time (PT) | Action |
|---|---|
| 12:01 AM | Product Hunt goes live (auto) |
| 12:05 AM | Post Maker's Story as first PH comment |
| 12:10 AM | Notify 20–30 supporters |
| 8:00 AM | Show HN post live (link to GitHub) |
| 8:05 AM | Post HN founder comment |
| 8:30 AM | Twitter/X launch thread (pin to profile) |
| 8:45 AM | Bluesky mirror |
| 9:00 AM | Email newsletter editors: "we just launched" |
| 9:30 AM | Shoutout tweets (Floating UI, shadcn, Radix, Turborepo) |
| 10:00 AM | Reddit: r/reactjs |
| 10:30 AM | Reddit: r/webdev |
| 11:00 AM | Reddit: r/nextjs |
| All day | Respond to EVERY comment |
| All day | Fix bugs immediately, respond with the fix |
| All day | Share metrics transparently ("Just hit 100 stars!") |
| 5:00 PM | Dev.to article goes live |
| 6:00 PM | LinkedIn post (business angle) |
| 8:00 PM | "Thank you" update on Twitter with day-one metrics |

## Post-launch (weeks +1 to +4)

### Week +1: Capitalize
- Blog: "What We Learned from Launching on HN" (real numbers)
- Twitter thread with launch metrics
- Thank everyone who starred/commented/shared
- Compile top 10 feature requests → GitHub Discussion

### Week +2: Content push
- Publish: TourKit vs React Joyride
- Publish: Migration guide from React Joyride
- Publish: "Add Product Tour to Next.js in 5 Min"

### Week +3: Community
- Enable GitHub Discussions (Q&A, Ideas, Show & Tell, General, RFC)
- First contributor spotlight
- Publish: TourKit vs Appcues
- Newsletter follow-up with traction proof

### Week +4: Pro launch
- Blog: "Introducing TourKit Pro" (honest free vs Pro)
- Twitter thread: "Why $99 once, not $300/month"
- Optional: launch discount ($79 for first 100 buyers)

## Success targets

See [gtm/success-metrics.md](success-metrics.md).

## Related

- [gtm/launch-strategy.md](launch-strategy.md) — Strategy behind the checklist
- [gtm/launch-copy-kit.md](launch-copy-kit.md) — Pre-written copy
- [gtm/shipping-plan.md](shipping-plan.md) — 4-day tactical ship sequence
