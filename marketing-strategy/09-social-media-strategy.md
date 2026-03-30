# Social Media Strategy

> Platform-specific playbooks for building tour-kit's presence where React developers, indie hackers, and product leaders spend their time. Every post, reply, and thread traces back to the ICPs defined in [03-ideal-customer-profiles.md](./03-ideal-customer-profiles.md) and follows the tone rules in [02-tone-of-voice.md](./02-tone-of-voice.md).

---

## Platform Priority

Ranked by expected ROI for a developer-first, React-focused open-source library:

| Priority | Platform | Why | Primary ICP Served |
|----------|----------|-----|-------------------|
| 1 | **Twitter/X** | The React ecosystem lives here. Library authors, framework teams, and senior devs discover tools through threads and retweets. | Frontend Lead, Indie Hacker |
| 2 | **Reddit** | High-intent traffic. When someone posts "what product tour library should I use?" on r/reactjs, they are ready to install something today. | Frontend Lead |
| 3 | **Dev.to / Hashnode** | SEO-powered discovery. Articles rank on Google for long-tail queries like "react product tour tutorial" and drive traffic for months. | Frontend Lead, Indie Hacker |
| 4 | **YouTube** | Evergreen tutorials. A "Build a product tour in 5 minutes" video compounds views over years. | Frontend Lead, Indie Hacker |
| 5 | **LinkedIn** | Reaches product managers and engineering managers -- the people who approve SaaS budget cuts and champion new tools internally. | Product Manager / Growth Lead |
| 6 | **Bluesky** | Growing developer community (40M+ users as of late 2025). Low-effort hedge against X instability. 400K+ monthly ATProto SDK downloads signal real developer adoption. | Frontend Lead |

---

## Twitter/X Strategy

### Account Setup

**Handle:** `@tour_kit` (or closest available). Short, matches the npm scope `@tour-kit/*`.

**Bio:** Keep it factual. No superlatives.

> Headless product tours for React. Hooks-based, accessible, TypeScript-strict. Free (MIT) + Pro ($99 once). Built for the shadcn/ui era.

**Pinned tweet:** A short thread showing a working tour in under 10 lines of code, with a GIF demo. End with a link to the docs. Update the pinned tweet when a major version ships.

**Profile image:** The tour-kit logo mark on a solid background. No gradients, no text -- it needs to be legible at 48x48px.

**Banner:** A clean code screenshot showing the `useTour` hook in action, with the tour-kit logo and tagline. Use ray.so or carbon.sh for the code visual. Dark theme, large font.

**Premium subscription:** Required. X's algorithm gives Premium accounts roughly 10x more reach per post than free accounts. The gap widened further in Q1 2026. This is table stakes, not optional.

### Content Mix (Weekly Cadence)

| Day | Content Type | Example |
|-----|-------------|---------|
| Monday | **Technical tip** | "TIL you can branch tour steps based on user behavior with `useBranch`. Here's how:" + code screenshot |
| Tuesday | **Building in public** | "Shipped focus trap improvements this week. Edge case: nested dialogs inside tour steps. Here's what we changed and why:" |
| Wednesday | **Community engagement** | Reply to 3-5 relevant conversations (React, Next.js, shadcn, accessibility threads). No self-promotion -- just be helpful. |
| Thursday | **Thread** | Deep dive: "How to add product tours to a Next.js App Router project (6 steps)" or "Why we chose Floating UI over Popper.js for positioning" |
| Friday | **Technical tip** | "You can persist tour progress across sessions with 4 lines of code:" + code screenshot |

**What to avoid:**
- Pure promotional posts ("We just shipped X!") without technical substance
- Emoji bullet points (banned per tone of voice)
- Stacked hashtags (`#react #opensource #webdev #typescript #coding`)
- Engagement bait ("What's your favorite React library? Reply below!")

### Thread Formats That Work

**Educational (primary format):**
> "How to add accessible product tours to your Next.js app"
> 1. Hook with the problem (1 tweet)
> 2. Code walkthrough (3-4 tweets with screenshots)
> 3. Result: GIF of the working tour
> 4. Link to docs for the full guide

**Technical decision:**
> "Why we built tour-kit headless-first instead of shipping pre-styled components"
> Walk through the tradeoff, show what headless enables (custom UI, design system integration), acknowledge the cost (more initial setup).

**Honest comparison:**
> "Tour-kit vs React Joyride: an honest comparison"
> Use a table. Acknowledge where Joyride is stronger (larger community, more Stack Overflow answers). State where tour-kit differs (hooks-based API, accessibility, bundle size). Follow the competitor reference rules from the tone guide.

**Building-in-public story:**
> "5 things I learned building a headless UI library for React"
> Technical lessons, not motivational platitudes. What broke, what surprised you, what you'd do differently.

### X Algorithm Insights (2026)

Key changes to adapt to:

- **Articles over threads.** X now boosts external article links -- especially from Dev.to, Substack, and personal blogs. Articles comprised 45% of best-performing posts in recent analyses. Post article links alongside code snippets, not instead of them.
- **Long-form single posts over multi-tweet threads.** X's expanded character limit means a single long post gets better distribution than a 6-tweet thread. Use threads only when the format genuinely helps (step-by-step tutorials).
- **Replies matter more than likes.** A reply that gets a reply from the author is weighted 150x more than a like. Respond to every reply on your posts.
- **Tone affects reach.** Grok monitors post tone. Positive and constructive messaging gets wider distribution. Combative or negative tones reduce visibility even with high engagement. This aligns with our tone of voice -- technical and confident, never arrogant or combative.

### Growth Tactics

**Engage with ecosystem conversations.** Reply thoughtfully to threads from Vercel, Next.js, shadcn, Radix, and Tailwind accounts. Not "check out tour-kit!" but genuine technical contributions. When someone asks "how do I handle focus management in modals?" and you have relevant expertise, share it.

**Code screenshots.** Use [ray.so](https://ray.so) or [carbon.sh](https://carbon.sh) for polished code images. Dark theme, large font (16px+), TypeScript syntax highlighting. Show real tour-kit code that solves a real problem in 6-10 lines.

**Post timing.** Highest engagement for developer content: Tuesday through Thursday, 9-11 AM ET. Avoid weekends and Monday mornings.

**Cross-pollinate with other open-source maintainers.** Retweet and comment on projects in the React ecosystem (Floating UI, Radix, shadcn/ui, TanStack). Build genuine relationships. When you support other projects publicly, their communities notice.

**Leverage "build in public" indie hacker culture.** When an indie hacker tweets about their stack or onboarding challenges, reply with a helpful suggestion. If tour-kit is relevant, mention it naturally. If it's not, help anyway -- goodwill compounds.

### Metrics and Targets

| Metric | 30-Day Target | 90-Day Target |
|--------|--------------|---------------|
| Followers | 250 | 1,000 |
| Avg. impressions per post | 500 | 2,000 |
| Engagement rate | 3%+ | 4%+ |
| Link clicks to docs/repo (weekly) | 50 | 200 |
| Profile visits (weekly) | 200 | 800 |

Track with X's native analytics. Add UTM parameters to every link: `?utm_source=twitter&utm_medium=social&utm_campaign=[post-type]`.

---

## Reddit Strategy

### Why Reddit Matters

Reddit is where developers make purchase decisions. When someone posts "What's the best product tour library for React in 2026?" on r/reactjs, the top-voted answer will drive more installs than a week of tweets. But Reddit is also where self-promotion goes to die. The community can smell marketing from three subreddits away.

### Target Subreddits

| Subreddit | Members | Rules Summary | Our Approach |
|-----------|---------|--------------|--------------|
| **r/reactjs** | 525K+ | Self-promotion allowed in moderation. Must be React-related. | Primary target. Launch announcement. Answer "what library for X?" questions. |
| **r/webdev** | 2.2M+ | Stricter self-promotion rules. Must add value. | Broader audience. Tutorial posts with code examples. |
| **r/nextjs** | Growing | Next.js-specific content. | "How to add product tours to Next.js App Router" posts. |
| **r/javascript** | Large | General JS audience. | Technical deep-dives on headless architecture, not product announcements. |
| **r/SideProject** | Moderate | Explicitly allows project sharing. | Launch announcement with honest "what it does / what it doesn't" framing. |
| **r/SaaS** | Moderate | SaaS founders and builders. | Cost-saving angle: "How I replaced Appcues with an open-source library." |

### Post Formats That Get Upvoted

**"I built X to solve Y" (origin story + demo):**
> Title: "I built an open-source product tour library for React because I got tired of fighting Joyride's callback-based API"
>
> Body: Explain the problem you hit. What you tried first. Why you built your own. What it does well. What it doesn't do. Include a GIF demo. Link to the repo. Ask for feedback on the API design.

**Cost-saving story:**
> Title: "How I replaced our $3,600/year Appcues subscription with a $99 open-source library"
>
> Body: Walk through the migration. Show before/after. Be honest about what you lost (visual editor) and what you gained (performance, design system integration, no MAU limits). Include specific cost numbers.

**Answering recommendation threads:**
When someone asks "What's the best library for product tours in React?", reply with a genuine recommendation. Disclose that you're the maintainer. Mention what tour-kit does well and where other tools might be a better fit. Reddit respects honesty.

**Tutorial posts:**
> Title: "How to build accessible product tours in React (with keyboard navigation and screen reader support)"
>
> Body: A genuine tutorial that provides value even if the reader doesn't use tour-kit. The library is mentioned as the tool used in the example, not as the point of the post.

### Reddit Rules (Non-Negotiable)

1. **Never post to multiple subreddits on the same day.** Space cross-posts by at least 48 hours. Redditors check post history.
2. **10:1 ratio.** For every self-promotional post, make at least 10 genuinely helpful comments on other people's threads. Answer questions about React, TypeScript, accessibility, onboarding UX -- topics where you have real expertise.
3. **Always disclose you're the maintainer.** "Disclosure: I built this" at the top of any post about tour-kit. Reddit values transparency.
4. **Say "I" not "we."** Even if there's a team. Reddit values individual makers over brands.
5. **Accept criticism gracefully.** If someone says "this looks like React Joyride with fewer features," respond with facts. Acknowledge what Joyride does better. Explain where tour-kit differs. Never get defensive.
6. **Include what the tool does NOT do.** "No visual builder, no analytics dashboard, no drag-and-drop. It's a library, not a platform." Reddit respects scope honesty.
7. **Respond to every comment.** Even negative ones. Engagement signals value to Reddit's algorithm and builds credibility.

### What Gets Removed

- Posts that read like repurposed Twitter content
- Multiple posts in the same subreddit within a short time
- Accounts with no prior activity in the subreddit (drive-by promotion)
- Posts without code, demos, or technical substance
- Comments that are just links without context

### Cadence

- **Month 1-2:** Build karma. Comment helpfully on 3-5 threads per week across target subreddits. No self-promotion.
- **Month 2:** First post on r/SideProject (lowest promotion threshold).
- **Month 3:** Launch post on r/reactjs. By now your account has enough history to be credible.
- **Ongoing:** 1 post per month maximum. Continue commenting helpfully multiple times per week.

---

## Dev.to / Hashnode Strategy

### Why These Platforms Matter

Dev.to and Hashnode articles rank on Google for developer queries. A well-optimized article titled "How to Build Product Tours in React with TypeScript" will drive traffic for 12-24 months. These platforms have built-in audiences of developers who browse by tag -- your article appears alongside content they already trust.

### Publishing Workflow

1. **Publish first on the tour-kit blog** (or docs site) as the canonical source.
2. **Wait 24-48 hours** for Google to index the original.
3. **Cross-post to Dev.to** using Dev.to's editor. Set the canonical URL back to the original. Dev.to supports this natively.
4. **Cross-post to Hashnode** using Hashnode's import feature. Set the canonical URL.
5. **Adjust titles and tags** per platform. What works on your blog ("Tour-Kit v2.0 Release Notes") needs to be reframed for discovery ("How to Build Branching Product Tours in React").

### Content Types

**Tutorial series (highest value):**
A multi-part series drives repeat traffic and establishes authority.
- Part 1: "Build Your First Product Tour in React (5 Minutes)"
- Part 2: "Add Keyboard Navigation and Focus Management to React Tours"
- Part 3: "Multi-Page Tours with Next.js App Router"
- Part 4: "Tracking Tour Completion with Analytics"

**Comparison articles (high search volume):**
- "Tour-Kit vs React Joyride: A Technical Comparison (2026)"
- "Open Source vs SaaS Product Tours: When to Use Each"
- "5 React Product Tour Libraries Compared: Bundle Size, Accessibility, and DX"

Follow the competitor reference rules from the tone guide: use a table, acknowledge where competitors are stronger, state where tour-kit differs.

**Technical deep-dives (establishes credibility):**
- "How We Built a Headless Positioning Engine in Under 5KB"
- "Accessible Focus Trapping in React: Lessons from Building Tour-Kit"
- "Why We Chose Composition Over Configuration for Our React API"

**"How we built X" articles (build-in-public):**
- "Building an Open-Source Product Tour Library: Architecture Decisions"
- "How We Achieved WCAG 2.1 AA Compliance in a React Tour Library"

### Tags to Use

| Dev.to | Hashnode |
|--------|---------|
| `#react` | `reactjs` |
| `#typescript` | `typescript` |
| `#webdev` | `web-development` |
| `#opensource` | `open-source` |
| `#tutorial` | `tutorial` |
| `#nextjs` | `nextjs` |
| `#accessibility` | `accessibility` |
| `#javascript` | `javascript` |

Use 4 tags per post on Dev.to (the maximum). Choose based on the article's primary topic.

### Publishing Cadence

| Frequency | Content Type |
|-----------|-------------|
| 2x per month minimum | Tutorial or comparison article |
| 1x per month | Technical deep-dive or "how we built it" |
| On every release | Announcement post (reframed as a tutorial, not a press release) |

### Platform-Specific Notes

**Dev.to:**
- Articles with code blocks and clear headings perform best
- The Dev.to community values practical, beginner-friendly content
- Series feature lets you link multi-part tutorials together
- X's algorithm now boosts Dev.to links specifically -- post your Dev.to articles on X for compounding reach

**Hashnode:**
- Better for long-form, in-depth technical writing
- Custom domain support means you can publish on `blog.tour-kit.dev` and get Hashnode's distribution
- Hashnode's newsletter feature lets readers subscribe to your publication
- Stronger SEO tooling (custom meta descriptions, OG images)

---

## YouTube Strategy

### Why YouTube

A developer searching "react product tour tutorial" on YouTube is further down the funnel than someone browsing Twitter. They have a specific problem and are looking for a solution. Video tutorials also build trust faster than text -- viewers see the code actually working.

### Content Types

**Quick start (5-10 minutes) -- highest priority:**
> "Build a Product Tour in React in 5 Minutes"
>
> Zero preamble. Show the install command, the code, and the working tour. Every second of a 5-minute video must earn its place.

**Full tutorial (20-30 minutes):**
> "Tour-Kit Complete Tutorial: From Install to Production"
>
> Cover setup, basic tour, custom styling with shadcn/ui, keyboard navigation, multi-page tours, persistence. Use chapters.

**Comparison video (10-15 minutes):**
> "Tour-Kit vs React Joyride: Code, Bundle Size, and Accessibility Compared"
>
> Side-by-side code. Same tour built with both libraries. Measure bundle size. Test keyboard navigation. Be fair.

**Feature deep-dive (5-10 minutes):**
> "How to Add Onboarding Checklists to Your React App"
>
> Focus on a single feature. Show the problem, the solution, the code.

**Optional: dev streams.**
Building in public via live coding. Low production value is fine. The authenticity is the point.

### Production Quality

**Screen recording setup:**
- Increase VS Code font size to 18-20px minimum. Mobile viewers need to read the code.
- Use a clean VS Code theme (dark). Remove unnecessary panels, status bar clutter, and activity bar icons.
- Record at 1920x1080 minimum. 4K if your machine handles it.
- Full-screen VS Code. No visible desktop, dock, or notifications.
- Practice the recording 5-10 times before recording the final take. Resolve any typing or speaking issues during practice.

**Audio:**
- Voiceover is required. Screen recordings without narration have low retention.
- Use a decent USB microphone (Blue Yeti, Audio-Technica AT2020, or similar). Built-in laptop mics are not acceptable.
- No face cam required. Code-focused content works well without it.
- Record in a quiet room. Use noise reduction in post if needed.

**Editing:**
- Add chapters for videos longer than 10 minutes. YouTube shows chapter markers in the timeline.
- Add captions. Use Descript or YouTube's auto-caption editor. Captions improve accessibility and retention.
- Cut dead air, typing pauses, and mistakes. Respect the viewer's time.
- Use zoom effects on code when highlighting specific lines (tools like Focusee or manual keyframes).

**Recording tools:**
- OBS Studio (free, records screen + mic simultaneously)
- ScreenFlow (Mac, records + edits in one tool)
- Camtasia (cross-platform, YouTube export presets)

### SEO for YouTube

**Titles:** Include keywords people actually search for.
- "React Product Tour Tutorial (TypeScript + shadcn/ui)" -- not "Tour-Kit Overview"
- "How to Add Onboarding to Next.js" -- not "Our New Feature Demo"

**Descriptions:** First 2-3 lines appear in search results. Lead with what the viewer will learn.
```
Learn how to build accessible product tours in React using Tour-Kit.
We'll cover installation, step configuration, keyboard navigation, and custom styling with shadcn/ui.

Links:
- Tour-Kit docs: https://tour-kit.dev/docs
- GitHub repo: https://github.com/...
- Written tutorial: https://tour-kit.dev/blog/...

Chapters:
0:00 What we're building
0:45 Installation
2:00 First tour
...
```

**Thumbnails:** Code screenshot with a short text overlay (3-5 words). High contrast. Avoid clickbait faces. Example: a screenshot of a tour popover on a real UI with the text "React Tours in 5min."

### Cadence

| Frequency | Content Type |
|-----------|-------------|
| 1x at launch | Quick start video (5 min) |
| 1x per month | Tutorial or comparison video |
| On major releases | What's new in tour-kit vX.0 |

### Metrics

| Metric | 90-Day Target |
|--------|---------------|
| Subscribers | 200 |
| Views per video (avg) | 500 |
| Click-through rate | 5%+ |
| Average view duration | 60%+ of video length |

---

## LinkedIn Strategy

### Why LinkedIn

LinkedIn reaches the tertiary ICP: product managers, engineering managers, CTOs, and growth leads. These are the people who approve SaaS budget cuts and champion new tools internally. They do not hang out on r/reactjs. They do hang out on LinkedIn.

### Key Insight: Personal Profile Over Company Page

Personal profiles generate roughly 8x more engagement than company pages on LinkedIn. The tour-kit founder's personal account is the primary channel, not a `Tour-Kit` company page. Post as a person building something, not as a brand marketing something.

### Target Audience

- Engineering managers at Series A-C SaaS companies (50-500 employees)
- CTOs evaluating technical architecture decisions
- Product managers managing onboarding tool budgets
- Growth leads tracking activation and onboarding metrics

### Content Types

**Cost-saving case studies (highest value for this audience):**
> "We replaced our $4,800/year Appcues subscription with a $99 open-source library. Here's what changed."
>
> Walk through: what you were paying, what you switched to, what the migration effort looked like, what the outcome was. Include specific numbers. Product managers and finance people respond to numbers.

**Technical leadership posts:**
> "Why headless architecture is winning in the React ecosystem (and what it means for your product team)"
>
> Position tour-kit's architecture within a broader trend. Connect it to decisions engineering managers care about: maintainability, design system consistency, vendor independence.

**ROI and business impact posts:**
> "The math on build-vs-buy for product tours: 2-4 weeks of senior engineer time ($6,400-$24,000) vs $99 for a maintained library."
>
> Speak the language of the buyer. Engineering managers and PMs think in terms of engineer-weeks and cost savings.

**Video content (LinkedIn algorithm priority):**
LinkedIn's algorithm in 2026 heavily favors native video. Even a 60-second screen recording of a tour working in a real product -- with a voiceover explaining the business value -- will outperform a text post.

- 1-2 minute demo videos showing a tour in action
- 30-second "before and after" comparisons (SaaS tool overlay vs native tour-kit integration)
- Short clips repurposed from YouTube tutorials

### What to Avoid on LinkedIn

- Developer jargon without context. Your audience may not know what "headless hooks" means. Explain in business terms: "Your engineering team builds the UI, the library handles the logic."
- Posts that read like tweets. LinkedIn rewards longer-form posts (800-1,200 characters).
- Hard selling. LinkedIn penalizes posts with outbound links in the first comment. Lead with value, put the link in the first comment or at the end of the post.

### Cadence

| Frequency | Content Type |
|-----------|-------------|
| 1-2x per week | Text post (cost-saving insight, technical leadership, or business case) |
| 1x per week | Native video (demo clip, comparison, or explainer) |
| Ongoing | Comment on relevant DAP/onboarding/product-led growth discussions |

### Thought Leader Ads

LinkedIn's Thought Leader Ads let you promote content posted from a personal profile. Once the founder's profile has 5-10 strong posts, consider boosting the best-performing ones to reach engineering managers and product leads at target company sizes (50-500 employees). This is the most efficient paid channel for the tertiary ICP.

---

## Bluesky Strategy

### Current State

Bluesky grew from 13M to 40M+ users between October 2024 and November 2025, with over 400K monthly ATProto SDK downloads. The developer community is real and growing, and Bluesky is actively funding developer projects through AT Protocol Grants.

### Approach: Low Effort, Real Presence

Bluesky is a hedge, not a primary channel. The goal is to have a presence so that developers who left X (or use both) can find and follow tour-kit there.

**What to do:**
- Mirror all Twitter/X technical tips and threads to Bluesky
- Engage with the React and TypeScript developer communities on Bluesky
- Use Bluesky's custom feeds feature -- if a "React" or "TypeScript" feed exists, make sure your content appears in it by using relevant terms
- Follow and engage with React ecosystem developers who are active on Bluesky

**What not to do:**
- Create Bluesky-exclusive content (not worth the effort yet)
- Spend more than 15 minutes per day on Bluesky engagement
- Treat it as a primary growth channel

### Tools

Use a cross-posting tool to mirror X content to Bluesky automatically. Options:
- [Mixpost](https://mixpost.app) (open-source, self-hosted)
- [Postiz](https://postiz.com) (open-source, supports Bluesky natively)
- Manual copy-paste (acceptable given low volume)

---

## Content Calendar Template

### Weekly Planning

| Day | Platform | Content Type | Topic | Status |
|-----|----------|-------------|-------|--------|
| Mon | X | Technical tip | | Draft / Scheduled / Posted |
| Mon | Bluesky | Mirror X tip | | Auto / Posted |
| Tue | X | Build in public | | |
| Tue | LinkedIn | Cost-saving post | | |
| Wed | X | Community engagement (replies) | | |
| Wed | Reddit | Comment on 2-3 threads | | |
| Thu | X | Thread / article | | |
| Thu | Dev.to | Publish article | | |
| Fri | X | Technical tip | | |
| Fri | LinkedIn | Video demo or leadership post | | |

### Monthly Review

At the end of each month, review:

1. **What performed?** Top 3 posts by engagement, link clicks, and new followers per platform.
2. **What didn't?** Bottom 3 posts. Why? Wrong format, wrong timing, wrong topic?
3. **Funnel impact.** Did social traffic convert to GitHub stars, npm installs, or docs visits? Check UTM data.
4. **Community health.** Are we maintaining the 10:1 helpful-to-promotional ratio on Reddit? Are we responding to all replies on X?
5. **Adjust.** Double down on what works. Cut what doesn't. Update the content calendar for next month.

### Quarterly Content Themes

| Quarter | Theme | Content Focus |
|---------|-------|--------------|
| Q1 | Launch and awareness | "I built X" posts, Show HN, launch threads, getting-started tutorials |
| Q2 | Education and SEO | Tutorial series on Dev.to/Hashnode, YouTube videos, comparison articles |
| Q3 | Community and proof | User stories, case studies, "how [company] uses tour-kit" posts, contributor spotlights |
| Q4 | Expansion and Pro | Advanced feature tutorials (analytics, checklists, announcements), ROI content for PMs |

---

## Tools and Automation

### Scheduling

| Tool | Use Case | Cost |
|------|----------|------|
| [Typefully](https://typefully.com) | X/Twitter scheduling, thread drafting, analytics | Free tier available, Pro ~$12/mo |
| [Mixpost](https://mixpost.app) | Self-hosted, multi-platform scheduling (X, LinkedIn, Bluesky) | Free (open-source) |
| [Postiz](https://postiz.com) | Open-source, supports 15+ platforms including Reddit, Discord, Bluesky | Free (Apache 2.0) |
| LinkedIn native scheduler | LinkedIn posts | Free |

### Analytics

| Tool | What It Tracks |
|------|---------------|
| X/Twitter Analytics (native) | Impressions, engagement rate, follower growth, link clicks |
| LinkedIn Analytics (native) | Post views, engagement, follower demographics |
| Dev.to dashboard | Views, reactions, comments, reading time |
| Hashnode analytics | Views, reads, newsletter subscribers |
| YouTube Studio | Views, watch time, CTR, retention curves, subscriber growth |
| UTM parameters + site analytics | Cross-platform traffic attribution to docs/repo |

**UTM convention:** All social links should use consistent UTM parameters.

```
?utm_source=[platform]&utm_medium=social&utm_campaign=[content-type]

Examples:
?utm_source=twitter&utm_medium=social&utm_campaign=tip
?utm_source=reddit&utm_medium=social&utm_campaign=launch
?utm_source=devto&utm_medium=social&utm_campaign=tutorial
?utm_source=linkedin&utm_medium=social&utm_campaign=case-study
?utm_source=youtube&utm_medium=social&utm_campaign=tutorial
```

### Code Screenshot Tools

| Tool | Use Case |
|------|----------|
| [ray.so](https://ray.so) | Polished code screenshots with syntax highlighting. Dark theme, padding, custom colors. Best for X/Twitter. |
| [carbon.sh](https://carbon.sh) | Similar to ray.so. More theme options. Good for longer snippets. |
| [snappify.com](https://snappify.com) | Code screenshots with annotations, animations, and slide decks. Good for multi-step explanations. |

**Settings for all tools:** Dark theme, font size 16px+, TypeScript/TSX language, minimal padding, no window controls.

### GIF and Demo Recording

| Tool | Use Case |
|------|----------|
| [Kap](https://getkap.co) | Mac-only, open-source GIF/MP4 screen recorder. Clean, simple. |
| [ScreenToGif](https://www.screentogif.com) | Windows, open-source, records and edits GIFs with frame-by-frame control. |
| [LICEcap](https://www.cockos.com/licecap/) | Cross-platform, lightweight GIF capture. |
| OBS Studio | Full-featured recording for YouTube content. Free, cross-platform. |

**GIF best practices:**
- Keep GIFs under 15 seconds and under 5MB for X/Twitter embeds
- Show the tour working in a real-looking UI, not a blank page
- Start the GIF with the trigger action (clicking a button, loading a page) so the viewer sees cause and effect
- Loop cleanly -- the last frame should transition naturally to the first

---

## Cross-Platform Content Repurposing

One piece of content should feed multiple platforms. Here is the repurposing chain:

```
Blog post (canonical)
  |
  +-- Dev.to cross-post (with canonical URL)
  +-- Hashnode cross-post (with canonical URL)
  +-- X/Twitter thread (condensed key points + link)
  +-- Bluesky mirror (same as X thread)
  +-- LinkedIn post (reframed for business audience)
  +-- YouTube video (tutorial version of the same content)
  +-- Reddit comment (link the article when someone asks a relevant question)
```

**Example chain for a comparison article:**

1. Write "Tour-Kit vs React Joyride: A Technical Comparison" on the tour-kit blog
2. Cross-post to Dev.to with canonical URL, tagged `#react #typescript #webdev #opensource`
3. Cross-post to Hashnode with canonical URL
4. Post a 5-tweet thread on X summarizing the key differences, with a code screenshot and link to the full article
5. Mirror the thread to Bluesky
6. Write a LinkedIn post reframing the comparison for product managers: "Why your engineering team might prefer an open-source tour library over your current $300/mo SaaS tool"
7. Record a 10-minute YouTube video showing both libraries side by side
8. Save the Reddit link for the next time someone asks "React Joyride vs alternatives?" on r/reactjs

---

## Measurement Framework

### North Star Metric

**GitHub stars + npm weekly downloads.** Social media is a means to an end. Every platform should ultimately drive traffic to the GitHub repo or docs site, which converts to stars and installs.

### Platform-Specific KPIs

| Platform | Primary KPI | Secondary KPI | Tracking |
|----------|------------|---------------|----------|
| X/Twitter | Link clicks to docs/repo | Follower growth, engagement rate | X Analytics + UTM |
| Reddit | Upvotes + comment engagement on posts | Referral traffic from Reddit | UTM + site analytics |
| Dev.to | Article views + reactions | Google ranking position for target keywords | Dev.to dashboard + Search Console |
| Hashnode | Article reads + newsletter subscribers | Google ranking position | Hashnode analytics + Search Console |
| YouTube | Views + avg. watch duration | Subscriber growth, link clicks in descriptions | YouTube Studio |
| LinkedIn | Post impressions + engagement | Profile views from target audience (PM/EM titles) | LinkedIn Analytics |
| Bluesky | Follower count | Engagement rate | Native analytics |

### Monthly Reporting

Track these numbers at the end of each month:

```
Social Traffic Summary - [Month Year]
--------------------------------------
Total social referral visits to docs:     ___
Total social referral visits to GitHub:   ___

By platform:
  X/Twitter:    ___ visits, ___ new followers, ___ link clicks
  Reddit:       ___ visits, ___ upvotes received
  Dev.to:       ___ article views, ___ reactions
  Hashnode:     ___ article reads
  YouTube:      ___ views, ___ subscribers, ___ click-throughs
  LinkedIn:     ___ impressions, ___ profile views
  Bluesky:      ___ followers

Conversion:
  New GitHub stars this month:   ___
  npm installs this month:       ___
  Pro purchases attributed:      ___
```

---

## Quick Reference: What to Post Where

| Content | X | Reddit | Dev.to | YouTube | LinkedIn | Bluesky |
|---------|---|--------|--------|---------|----------|---------|
| Code snippet tip | Yes | Comment only | No | No | No | Mirror |
| Tutorial | Thread + link | Post if valuable standalone | Full article | Full video | No | Mirror |
| Launch announcement | Thread | r/SideProject, r/reactjs | Article | Quick start video | Post (business angle) | Mirror |
| Comparison | Thread + link | Comment when asked | Full article | Full video | Post (cost angle) | Mirror |
| Build-in-public update | Post | No | No | Optional stream | No | Mirror |
| Case study | Thread | Post if genuine | Full article | No | Full post | Mirror |
| Cost-saving story | Thread | r/SaaS, r/reactjs | Article | No | Full post | Mirror |
| Release notes | Thread | No | Article | Video if major | Post if business-relevant | Mirror |
