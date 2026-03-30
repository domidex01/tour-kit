# Launch Strategy

> A coordinated, multi-channel launch plan modeled on the tactics that worked for Cal.com, Supabase, shadcn/ui, and Dub.co -- adapted for tour-kit's position as a headless React onboarding library.

---

## Launch Philosophy

### Multiple Launches, Not One Big Bang

Supabase launched on Product Hunt 16 times over 4 years. Only 9 of those 16 launches were awarded -- and they kept shipping anyway. The repeated exposure compounded into a follower base and long-term visibility that no single launch could achieve.

Tour-kit has the same structural advantage: each extended package is a distinct product with its own story. We don't launch once. We launch every time we ship something meaningful.

**Launch moments in tour-kit's roadmap:**

| Launch # | What | Story Angle |
|----------|------|-------------|
| 1 | Core + React + Hints (main launch) | "Headless product tours for React -- the open-source Appcues" |
| 2 | Analytics package | "Track tour completion in PostHog, Mixpanel, or Amplitude" |
| 3 | Checklists package | "Onboarding checklists with task dependencies -- $99, not $300/mo" |
| 4 | Announcements package | "Product announcements: modals, toasts, banners, slideouts, spotlights" |
| 5 | Adoption package | "Feature adoption tracking and nudge system for React" |
| 6 | Media package | "Embed YouTube, Vimeo, Loom, Lottie in your product tours" |
| 7 | Scheduling package | "Time-based scheduling with timezone support for onboarding" |
| 8+ | Future packages (surveys, segmentation, experiments) | Each one is a new Product Hunt launch, a new Show HN, a new Reddit post |

### Each Launch Is Coordinated, Same-Day, Multi-Channel

Every launch moment hits all channels on the same day. The channels amplify each other: a HN front page post drives GitHub stars, which drives npm installs, which drives newsletter mentions, which drives more stars. The flywheel only works if everything fires at once.

### Authenticity Over Hype

Cal.com hit #1 on Hacker News with "Open Source Calendly" and nothing else -- no description text, just a link to a working prototype. The community's existing demand for an open-source scheduling alternative made the product speak for itself. shadcn/ui grew to 90,000+ GitHub stars entirely through grassroots community adoption -- no ads, no marketing campaigns, just exceptional documentation and a philosophy (copy-paste, own-the-code) that resonated.

Tour-kit's launch must follow the same principle: show the code, not the marketing. Link to the GitHub repo, not the marketing site. Let developers evaluate the TypeScript types, the README, and the getting-started experience. If those are excellent, the community will do the marketing for us.

---

## Pre-Launch Phase (4 Weeks Before)

### Week -4: Infrastructure

Everything a developer touches on launch day must already be polished. There are no second chances at a first impression.

**GitHub repo polish:**
- [ ] README follows the structure from document 11 (GitHub README Optimization): GIF demo, one-liner, quick-start code, feature highlights, comparison table, "why tour-kit" section
- [ ] Contributing guide (CONTRIBUTING.md) with setup instructions, PR conventions, "good first issue" labeling
- [ ] Issue templates: bug report, feature request, question
- [ ] PR template with checklist
- [ ] GitHub Actions CI passing on all packages (build, typecheck, test)
- [ ] License file (MIT) at repo root
- [ ] `.github/FUNDING.yml` pointing to the Pro purchase page
- [ ] Branch protection on `main` -- shows professionalism to evaluators
- [ ] Repository description: "Headless product tours and onboarding for React."
- [ ] Repository topics: `react`, `product-tour`, `onboarding`, `headless`, `typescript`, `shadcn-ui`, `accessibility`, `hooks`

**Documentation site:**
- [ ] Docs site live at the production URL
- [ ] Getting Started guide that results in a working tour in under 5 minutes
- [ ] API reference for all public exports
- [ ] Interactive examples (code + live preview)
- [ ] shadcn/ui integration example
- [ ] Accessibility documentation
- [ ] Comparison pages drafted (Tour-Kit vs React Joyride, Tour-Kit vs Appcues) -- hold for post-launch publishing

**npm packages:**
- [ ] All packages published to npm with correct names, descriptions, and keywords
- [ ] `pnpm add @tour-kit/react` works cleanly with no peer dependency warnings
- [ ] TypeScript types ship correctly -- test autocompletion in VS Code
- [ ] Package READMEs on npm match GitHub README quality

**Example apps:**
- [ ] Next.js App Router example (the most common stack for our Primary ICP)
- [ ] Vite + React example (lighter alternative)
- [ ] Both examples use shadcn/ui and Tailwind CSS
- [ ] Both examples are deployable with one click (Vercel deploy button)

### Week -3: Audience Seeding

Start building visibility before anyone knows a launch is coming. The goal is not promotion -- it's presence.

**Technical content on Twitter/X:**
- [ ] Post 2-3 technical tweets per week about problems tour-kit solves (accessibility in overlays, positioning engines, headless UI patterns)
- [ ] Engage with React ecosystem conversations -- reply to tweets about onboarding, product tours, shadcn/ui
- [ ] Follow and interact with key voices: React core team members, shadcn/ui maintainers, Tailwind team, indie hackers building in public
- [ ] Do NOT mention tour-kit by name yet. Build the "problem awareness" before revealing the solution

**Reddit engagement:**
- [ ] Subscribe to r/reactjs, r/webdev, r/nextjs, r/SaaS, r/indiehackers
- [ ] Answer existing questions about product tour libraries honestly ("I've been working on something for this, but here are the current options...")
- [ ] Comment on posts about React Joyride issues, SaaS tool costs, onboarding UX
- [ ] Build genuine karma and post history -- Reddit communities detect and punish accounts that only show up to promote

**Reactiflux Discord:**
- [ ] Join and participate in #react-help, #library-discussion channels
- [ ] Help people with positioning, overlay, and tooltip questions
- [ ] Do NOT self-promote. Be helpful first. The launch post comes later

**First tutorial blog post:**
- [ ] Publish "Building Accessible Product Tours in React" on personal blog and Dev.to
- [ ] Technical deep-dive into the challenges (focus trapping, ARIA live regions, keyboard navigation)
- [ ] Naturally leads to tour-kit as the solution without being a sales pitch
- [ ] Cross-post to Hashnode for additional reach

**awesome-react submission:**
- [ ] Fork awesome-react, add tour-kit to the appropriate section, submit PR
- [ ] This plants a flag in a high-traffic resource list that developers browse for library discovery

### Week -2: Community Priming

Shift from "building presence" to "building anticipation."

**Building in public updates:**
- [ ] Twitter/X thread: "I've been building a headless product tour library for the past [X] months. Here's what I learned about positioning engines..." (technical insight, not promotion)
- [ ] Share a GIF of tour-kit working in a real app -- no branding, just the UX
- [ ] Post a bundle size comparison (tour-kit vs competitors) as a standalone insight

**Newsletter outreach:**
- [ ] Email editors of This Week in React (Sebastien Lorber), React Status, JavaScript Weekly, Bytes
- [ ] Subject line: "New open-source headless tour library for React -- launching [date]"
- [ ] Provide: one-paragraph description, GitHub link (if public), key differentiators, a code screenshot
- [ ] Ask for inclusion in the "Libraries" or "New Releases" section
- [ ] Follow up once, 3 days before launch, with a reminder

**Prepare all launch-day copy:**
- [ ] Show HN title and founder comment (see Channel-Specific Playbooks below)
- [ ] Product Hunt listing: tagline, description, first comment, gallery images
- [ ] Reddit posts for r/reactjs, r/webdev, r/nextjs (different angles per subreddit)
- [ ] Twitter/X launch thread (8-10 tweets)
- [ ] Dev.to article (long-form, technical)
- [ ] Have 2-3 people review all copy for tone, accuracy, and authenticity

**Record demo assets:**
- [ ] 30-second GIF: basic tour setup and execution (for README and social)
- [ ] 60-second GIF: headless mode with custom shadcn/ui components
- [ ] 2-minute video: full getting-started walkthrough (for Product Hunt and docs)
- [ ] Screenshot: TypeScript autocompletion in VS Code showing tour-kit types
- [ ] Screenshot: Lighthouse accessibility score of 100 on a tour-kit demo page
- [ ] Architecture diagram: how core, react, and hints packages relate

### Week -1: Final Prep

The week before launch is about eliminating risk, not adding features.

**Launch rehearsal:**
- [ ] Dry-run all launch posts with 2-3 trusted developer friends
- [ ] Test every link in every post -- GitHub, docs, npm, examples
- [ ] Test `pnpm add @tour-kit/react` one more time in a fresh project
- [ ] Time the getting-started guide: if it takes more than 5 minutes, simplify it
- [ ] Run a Lighthouse audit on the docs site -- fix any accessibility or performance issues

**Analytics and tracking:**
- [ ] Set up analytics on docs site (Plausible, Fathom, or PostHog -- privacy-respecting)
- [ ] Track: page views, getting-started page completion, npm install command copies
- [ ] Set up GitHub star tracking (star-history.com or similar)
- [ ] Set up npm download tracking
- [ ] Create a launch-day dashboard that shows all metrics in one view

**Response preparation:**
- [ ] Write response templates for common questions (see Objection Handling in document 05)
- [ ] Prepare honest answers for: "What's the catch?", "How is this maintained?", "Why not just use Joyride?", "Does it work with [X]?"
- [ ] Identify which team member monitors each channel on launch day
- [ ] Set up notifications for GitHub issues, HN comments, Reddit replies, Twitter mentions

**Product Hunt setup:**
- [ ] Create "Upcoming" page on Product Hunt (builds follower notifications)
- [ ] Schedule the launch for a Tuesday, Wednesday, or Thursday -- avoid weekends and Mondays
- [ ] Launch time: 12:01 AM PT (gives a full 24-hour window to climb the leaderboard)
- [ ] Prepare gallery images: code screenshots, architecture diagram, comparison table, demo GIFs
- [ ] Draft the "Maker's Story" first comment -- personal, technical, honest

---

## Launch Week (Day by Day)

### The Supabase Model, Adapted for Tour-Kit

Supabase invented "Launch Week": ship one major feature or announcement every day for a week, with a coordinated blog post and social push each morning at 8 AM PT. The concept was born from a simple question: "Why just have one launch? Why can't we ship one major thing every day?" During the last week of March 2021, they shipped 7 major features and saw an immediate uptick in growth rate which helped solidify their strategy. They now run a launch week every 3-4 months, building for 3 months and then launching everything in a coordinated burst.

Tour-kit adapts this: Monday is the main launch (core + react + hints), and Tuesday through Friday spotlight extended package categories -- building a week of continuous content and engagement.

**Critical learning from Supabase:** Never ship to production on the day of the launch itself. All code, docs, and demos must be ready and deployed before launch week begins. Launch week is for announcing and engaging, not for deploying.

### Monday: Main Launch Day

The single most important day. Everything fires at once.

**Pre-dawn (before 8 AM PT):**
- 12:01 AM PT: Product Hunt listing goes live (auto-scheduled)
- Immediately after: Post the Maker's Story as first comment on Product Hunt
- Notify 20-30 close supporters to check out the PH listing and leave genuine feedback

**Morning (8:00-10:00 AM PT):**
- 8:00 AM PT: Show HN post goes live
  - Title: `Show HN: Tour-Kit -- Headless product tours for React (open source)`
  - Link: GitHub repository (NOT the marketing site)
  - Immediately post the founder comment (see HN playbook below)
- 8:30 AM PT: Twitter/X launch thread goes live
  - Pin the thread to your profile
  - Tag relevant accounts (shadcn, React, Vercel) only if there's a genuine connection
- 9:00 AM PT: Email newsletter editors with "we just launched" follow-up
- 10:00 AM PT: Reddit posts go live
  - r/reactjs first (primary audience)
  - r/webdev second (30 minutes later)
  - r/nextjs third (if applicable, different angle)
  - One post per subreddit. Never cross-post identical content.

**All day:**
- Respond to EVERY comment on Hacker News -- especially critical ones
- Respond to EVERY comment on Product Hunt
- Respond to EVERY comment on Reddit
- Retweet and quote-tweet any positive mentions on Twitter/X
- If someone reports a bug, fix it immediately and respond with the fix
- Share real-time metrics transparently on Twitter: "We just hit 100 stars!" (people love watching numbers climb)

**Evening (5:00-8:00 PM PT):**
- Dev.to article goes live (catches the evening/next-morning reading crowd in EU/Asia)
- Post a "Thank you" update on Twitter/X with day-one metrics
- Address the top 3 questions or concerns that came up during the day

**Dub.co tactic -- "Shoutouts":**
Dub.co won #1 Product of the Month by posting "Shoutouts" on X to the tools that helped them build their product. Every tool they mentioned retweeted the shoutout, amplifying Dub.co's launch to those tools' audiences. On launch day, they achieved 150 upvotes and 50 comments in the first hour, with 2,000+ unique visitors and 663 new signups (8x daily average). Tour-kit should do the same:
- Thank Floating UI (positioning engine)
- Thank shadcn/ui (design system inspiration)
- Thank Radix UI (primitives)
- Thank Turborepo (build system)
- Thank tsup (bundling)
Each shoutout is a tweet that mentions the tool's account, with a genuine reason why it was valuable. The tool's team often retweets, exposing tour-kit to their entire audience.

### Tuesday: Checklists + Announcements Spotlight

**8:00 AM PT: Blog post** -- "Beyond Tooltips: Onboarding Checklists and Product Announcements in React"
- Show how @tour-kit/checklists handles task dependencies and progress tracking
- Show how @tour-kit/announcements supports modals, toasts, banners, slideouts, spotlights
- Include code examples, a demo GIF, and a comparison to Appcues' equivalent features

**Twitter/X thread** -- 5-6 tweets breaking down the checklist and announcement packages
- Tweet 1: The problem (onboarding is more than tooltips)
- Tweet 2: Code example of a checklist with dependencies
- Tweet 3: Demo GIF of announcements (modal, toast, banner)
- Tweet 4: Comparison table vs Appcues (feature parity at $99 vs $3,000/yr)
- Tweet 5: Link to docs

**Reddit** -- Post in r/reactjs: "How we built onboarding checklists with task dependencies in React" (technical, show code)

### Wednesday: Analytics + Adoption Spotlight

**8:00 AM PT: Blog post** -- "Plugin-Based Analytics for Product Tours: PostHog, Mixpanel, Amplitude"
- Show the analytics plugin architecture
- Show how @tour-kit/adoption tracks feature usage and triggers nudges
- Code example: tracking tour completion in PostHog

**Twitter/X thread** -- Focus on the analytics plugin system
- Highlight: "Track tour completion in the tools you already use -- no new dashboard"

### Thursday: Media + Scheduling Spotlight

**8:00 AM PT: Blog post** -- "Embed Video in Product Tours: YouTube, Vimeo, Loom, Lottie Support"
- Show @tour-kit/media embedding capabilities
- Show @tour-kit/scheduling for time-based tour delivery
- Use case: "Show a Loom walkthrough to new users on their first Monday"

**Twitter/X thread** -- Focus on the media package with a visual demo GIF

### Friday: The Future + Community

**8:00 AM PT: Blog post** -- "What's Next for Tour-Kit: AI-Powered Tours, Surveys, Segmentation"
- Share the roadmap publicly
- Include a survey or GitHub Discussion asking the community what they want next
- Invite contributors: highlight "good first issue" labels, the contributing guide, and the codebase architecture

**Twitter/X thread** -- "We shipped 8 packages this week. Here's what we learned and what's next."
- Summarize the week's metrics (stars, downloads, PH rank, HN points)
- Thank the community
- Ask for feature requests and contributions

### All Week: Engagement Rules

1. **Respond to everything.** Every HN comment, every Reddit reply, every PH review, every Twitter mention. Supabase's team actively engages with their community during launch weeks -- it's a marathon, not a sprint.
2. **Fix bugs in real-time.** If someone reports an issue, fix it within hours and reply with the fix. Nothing builds trust faster than responsive maintainership during launch week.
3. **Share metrics transparently.** Post real-time star counts, download numbers, and traffic. Developers respect transparency, and watching numbers climb creates FOMO.
4. **Don't argue with critics.** On HN especially, agree with valid criticism first, then explain your perspective. "You're right that [X] is a limitation. Here's why we made that tradeoff..." wins more hearts than defending your decisions.
5. **Track what resonates.** Note which tweets, which Reddit angles, which HN arguments get the most engagement. Double down on those themes in post-launch content.

---

## Post-Launch Phase (Weeks 1-4 After)

### Week +1: Capitalize on Momentum

The worst mistake after a successful launch is going silent. The audience is warm. Keep feeding them.

**Blog post: "What We Learned from Launching on Hacker News"**
- Share the experience authentically: what went well, what surprised you, what broke
- Include real numbers: HN points, PH upvotes, GitHub stars gained, npm downloads, docs traffic
- Developers love post-mortem content -- it's both useful and entertaining
- Cross-post to Dev.to and Hashnode

**Transparent metrics sharing:**
- Twitter thread with launch week numbers: stars, downloads, page views, countries reached
- Screenshot of the star-history graph showing the launch spike
- npm download chart

**Community acknowledgment:**
- Thank everyone who starred, commented, shared, or reported bugs
- Highlight specific helpful comments or contributions
- If anyone submitted a PR during launch week, give them a public shoutout

**Feature request triage:**
- Compile the top 10 feature requests from all channels
- Post them as a GitHub Discussion or issue with a "help wanted" label
- Respond to each request with a timeline estimate or "not planned" with explanation

### Week +2: Content Push

**Comparison page #1: Tour-Kit vs React Joyride**
- Honest, detailed, code-side-by-side comparison
- Acknowledge Joyride's strengths (maturity, ecosystem, 400K+ weekly downloads)
- Show where tour-kit adds value: headless mode, TypeScript strict, shadcn/ui native, accessibility, extended packages
- Publish on docs site and cross-post a summary to Dev.to
- This page becomes a permanent SEO asset ranking for "react joyride alternative"

**Migration guide: From React Joyride to Tour-Kit**
- Step-by-step migration for the most common Joyride patterns
- Before/after code examples
- Estimated migration time: "Most apps can migrate in 1-2 hours"
- This removes the biggest barrier for Joyride users considering a switch

**Tutorial: "Add a Product Tour to Next.js App Router in 5 Minutes"**
- The fastest path from `npx create-next-app` to a working tour
- Uses shadcn/ui components
- Publishable on the docs site, Dev.to, and as a Twitter thread
- Targets the exact search query our Primary and Secondary ICPs use

### Week +3: Community Building

**Launch GitHub Discussions:**
- Enable Discussions on the repo with categories: General, Ideas, Show and Tell, Q&A
- Seed with 2-3 discussion posts: "What features do you want next?", "Share your tour-kit setup", "How are you using tour-kit?"
- Respond to every new discussion within 24 hours

**First contributor spotlight:**
- If anyone contributed during launch week or week +1, write a short shoutout post
- Tag them on Twitter, mention them in the README's contributors section
- This signals that contributions are valued and encourages more

**Comparison page #2: Tour-Kit vs Appcues**
- Target the Tertiary ICP (Product Managers evaluating alternatives)
- Lead with cost: $99 once vs $2,988-$10,500/year
- Include feature parity matrix
- Include "What you gain" and "What you give up" sections (honesty builds trust)
- Total cost of ownership calculator
- This page ranks for "appcues alternative" -- a high-intent PM search term

**Newsletter follow-up:**
- Email newsletter editors again with launch results: "Tour-Kit launched last week, hit [X] on HN, [Y] stars, [Z] downloads. Here's a one-paragraph update for your readers."
- Newsletters often feature tools twice: once at launch, once with traction proof

### Week +4: Pro Tier Soft Launch

**Announce Pro tier availability:**
- Blog post: "Introducing Tour-Kit Pro: Analytics, Checklists, Announcements, and More"
- Frame it as: "The free tier covers 80% of use cases. Pro is for teams that need the other 20%."
- Be explicit about what's free forever and what's Pro-only

**Share the pricing philosophy:**
- Twitter thread: "Why Tour-Kit Pro is $99 one-time, not $300/month"
- Explain the economics: no server infrastructure to maintain, no per-MAU costs to pass on, one-time pricing is sustainable because the marginal cost of a license is near zero
- This thread doubles as a manifesto that resonates with indie hackers and cost-conscious engineering leads

**Early adopter incentive (assess based on momentum):**
- Option A: Launch discount -- $79 for the first 100 buyers (creates urgency)
- Option B: Free Pro license for anyone who contributed to the repo (rewards community)
- Option C: No discount -- $99 is already aggressive, don't undermine the price anchor
- Decision depends on launch momentum: if stars > 1,000 and downloads > 2,000/week, no discount needed. If below targets, Option A can accelerate adoption.

---

## Channel-Specific Playbooks

### Hacker News

HN is the highest-leverage channel for developer tools. A front-page Show HN post can generate 50,000+ page views, 500+ GitHub stars, and lasting SEO value from the discussion thread itself.

**Title format:**
```
Show HN: Tour-Kit -- Headless product tours for React (open source)
```

**Rules for the title:**
- Include "Show HN:" prefix -- this places it on the Show tab, which is less competitive and gives more time to gather upvotes
- State what it is, not what it claims to be. "Headless product tours for React" is factual. "The best product tour library" is marketing.
- Include "(open source)" -- HN rewards open-source projects
- Do NOT use superlatives, exclamation marks, or emoji

**Link target:** GitHub repository. Not the docs site. Not a landing page. HN developers want to see the code, the README, the commit history, and the stars. Linking to a marketing page signals "this is a product, not a project" and triggers skepticism.

**Founder comment (post within 5 minutes of submission):**
This is the most important comment you'll write. It should include:

1. **Who you are** -- "I'm [name], the creator of tour-kit."
2. **Why you built it** -- The origin story. Keep it personal and technical: "I was migrating a Next.js app to React 19 and React Joyride broke. I looked at the alternatives and found that every tour library either forces its own styling, doesn't support TypeScript properly, or costs $300/month as a SaaS tool. I wanted something headless -- hooks and utilities that I could wrap in my own shadcn/ui components."
3. **What makes it different** -- 2-3 technical differentiators, not marketing claims: "The core is a set of React hooks (useTour, useStep, useHint) that handle positioning via Floating UI, focus trapping, keyboard navigation, and ARIA announcements. You provide the UI. It's TypeScript strict mode throughout, tree-shakeable, and the core is under 8KB gzipped."
4. **What it doesn't do** -- Acknowledge limitations upfront. "There's no visual/WYSIWYG editor -- this is a code-first library for developers. There's no Vue or Angular support. And while the core is MIT-licensed and free, extended packages (analytics, checklists, announcements) are $99 one-time."
5. **Ask for feedback** -- "I'd love feedback on the API design, the docs, and anything you think is missing."

**Engagement rules for HN:**
- Respond to every comment, especially critical ones
- Agree with valid criticism first: "You're right that [X] -- here's why we made that tradeoff..."
- Never be defensive. Never be dismissive. Never argue.
- Share technical details generously -- HN rewards depth
- If someone asks about a missing feature, be honest: "That's not supported yet, but here's the issue tracking it"
- If a competitor's maintainer shows up and comments, be respectful and generous. "Joyride is a great library that served the community well for years" costs nothing and earns goodwill.

**If HN doesn't hit front page (backup plan):**
- Wait 48 hours and try a different title angle: "Show HN: Open-source alternative to Appcues for React developers"
- HN allows re-submissions if the original didn't gain traction
- Alternatively, post a technical blog post ("How We Built a Positioning Engine for Product Tours") as a non-Show-HN submission
- Don't spam. Two attempts max. If neither works, focus on other channels and try again with a future launch moment (e.g., checklists package launch)

### Product Hunt

Product Hunt rewards preparation, community, and visual polish. It's less technical than HN but reaches a broader audience including Product Managers (our Tertiary ICP) and indie hackers (our Secondary ICP).

**Launch timing:**
- Schedule for Tuesday, Wednesday, or Thursday
- Go live at 12:01 AM PT -- this gives a full 24-hour window
- Never launch on a weekend, Monday, or holiday

**Tagline (60 characters max):**
```
Headless product tours for React. $99 once, not $300/month.
```

**Description (260 characters max):**
```
Open-source React library for product tours, onboarding checklists, and announcements. Headless architecture -- use your own components. Built for shadcn/ui and TypeScript. Free core. Pro is $99 one-time.
```

**First comment (Maker's Story):**
Post immediately after launch goes live. This is your personal narrative:
- Why you built it (the pain of SaaS pricing and ugly overlays)
- How it works (hooks + your components)
- What's free vs paid (be transparent)
- What's next (roadmap highlights)
- Ask for feedback

**Gallery images (5 recommended):**
1. Code screenshot: a simple tour setup in 10 lines of code
2. Demo GIF: tour running in a real-looking app with shadcn/ui components
3. Architecture diagram: how core, react, and hints packages compose
4. Comparison table: Tour-Kit vs React Joyride vs Appcues (features + pricing)
5. TypeScript autocompletion screenshot: showing the developer experience

**Do NOT use marketing renders or stock imagery.** Developer-tool audiences on Product Hunt respond to code screenshots and real product demos. Polish the code, not the graphics.

**Engagement on launch day:**
- Respond to every comment and review within 30 minutes
- Thank every upvoter who leaves a comment
- If someone asks a technical question, give a thorough answer (this signals credibility to other visitors)
- Ask early supporters to leave genuine reviews -- never ask for upvotes directly (PH detects and penalizes coordinated voting)

**Dub.co's "Shoutouts" tactic:**
Post tweets thanking the tools that helped build tour-kit (Floating UI, shadcn/ui, Radix, Turborepo, tsup). Tag the official accounts. When those teams retweet your shoutout, their audience sees tour-kit. Dub.co attributes this tactic to their #1 Product of the Month win.

### Reddit

Reddit is the most authenticity-sensitive channel. Accounts that exist only to promote get downvoted and banned. The prep work in weeks -4 and -3 (genuine engagement) is essential.

**r/reactjs (Primary -- 525K+ members):**
- Title: "I built a headless product tour library for React -- looking for feedback"
- Format: Text post, not link post. Show code first. Explain what it does, how it works, and why you built it.
- Include: 2-3 code examples, a GIF if possible, link to GitHub
- Tone: "I'm a developer sharing something I built" -- NOT "check out our product"
- End with a question: "What would you want from a headless tour library?" -- invites discussion

**r/webdev (Broader audience):**
- Title: "Open-source alternative to Appcues and Pendo for React apps"
- Angle: Compare to SaaS tools, emphasize the cost savings and developer control
- This audience includes PMs and full-stack devs who evaluate tools differently than the r/reactjs crowd

**r/nextjs (Framework-specific):**
- Title: "How to add product tours to Next.js App Router (tutorial + open-source library)"
- Angle: Tutorial-first. Show the Next.js-specific setup, App Router compatibility, and integration steps
- Link to a tutorial or the Next.js example app

**Rules for all subreddits:**
- ONE post per subreddit. Never duplicate. Never cross-post.
- Never ask friends to upvote. Reddit's algorithm detects coordinated voting from the same network.
- Respond to every comment, especially negative ones, with grace and technical substance.
- If the post gets downvoted or removed, do not repost. Move on to other channels.
- Never use sockpuppet accounts to comment on your own post.

### Twitter/X

Twitter is the primary discovery channel for React ecosystem tools. It's also where indie hackers discover their stack.

**Launch thread (8-10 tweets):**

```
Tweet 1: The problem
"Every React tour library either forces its styling on you or costs $300/month
as a SaaS tool. I built something different."

Tweet 2: The solution
"Tour-kit is headless. You get hooks (useTour, useStep, useHint) that handle
positioning, focus, and keyboard nav. You write the UI with your own components."

Tweet 3: Code example
[Screenshot of a 10-line tour setup using shadcn/ui components]

Tweet 4: Demo
[GIF of a tour running in a real app]

Tweet 5: TypeScript
"TypeScript strict mode from day one. Full type inference. Step IDs are typed
-- typos caught at compile time."
[Screenshot of VS Code autocompletion]

Tweet 6: Accessibility
"WCAG 2.1 AA built in. Focus traps, ARIA live regions, keyboard nav,
prefers-reduced-motion support. Lighthouse a11y: 100."

Tweet 7: Beyond tours
"Pro packages: analytics (PostHog, Mixpanel), onboarding checklists, product
announcements, feature adoption tracking. $99 once."

Tweet 8: The math
"Appcues: $2,988/yr. UserGuiding: $1,068/yr. Pendo: $6,000+/yr.
Tour-kit Pro: $99 total. One payment. Forever."

Tweet 9: Free tier
"The free tier (core + react + hints) covers 80% of use cases. MIT licensed.
No limits. No trial expiration."

Tweet 10: CTA
"Star on GitHub: [link]
Try it: pnpm add @tour-kit/react
Docs: [link]
Product Hunt: [link]"
```

**Thread rules:**
- Pin the thread to your profile
- Add 1-2 relevant hashtags max (#ReactJS, #OpenSource). Don't overdo it.
- Quote-tweet any positive mentions throughout the day
- Reply to every comment on the thread
- Post the thread between 8-10 AM PT (peak developer Twitter activity)

**Ongoing Twitter strategy during launch week:**
- One thread per day (spotlight package threads for Tue-Fri)
- Retweet anyone who mentions tour-kit with a thank-you
- Share screenshots of milestones: "500 stars!", "1,000 npm downloads!"
- Never dunk on competitors. Always be generous.

### Dev.to

Dev.to reaches developers who prefer long-form content over Twitter threads. It also has strong SEO that can rank for tutorial-style queries.

**Launch day article:**
- Title: "Introducing Tour-Kit: Headless Product Tours for React"
- Structure: Problem > Solution > Code examples > Comparison > Getting started > What's next
- Length: 1,500-2,500 words
- Include: 3-4 code examples, 1-2 GIFs, the comparison table, a getting-started snippet
- Publish in the evening on launch day (catches EU/Asia morning readers)
- Tags: #react, #typescript, #opensource, #webdev

---

## Success Metrics

### Launch Day Targets

| Metric | Target | Stretch | How to Measure |
|--------|--------|---------|----------------|
| HN front page | Yes | Top 10 | news.ycombinator.com |
| HN points | 100+ | 300+ | Show HN post |
| PH daily rank | Top 5 | #1 Daily | producthunt.com |
| PH upvotes | 200+ | 500+ | Product Hunt dashboard |
| GitHub stars (day 1) | 200+ | 500+ | GitHub repo |
| npm downloads (day 1) | 500+ | 1,000+ | npm stats |
| Docs visitors (day 1) | 2,000+ | 5,000+ | Analytics dashboard |

### Launch Week Targets

| Metric | Target | Stretch | How to Measure |
|--------|--------|---------|----------------|
| GitHub stars (week) | 500+ | 1,500+ | star-history.com |
| npm weekly downloads | 1,000+ | 3,000+ | npm stats |
| Docs weekly visitors | 5,000+ | 15,000+ | Analytics dashboard |
| Twitter impressions | 50,000+ | 200,000+ | Twitter analytics |
| Reddit post karma (combined) | 200+ | 500+ | Reddit posts |
| Dev.to article reactions | 100+ | 300+ | Dev.to dashboard |
| GitHub issues opened | 10+ | 30+ | GitHub issues |
| Newsletter mentions | 1+ | 3+ | Manual tracking |

### 30-Day Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| GitHub stars | 1,000+ | GitHub repo |
| npm weekly downloads | 2,000+ | npm stats |
| Docs monthly visitors | 10,000+ | Analytics dashboard |
| Pro licenses sold | 10+ | Payment dashboard |
| GitHub contributors | 5+ | GitHub contributors page |
| Comparison page SEO rankings | Page 2+ for "react joyride alternative" | Google Search Console |

### 90-Day Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| GitHub stars | 2,000+ | GitHub repo |
| npm weekly downloads | 5,000+ | npm stats |
| Docs monthly visitors | 20,000+ | Analytics dashboard |
| Pro licenses sold | 100+ | Payment dashboard |
| Discord members | 200+ | Discord server |
| Newsletter subscribers | 1,000+ | Email platform |
| SEO: page 1 for 3+ target keywords | Yes | Google Search Console |

---

## Risk Mitigation

### Risk: HN Post Doesn't Hit Front Page

**Likelihood:** Medium. Most Show HN posts don't reach the front page. HN's algorithm factors in velocity of upvotes, comment quality, and timing.

**Backup plan:**
1. Wait 48 hours and resubmit with a different title angle (e.g., "Show HN: Open-source Appcues alternative for React")
2. Post a technical blog post as a non-Show-HN submission: "How We Built a WCAG 2.1 AA-Compliant Tour Overlay in React" -- HN loves deep technical content
3. Focus energy on other channels (PH, Reddit, Twitter) that are more controllable
4. Use a future launch moment (checklists package, analytics package) for another HN attempt
5. Maximum 2 Show HN attempts per launch moment. Do not spam.

### Risk: Critical Bug Found on Launch Day

**Likelihood:** Medium-High. Increased traffic exposes edge cases that testing didn't catch.

**Response protocol:**
1. Acknowledge the bug publicly within 30 minutes of the report: "Thanks for catching this -- fixing it now"
2. Fix and release a patch version within 2-4 hours. Do not let a bug sit overnight on launch day.
3. Reply to the original reporter with the fix version: "Fixed in @tour-kit/react@1.0.1 -- pnpm update should pick it up"
4. Post a brief Twitter update: "Shipped a hotfix for [issue]. Thanks to [reporter] for catching it. This is why launching in public works."
5. Responsive bug fixing during launch actually builds credibility -- it shows active maintenance

### Risk: Negative Reception or Harsh Criticism

**Likelihood:** Medium. HN is famously critical. Reddit can be harsh. Some criticism will be valid; some will not.

**Response playbook:**
- **Valid technical criticism** (e.g., "the positioning engine doesn't handle scroll containers"): "You're right -- that's a known limitation. Here's the tracking issue: [link]. We're planning to address it in v1.1. Thanks for raising it."
- **Philosophical disagreement** (e.g., "just build your own, it's not that hard"): "Totally valid perspective. For teams that want full control of every line, building from scratch makes sense. Tour-kit is for teams that want to skip the 40-80 hours of positioning engine, focus trap, and ARIA work and get to the product-specific logic faster."
- **Pricing criticism** (e.g., "$99 for open source? Come on."): "The core is free and MIT-licensed -- tours, hints, spotlights, keyboard nav, full TypeScript. Pro adds analytics, checklists, announcements, and more for teams that need them. The same model as Tailwind UI and shadcn/ui pro components."
- **Competitor comparisons** (e.g., "React Joyride does this for free"): "Joyride is a great library. Tour-kit takes a different approach: headless hooks instead of a styled component, TypeScript strict mode, and an extended package ecosystem. If Joyride works for your use case, keep using it."
- **Never:** Be defensive, dismissive, sarcastic, or argue. Every response is visible to thousands of potential users.

### Risk: Competitor Launches Same Week

**Likelihood:** Low but possible. React Joyride v3, a new entrant, or a SaaS tool's pricing change could steal attention.

**Differentiation talking points (ready to deploy):**
- If a styled library launches: "Tour-kit is headless -- you bring your own components. Different philosophy for different needs."
- If a SaaS tool drops pricing: "$99 once is still cheaper than any monthly subscription over 2 months."
- If React Joyride ships a major update: "Great to see the ecosystem improving. Tour-kit offers a headless alternative with extended packages for teams that want more than tooltip tours."
- Do NOT attack competitors. Acknowledge them, differentiate, and move on.

### Risk: Product Hunt Launch Falls Flat

**Likelihood:** Medium. PH performance depends heavily on early-hour velocity and is less controllable than other channels.

**Backup plan:**
1. PH allows multiple launches. Save the next launch for a significant feature drop (checklists, analytics, or a "v2" milestone)
2. Focus on generating genuine reviews from early users over the following weeks -- reviews compound and improve future launches
3. A mediocre PH showing doesn't affect HN, Reddit, Twitter, or SEO. Diversification across channels means no single channel failure sinks the launch.

### Risk: Low npm Downloads Despite GitHub Stars

**Likelihood:** Medium. Stars don't equal installs. Some people star and forget.

**Recovery plan:**
1. Improve the getting-started experience: if the docs don't result in a working tour in 5 minutes, simplify ruthlessly
2. Add a "copy to clipboard" button for `pnpm add @tour-kit/react` on the README and docs
3. Create a `create-tour-kit-app` CLI that scaffolds a working example project
4. Publish more tutorials on Dev.to and Hashnode with copy-paste-ready code
5. Stars are leading indicators; downloads are lagging. Give it 2-4 weeks before sounding the alarm.

---

## Launch Day Checklist (Print This)

**The Night Before:**
- [ ] All packages published to npm and installable
- [ ] Docs site live with no broken links
- [ ] Example apps deployed and working
- [ ] All launch copy reviewed and finalized
- [ ] Product Hunt listing scheduled for 12:01 AM PT
- [ ] Analytics dashboard set up and tracking
- [ ] Phone notifications enabled for GitHub, Twitter, Reddit, HN
- [ ] Coffee purchased

**Launch Morning (8:00-10:00 AM PT):**
- [ ] Show HN posted at 8:00 AM PT
- [ ] HN founder comment posted within 5 minutes
- [ ] Twitter/X thread posted at 8:30 AM PT
- [ ] Thread pinned to profile
- [ ] Newsletter editors emailed with "we just launched" note
- [ ] Reddit r/reactjs posted at 10:00 AM PT
- [ ] Reddit r/webdev posted at 10:30 AM PT

**All Day:**
- [ ] Responding to HN comments (check every 15 minutes)
- [ ] Responding to PH comments and reviews
- [ ] Responding to Reddit comments
- [ ] Responding to Twitter mentions
- [ ] Monitoring GitHub issues for bugs
- [ ] Sharing milestone updates on Twitter ("500 stars!")
- [ ] Posting "Shoutout" tweets to tools that helped build tour-kit

**Evening:**
- [ ] Dev.to article published
- [ ] Day-one metrics captured and shared
- [ ] Top questions and concerns documented
- [ ] Tomorrow's spotlight content (Checklists + Announcements) queued

---

## Appendix: Lessons from Reference Launches

### Cal.com

Cal.com hit #1 on Hacker News with the title "Open Source Calendly" and a link to a working prototype. No description text. The founder noticed that Reddit threads and HN posts had been asking for an open-source Calendly alternative with no existing solutions. The result: millions of page views and 5,000+ GitHub stars in weeks. They subsequently launched on Product Hunt multiple times -- the original Cal.com in April 2021, v2.0 in September 2022, Cal.ai in October 2023, and Cal.com Platform in April 2024 -- demonstrating the "launch many times" philosophy.

**Lesson for tour-kit:** Solve a problem that developers are already complaining about. "Open-source Appcues" works because developers are already frustrated with SaaS onboarding pricing. Position against the known incumbent. Keep the launch post minimal -- if the product is good and the pain is real, less copy is more.

### Supabase

Supabase runs Launch Weeks every 3-4 months, shipping one major feature per day for a week at 8 AM PT. They launched on Product Hunt 16 times in 4 years. Only 9 were awarded, and they kept shipping anyway. The concept originated in March 2021 when the team asked "Why just have one launch?" and shipped 7 major features in a single week, seeing an immediate uptick in growth. They start planning with team meetings where they construct "The Supabase Universe" on a whiteboard -- a brain dump of everything related to the launch. Critical rule: all code ships before launch week begins, not during.

**Lesson for tour-kit:** Multiple launches compound visibility. Each extended package is a launch moment. Build for 3 months, then launch everything in a coordinated week. The repeated exposure builds familiarity and momentum that compounds over time.

### shadcn/ui

shadcn/ui grew to 90,000+ stars and 250,000+ weekly npm installs through pure community adoption. No ads. No marketing campaigns. The copy-paste-and-own-the-code philosophy resonated so deeply that developers built an entire ecosystem of templates, starter kits, and community tools around it. The registry system enables community sharing while maintaining the ownership model. It started as a side project but grew into a movement reshaping how developers think about UI libraries.

**Lesson for tour-kit:** If the developer experience is exceptional and the philosophy resonates, the community does the marketing. Tour-kit's headless approach is the same bet shadcn/ui made: give developers ownership, and they'll spread the word. Invest in docs and DX before investing in marketing.

### Dub.co

Dub.co won #1 Product of the Month on Product Hunt. On launch day, they achieved 150 upvotes and 50 comments in the first hour, enough to reach the top of the leaderboard where they stayed for the rest of the day. Their "Shoutouts" tactic -- tweeting thanks to every tool that helped them build Dub.co -- led to retweets from those tools' official accounts AND the official Product Hunt X account. Results: 2,000+ unique visitors and 663 new signups on launch day (8x daily average).

**Lesson for tour-kit:** The Shoutouts tactic is free, genuine, and high-leverage. Thank the tools you're built on (Floating UI, shadcn/ui, Radix, Turborepo). Their audiences are your target audience. Also: most PH launches fail not on launch day but after -- founders don't convert the traffic spike. Have a post-launch conversion system ready (getting-started guide, email capture, Pro tier path).

---

## How This Document Connects to the Strategy

| Related Document | How It Connects |
|-----------------|-----------------|
| 03 - Ideal Customer Profiles | Every channel choice and message angle traces to a specific ICP |
| 05 - Positioning & Messaging | Launch copy draws directly from the one-liners, elevator pitches, and objection handling |
| 06 - SEO & Content Strategy | Post-launch comparison pages and tutorials feed the SEO strategy |
| 08 - Community Building Plan | Launch week engagement transitions into ongoing community building |
| 09 - Social Media Strategy | Launch week Twitter/Reddit tactics set the pattern for ongoing social |
| 11 - GitHub README Optimization | The README is your launch-day landing page -- it must be perfect |
| 14 - Launch Day Copy Kit | The actual copy for every channel, pre-written and reviewed |
| 15 - Visual & Demo Assets | GIFs, screenshots, and videos needed for every launch channel |
