# TourKit Go-To-Market Strategy

## Launch Philosophy

**Multiple launches, not one big bang.** Supabase launched on Product Hunt 16 times. Each extended package is a new launch moment.

| Launch # | What | Story Angle |
|----------|------|-------------|
| 1 | Core + React + Hints (main) | "Headless product tours for React -- the open-source Appcues" |
| 2 | Analytics package | "Track tour completion in PostHog, Mixpanel, or Amplitude" |
| 3 | Checklists package | "Onboarding checklists with task dependencies -- $99, not $300/mo" |
| 4 | Announcements package | "Product announcements: modals, toasts, banners, slideouts" |
| 5 | Adoption package | "Feature adoption tracking and nudge system for React" |
| 6 | Media package | "Embed YouTube, Vimeo, Loom, Lottie in your product tours" |
| 7 | Scheduling package | "Time-based scheduling with timezone support" |
| 8+ | Future packages | Each one is a new PH launch, Show HN, Reddit post |

**Authenticity over hype.** Link to GitHub, not marketing site. Let devs evaluate the TypeScript types, README, and getting-started experience. If those are excellent, the community does the marketing.

---

## Pre-Launch Checklist (4 Weeks Before)

### Infrastructure (Week -4)
- [ ] README polished: GIF demo, one-liner, quick-start code, comparison table
- [ ] CONTRIBUTING.md, issue templates, PR template, CI passing
- [ ] Docs site live with Getting Started (<5 min), API reference, interactive examples
- [ ] All packages published to npm, `pnpm add @tour-kit/react` works cleanly
- [ ] Next.js App Router + Vite example apps (both with shadcn/ui, Vercel deploy button)

### Audience Seeding (Week -3)
- [ ] 2-3 technical tweets/week about problems tour-kit solves (don't name it yet)
- [ ] Reddit: answer product tour questions, build karma in r/reactjs, r/webdev
- [ ] Reactiflux Discord: help with positioning/overlay/tooltip questions
- [ ] First tutorial: "Building Accessible Product Tours in React" on Dev.to
- [ ] Submit PR to awesome-react

### Community Priming (Week -2)
- [ ] Building-in-public thread: technical insight about positioning engines
- [ ] Share GIF of tour-kit working (no branding, just the UX)
- [ ] Bundle size comparison post
- [ ] Email newsletter editors: This Week in React, React Status, JS Weekly, Bytes

### Final Prep (Week -1)
- [ ] All launch-day copy written and reviewed (HN, PH, Reddit, Twitter, Dev.to)
- [ ] Demo assets recorded (30s GIF, 60s GIF, 2min video, screenshots)
- [ ] Dry-run all links, test npm install in fresh project
- [ ] Analytics set up on docs site
- [ ] Product Hunt "Upcoming" page created (Tuesday-Thursday launch)

---

## Launch Week (Supabase-Style Daily Reveals)

### Monday: Main Launch
- **12:01 AM PT:** Product Hunt goes live
- **8:00 AM PT:** Show HN: `Tour-Kit -- Headless product tours for React (open source)` (link to GitHub)
- **8:30 AM:** Twitter/X launch thread (pin to profile)
- **10:00 AM:** Reddit posts (r/reactjs, then r/webdev 30min later, then r/nextjs)
- **Evening:** Dev.to article
- **All day:** Respond to EVERY comment on HN, PH, Reddit. Fix bugs in real-time. Share metrics transparently.
- **Shoutouts tactic (Dub.co):** Thank Floating UI, shadcn/ui, Radix UI, Turborepo, tsup -- each gets retweeted by their audiences

### Tuesday: Checklists + Announcements spotlight
### Wednesday: Analytics + Adoption spotlight
### Thursday: Media + Scheduling spotlight
### Friday: Roadmap + Community (feature requests, contributor invite)

---

## Post-Launch (Weeks 1-4)

| Week | Focus |
|------|-------|
| +1 | "What We Learned from Launching on HN" post. Share metrics transparently. Thank community. Triage top 10 feature requests. |
| +2 | Comparison page: Tour-Kit vs React Joyride. Migration guide from Joyride. Tutorial: "Add Product Tour to Next.js in 5 Min." |
| +3 | Launch GitHub Discussions. First contributor spotlight. Comparison page: Tour-Kit vs Appcues. Newsletter follow-up with traction proof. |
| +4 | Pro tier soft launch. "Why $99 once, not $300/month" pricing philosophy thread. Optional early adopter incentive ($79 for first 100). |

---

## SEO Strategy

### Priority Keywords

**Highest intent (create dedicated pages):**
- "react joyride alternative" (300-500/mo) -- React 19 migration angle
- "appcues alternative open source" (200-400/mo) -- NO actual OSS project ranks here
- "headless product tour react" (50-100/mo) -- uncontested, must-own
- "shadcn ui product tour" (100-200/mo) -- minimal competition
- "react 19 product tour" (100-300/mo) -- time-sensitive opportunity
- "product tour nextjs app router" (100-200/mo)

**Comparison pages to create (priority order):**
1. `/compare/tour-kit-vs-react-joyride`
2. `/compare/tour-kit-vs-appcues`
3. `/compare/tour-kit-vs-shepherd-js`
4. `/compare/tour-kit-vs-pendo`
5. `/compare/tour-kit-vs-userguiding`
6. `/compare/tour-kit-vs-driver-js`
7. `/compare/tour-kit-vs-intro-js`
8. `/compare/tour-kit-vs-onborda`

### 6 Content Pillars

1. **Tutorials & How-Tos** -- Capture problem-aware devs (`/blog/how-to-[action]-[tech]`)
2. **Comparison & Migration** -- Highest conversion, high-intent buyers (`/compare/tour-kit-vs-[x]`)
3. **Technical Deep-Dives** -- Authority building with senior devs
4. **Use Case Showcases** -- Help users envision tour-kit for their problem
5. **Ecosystem & Integration** -- Capture "[tool A] + [tool B]" stack searches
6. **Product Updates** -- Signal active maintenance, feed newsletters

### Content Calendar (First 12 Weeks)
- **37.5%** Comparison & Migration (9 pieces)
- **20.8%** Tutorials (5 pieces)
- **16.7%** Use Cases (4 pieces)
- **12.5%** Technical Deep-Dives (3 pieces)
- **8.3%** Integration (2 pieces)
- **4.2%** Ecosystem News (1 piece)
- **Total: 24 pieces in 12 weeks** (2 per week)

---

## Social Media Playbooks

### Platform Priority

| Priority | Platform | Primary ICP |
|----------|----------|-------------|
| 1 | Twitter/X | Frontend Lead, Indie Hacker |
| 2 | Reddit | Frontend Lead |
| 3 | Dev.to / Hashnode | Frontend Lead, Indie Hacker |
| 4 | YouTube | Frontend Lead, Indie Hacker |
| 5 | LinkedIn | Product Manager |
| 6 | Bluesky | Frontend Lead (hedge) |

### Twitter/X Weekly Cadence
- **Mon:** Technical tip (code screenshot)
- **Tue:** Building in public update
- **Wed:** Community engagement (3-5 replies to React/a11y threads)
- **Thu:** Thread (tutorial or technical decision deep-dive)
- **Fri:** Technical tip
- **X Premium required** (~10x reach vs free accounts in 2026)

### Reddit Rules
- 10:1 ratio (helpful comments : self-promotional posts)
- Always disclose maintainer status
- Say "I" not "we"
- Include what tool does NOT do
- Max 1 tour-kit post per month per subreddit
- Months 1-2: build karma only. Month 3: first r/reactjs launch post.

### YouTube Content Types
- Quick start (5-10 min) -- highest priority
- Full tutorial (20-30 min)
- Comparison video (10-15 min)
- Feature deep-dive (5-10 min)
- **Production:** VS Code font 18-20px, decent USB mic, chapters, captions

### LinkedIn
- Personal profile > company page (8x engagement)
- Cost-saving case studies, ROI posts, technical leadership
- Native video favored by algorithm (1-2 min demos)
- 1-2 text posts + 1 video per week

---

## Community Building Phases

### Phase 1: GitHub-Only (0-500 Stars)
- Respond to every issue <24h, every PR <48h
- Maintain 5-10 "good first issues" at all times
- NO Discord yet (dead server = anti-signal)
- Engage in external communities as helpful member

### Phase 2: Add Discord (500-2,000 Stars)
- Seed with 10-20 active members before public launch
- Channels: Welcome, Help, Community, Development, Off-Topic
- Weekly "What Are You Building?" thread
- Contributor spotlights in #announcements

### Phase 3: Champions Program (2,000+ Stars)
- Formal contributor levels (First-Time -> Regular -> Champion -> Core)
- Monthly community calls (only if demand exists)
- Governance documentation, RFC process

---

## Paid Channels (Budget: $800-2,000/mo)

| Priority | Channel | Cost | Expected ROI |
|----------|---------|------|-------------|
| 1 | This Week in React newsletter | ~$430/issue | 200-500 clicks, need 5 Pro sales to break even |
| 2 | React Status newsletter | ~$600-800/issue | Focused React audience |
| 3 | YouTube Tier C creators (5-20K subs) | $100-300/video | Low cost, high engagement, evergreen |
| 4 | YouTube Tier B creators (20-100K subs) | $200-500/video | Good reach |
| 5 | Local React meetup sponsorships | $100-300/event | Cheap, personal connections |
| 6 | Twitter/X promoted posts | $100-200/mo | Amplification only, not growth |

**CAC must stay below $25.** At $99/license, need 4x return minimum.

**Channels NOT pursuing:** Google Ads (devs trust organic), Facebook/Instagram (wrong audience), LinkedIn Ads ($5-15 CPC too expensive for $99 product), podcast ads (too broad/expensive), banner ads (<0.1% CTR + ad blockers), affiliate programs (wrong incentives).

### Target YouTube Creators
- **Tier A (aspirational):** Theo (500K), Jack Herrington (250K), Web Dev Simplified (1.5M), Fireship (2.5M), Lee Robinson (100K)
- **Tier B:** Colby Fayock, Dave Gray, Josh tried coding, Cosden Solutions
- **Tier C (best ROI):** Growing React/Next.js creators, $100-200/video

---

## Success Metrics

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

---

## Key Strategic Principles

1. **Developer authenticity over marketing polish.** No superlatives, no stock photos. Code samples, honest benchmarks, real limitations.
2. **Documentation IS marketing.** Docs site is the most important marketing channel.
3. **Position against known incumbents.** Cal.com = "Open Source Calendly." Tour-kit = "Open Source Appcues."
4. **Launch multiple times.** Each package = new launch moment.
5. **Free must be genuinely useful.** Free tier solves 80% of use cases. If it feels crippled, devs choose a free competitor.
6. **Community before commerce.** Build 1,000+ stars before pushing Pro hard.
7. **SEO compounds.** Every comparison page drives traffic for years.
8. **One-time pricing is the wedge.** $99 vs $300/mo is category disruption. Lead with it everywhere.
