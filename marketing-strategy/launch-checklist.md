# TourKit Launch Checklist

> Everything that must be ready before launch day. Check every item.

---

## Pre-Launch Assets (Week -4 to -1)

### GitHub Repository
- [ ] README: GIF demo, one-liner, quick-start code, feature highlights, comparison table, "why tour-kit" section
- [ ] CONTRIBUTING.md with setup instructions (<5 min to dev environment)
- [ ] Issue templates: bug report (`bug_report.yml`), feature request (`feature_request.yml`), docs issue (`documentation.yml`)
- [ ] PR template with checklist
- [ ] CODE_OF_CONDUCT.md (Contributor Covenant v2.1)
- [ ] LICENSE (MIT) at repo root
- [ ] `.github/FUNDING.yml` pointing to Pro purchase page
- [ ] Branch protection on `main`
- [ ] GitHub Actions CI passing (build, typecheck, test) on all packages
- [ ] 5-10 "good first issue" items ready
- [ ] Repository description: "Headless product tours and onboarding for React."
- [ ] Topics: `react`, `product-tour`, `onboarding`, `headless`, `typescript`, `shadcn-ui`, `accessibility`, `hooks`
- [ ] Social preview image (1280x640)

### npm Packages
- [ ] All packages published with correct names, descriptions, keywords
- [ ] `pnpm add @tour-kit/react` works cleanly (no peer dep warnings)
- [ ] TypeScript types ship correctly (test autocompletion in VS Code)
- [ ] Package READMEs match GitHub README quality
- [ ] Badges: npm version, bundle size (bundlephobia), TypeScript, MIT license, WCAG AA

### Documentation Site
- [ ] Live at production URL
- [ ] Getting Started guide (working tour in <5 min)
- [ ] API reference for all public exports
- [ ] Interactive examples (code + live preview)
- [ ] shadcn/ui integration example
- [ ] Accessibility documentation
- [ ] Pricing page (free vs Pro, clear comparison)
- [ ] OG images and meta tags set for all pages
- [ ] Analytics installed (Plausible, Fathom, or PostHog)

### Example Apps
- [ ] Next.js App Router example (shadcn/ui + Tailwind)
- [ ] Vite + React example
- [ ] Both deployable with Vercel deploy button
- [ ] Both have comprehensive comments

### Demo Assets
- [ ] 30-second GIF: basic tour setup + execution (README + social)
- [ ] 60-second GIF: headless mode with custom shadcn/ui components
- [ ] 2-minute video: full getting-started walkthrough (PH + docs)
- [ ] Screenshot: TypeScript autocompletion in VS Code
- [ ] Screenshot: Lighthouse accessibility score of 100
- [ ] Architecture diagram: how core, react, hints relate
- [ ] Code screenshots via ray.so (dark theme, 16px+, TypeScript)

### Comparison Pages (Draft, Hold for Post-Launch)
- [ ] Tour-Kit vs React Joyride (draft ready)
- [ ] Tour-Kit vs Appcues (draft ready)

---

## Pre-Launch Engagement (Week -3 to -2)

### Content Seeding
- [ ] 2-3 technical tweets/week about problems tour-kit solves (DON'T name it yet)
- [ ] First tutorial: "Building Accessible Product Tours in React" on Dev.to
- [ ] Submit PR to awesome-react

### Community Presence
- [ ] Reddit: answer product tour questions, build karma in r/reactjs, r/webdev, r/nextjs
- [ ] Reactiflux Discord: help with positioning/overlay/tooltip questions
- [ ] Follow and interact with: React core team, shadcn, Tailwind team, indie hackers

### Newsletter Outreach
- [ ] Email This Week in React (Sebastien Lorber)
- [ ] Email React Status (Cooperpress)
- [ ] Email JavaScript Weekly (Cooperpress)
- [ ] Email Bytes (ui.dev)
- [ ] Include: one-paragraph description, GitHub link, key differentiators, code screenshot

### Building Anticipation (Week -2)
- [ ] Twitter thread: "I've been building a headless tour library for React..."
- [ ] Share GIF of working tour (no branding)
- [ ] Bundle size comparison post

---

## Launch Day Copy (Pre-Written, Week -2)

- [ ] Show HN title + founder comment (see `launch-copy-kit.md`)
- [ ] Product Hunt listing: tagline, description, first comment, gallery images
- [ ] Reddit posts: r/reactjs, r/webdev, r/nextjs (different angles per sub)
- [ ] Twitter/X launch thread (8 tweets)
- [ ] Dev.to article (long-form, technical)
- [ ] Bluesky mirror of Twitter thread
- [ ] LinkedIn post (business/cost angle)
- [ ] Shoutout tweets: Floating UI, shadcn/ui, Radix, Turborepo, tsup
- [ ] Newsletter follow-up email: "We just launched"
- [ ] All copy reviewed by 2-3 people for tone and accuracy

---

## Launch Week Execution (Week -1 Setup)

### Product Hunt
- [ ] "Upcoming" page created (builds follower notifications)
- [ ] Scheduled for Tuesday, Wednesday, or Thursday
- [ ] Launch time: 12:01 AM PT
- [ ] Gallery images ready: code screenshots, architecture diagram, comparison table, demo GIFs
- [ ] 20-30 supporters notified to give genuine feedback

### Analytics & Tracking
- [ ] Docs site analytics live
- [ ] GitHub star tracking set up (star-history.com)
- [ ] npm download tracking
- [ ] UTM parameters on all launch links
- [ ] Launch-day dashboard showing all metrics

### Response Preparation
- [ ] Response templates for common questions ready
- [ ] Notification monitors set up: GitHub, HN, Reddit, Twitter
- [ ] Answers prepared for: "What's the catch?", "How maintained?", "Why not Joyride?", "Does it work with X?"

### Launch Rehearsal
- [ ] Dry-run all posts with trusted dev friends
- [ ] Test every link in every post
- [ ] Test `pnpm add @tour-kit/react` in fresh project
- [ ] Time the getting-started guide (<5 min or simplify)
- [ ] Lighthouse audit on docs site (fix any issues)

---

## Launch Day Schedule

| Time (PT) | Action |
|-----------|--------|
| 12:01 AM | Product Hunt goes live (auto-scheduled) |
| 12:05 AM | Post Maker's Story as first PH comment |
| 12:10 AM | Notify 20-30 supporters about PH listing |
| 8:00 AM | Show HN post live (link to GitHub) |
| 8:05 AM | Post HN founder comment |
| 8:30 AM | Twitter/X launch thread (pin to profile) |
| 8:45 AM | Bluesky mirror |
| 9:00 AM | Email newsletter editors: "we just launched" |
| 9:30 AM | Shoutout tweets (Floating UI, shadcn, Radix, Turborepo) |
| 10:00 AM | Reddit: r/reactjs |
| 10:30 AM | Reddit: r/webdev |
| 11:00 AM | Reddit: r/nextjs |
| All day | Respond to EVERY comment (HN, PH, Reddit, Twitter) |
| All day | Fix any bugs immediately, respond with the fix |
| All day | Share metrics transparently ("Just hit 100 stars!") |
| 5:00 PM | Dev.to article goes live |
| 6:00 PM | LinkedIn post (business angle) |
| 8:00 PM | "Thank you" update on Twitter with day-one metrics |

---

## Post-Launch (Weeks +1 to +4)

### Week +1: Capitalize
- [ ] Blog: "What We Learned from Launching on HN" (with real numbers)
- [ ] Twitter thread with launch metrics
- [ ] Thank everyone who starred/commented/shared
- [ ] Compile top 10 feature requests → GitHub Discussion

### Week +2: Content Push
- [ ] Publish: Tour-Kit vs React Joyride comparison page
- [ ] Publish: Migration guide from React Joyride
- [ ] Publish: "Add Product Tour to Next.js in 5 Min" tutorial

### Week +3: Community
- [ ] Enable GitHub Discussions (Q&A, Ideas, Show & Tell, General, RFC)
- [ ] First contributor spotlight
- [ ] Publish: Tour-Kit vs Appcues comparison page
- [ ] Newsletter follow-up with traction proof

### Week +4: Pro Launch
- [ ] Blog: "Introducing Tour-Kit Pro" (honest free vs Pro comparison)
- [ ] Twitter thread: "Why $99 once, not $300/month"
- [ ] Optional: launch discount ($79 for first 100 buyers)

---

## Success Targets

| Metric | Launch Week | 90 Days |
|--------|------------|---------|
| GitHub stars | 500+ | 2,000+ |
| npm weekly downloads | 1,000+ | 5,000+ |
| Docs monthly visitors | 5,000+ | 20,000+ |
| HN front page | Yes | -- |
| Product Hunt top 5 | Yes | -- |
| Pro licenses sold | 10+ | 100+ |
| Discord members | -- | 200+ |
| Newsletter subscribers | 200+ | 1,000+ |
| SEO: page 1 for 3+ keywords | -- | Yes |
