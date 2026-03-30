# Paid Channels & Sponsorships

> Budget is limited. Every dollar must reach the right developer at the right moment. This document prioritizes paid channels by expected ROI for a React-focused, developer-first open-source library with a $99 one-time Pro tier.

---

## Budget Philosophy

### Constraints

Tour-kit is a bootstrapped open-source project with a $99 one-time price point. This means:

1. **No recurring SaaS revenue to fund ongoing ad spend.** Every dollar spent on marketing must generate enough Pro license sales to be self-sustaining.
2. **Customer acquisition cost (CAC) must stay below $25.** At $99/license, a $25 CAC gives a 4x return. Anything above $50 CAC is unsustainable.
3. **Organic channels should carry 80%+ of growth.** Paid channels are accelerants, not foundations. If the organic content strategy (doc 06) and community plan (doc 08) aren't working, paid channels won't fix it.
4. **Developer trust is the scarcest resource.** A sponsorship that feels like advertising erodes credibility. Every paid placement must deliver genuine value to the audience.

### Budget Allocation

Recommended monthly budget for the first 6 months:

| Category | Monthly Budget | % of Total | Notes |
|----------|---------------|-----------|-------|
| Newsletter sponsorships | $400-800 | 40-50% | Highest ROI channel |
| YouTube creator partnerships | $200-500 | 20-30% | Evergreen content |
| Conference sponsorships | $0-300 | 0-20% | Opportunistic, not regular |
| Paid social (Twitter/X promoted) | $100-200 | 10-15% | Testing and amplification |
| Reserve / experiments | $100-200 | 10-15% | Try new channels |
| **Total** | **$800-2,000/mo** | 100% | Adjust based on Pro license revenue |

**Scale rule:** Increase paid spend only when CAC is demonstrably below $25 and organic channels are healthy. Don't pour money into paid channels to compensate for weak fundamentals.

---

## Tier 1: Newsletter Sponsorships

Newsletter sponsorships are the highest-ROI paid channel for reaching React developers. The audience is curated, engaged, and actively looking for new tools.

### Priority Newsletters

#### This Week in React

| Detail | Info |
|--------|------|
| **Subscribers** | ~40,000 |
| **Audience** | React and React Native developers, heavily weighted toward senior engineers |
| **Frequency** | Weekly (Wednesdays) |
| **Sponsorship cost** | ~€400/issue (~$430 USD) |
| **Format** | Short sponsor block: 2-3 sentences + link. Appears near the top of each issue. |
| **Why #1 priority** | This is THE newsletter for the React ecosystem. Sebastien Lorber (curator) has high credibility. A mention here reaches the exact audience that evaluates and adopts React libraries. |
| **Expected results** | 200-500 clicks per sponsorship. At 2-5% conversion to npm install, that's 4-25 new users per issue. |
| **ROI calculation** | At $430/issue, need 5 Pro conversions to break even. Realistic over 30 days if the landing page converts well. |

**Recommended copy:**
```
Tour-Kit — Headless product tours for React. Hooks-based, accessible
(WCAG 2.1 AA), TypeScript-strict. Works natively with shadcn/ui.
Free core (MIT) + extended packages for $99 once. No subscriptions.
→ [docs link]
```

**Booking strategy:**
- Book 2 issues in the first month (one launch week, one 2 weeks later)
- Measure click-through rate and downstream conversions
- If ROI is positive, book monthly for 3-6 months
- Rotate copy every 2-3 issues to avoid fatigue

---

#### Bytes (by ui.dev)

| Detail | Info |
|--------|------|
| **Subscribers** | 200,000+ |
| **Audience** | JavaScript developers, broader than React-only |
| **Frequency** | Twice weekly (Monday, Thursday) |
| **Sponsorship cost** | ~$2,000-3,000/issue |
| **Format** | Witty, conversational. The sponsor section matches the newsletter's irreverent tone. |
| **Why considered** | Massive reach. Even a 0.5% click-through rate = 1,000 visitors. |
| **Why not Tier 1** | Expensive for our budget. Broader audience means lower conversion rate for a React-specific library. Better as a one-time "launch splash" than ongoing. |

**Recommendation:** Book 1 issue during launch week if budget allows. Monitor ROI carefully. The audience is large but less targeted than This Week in React.

---

#### React Status (by Cooperpress)

| Detail | Info |
|--------|------|
| **Subscribers** | ~25,000 |
| **Audience** | React developers |
| **Frequency** | Weekly |
| **Sponsorship cost** | ~$600-800/issue |
| **Format** | Clean, editorial. Sponsor block is clearly labeled but well-integrated. |
| **Why considered** | Focused React audience. Lower cost than Bytes, more targeted. |

**Recommendation:** Book 1-2 issues in month 2 after measuring This Week in React results. Good for sustaining visibility after the launch spike fades.

---

#### JavaScript Weekly (by Cooperpress)

| Detail | Info |
|--------|------|
| **Subscribers** | ~180,000 |
| **Audience** | Broad JavaScript ecosystem |
| **Frequency** | Weekly (Fridays) |
| **Sponsorship cost** | ~$1,200-1,500/issue |
| **Format** | Similar to React Status but wider audience. |
| **Why considered** | Massive reach in the JS ecosystem. |

**Recommendation:** Save for a major milestone (v1.0 release, 5K stars). The audience is too broad for early-stage targeting.

---

#### Other Newsletters to Monitor

| Newsletter | Subscribers (est.) | Cost (est.) | Notes |
|-----------|-------------------|-------------|-------|
| **TLDR Web Dev** | 100K+ | $500-1,000 | Growing fast, developer audience |
| **Frontend Focus** (Cooperpress) | 70K+ | $800-1,000 | Broader frontend, not React-specific |
| **Smashing Magazine Newsletter** | 250K+ | $1,500+ | Design + dev audience, expensive |
| **Lenny's Newsletter** | 700K+ | $5,000+ | Product managers. Way too expensive now, revisit at scale. |

---

### Newsletter Sponsorship Best Practices

1. **Match the newsletter's tone.** This Week in React is technical and factual. Bytes is witty and informal. Don't send the same copy to both.
2. **Include a specific, actionable link.** Not the homepage — link to the getting-started guide or an interactive demo.
3. **Lead with the value, not the product name.** "Headless product tours for React" tells me what I get. "Introducing Tour-Kit v1.0" tells me nothing.
4. **Track everything.** Use UTM parameters on every link: `?utm_source=thisweekinreact&utm_medium=newsletter&utm_campaign=launch`
5. **Don't sponsor the same newsletter 4 weeks in a row.** 2 on, 2 off. Readers tune out repeat sponsors.
6. **Ask about editorial mentions.** Some newsletters will mention you in the editorial section (not as a sponsor) if the library is genuinely interesting. A mention in the editorial section converts better than a sponsor block because it carries the curator's implicit endorsement.

---

## Tier 2: YouTube Creator Partnerships

YouTube tutorials are evergreen. A well-made "Build a Product Tour with Tour-Kit" video drives traffic for 2-3 years.

### Target Creators

#### Tier A: High-Impact Creators (100K+ subscribers)

| Creator | Subscribers | Why |
|---------|-----------|-----|
| **Theo (t3.gg / Ping)** | 500K+ | Covers React ecosystem tools. Opinionated, technical, trusted. A mention from Theo can drive 10K+ GitHub stars. |
| **Jack Herrington** | 250K+ | Deep React tutorials. His audience is senior React developers — our Primary ICP. |
| **Web Dev Simplified (Kyle)** | 1.5M+ | Broader audience but massive reach. Good for awareness. |
| **Fireship (Jeff Delaney)** | 2.5M+ | "100 seconds of X" format. Extremely high reach but less conversion. |
| **Lee Robinson (Vercel)** | 100K+ | Next.js focus. A tour-kit tutorial from Lee would be the ultimate endorsement for our Next.js integration. |

**Approach:** Don't pay for sponsored videos upfront. Instead:
1. Send a personalized message explaining what tour-kit does and why their audience would care
2. Offer a free Pro license and early access to upcoming features
3. Provide a pre-built demo project they can use (reduces their prep work)
4. Let them decide if it's worth covering. Forced integrations feel inauthentic.
5. If they're interested, offer to sponsor the video ($500-2,000 depending on the creator)

#### Tier B: Mid-Range Creators (20K-100K subscribers)

| Creator | Subscribers | Why |
|---------|-----------|-----|
| **Colby Fayock** | 60K+ | Practical React tutorials, maps/tools focus |
| **Dave Gray** | 250K+ | Tutorial-focused, accessible to intermediate devs |
| **Josh tried coding** | 200K+ | React/Next.js focused with good engagement |
| **Cosden Solutions** | 50K+ | React deep dives, TypeScript content |

**Approach:** These creators are more accessible and often more willing to try new tools.
1. Reach out with a concise pitch (3-4 sentences)
2. Offer a free Pro license
3. Provide a "tour-kit in 5 minutes" script/outline they can adapt
4. Sponsorship budget: $200-500 per video

#### Tier C: Growing Creators (5K-20K subscribers)

Smaller creators are often the best ROI:
- They're hungry for content ideas and sponsorships
- Their audience is more engaged (higher click-through rate)
- They're cheaper ($100-300 per video)
- They appreciate the partnership and become genuine advocates

**Strategy:** Identify 5-10 growing React/Next.js YouTubers and offer:
- Free Pro license
- Co-developed tutorial outline
- $100-200 sponsorship per video
- Cross-promotion on tour-kit's channels

### YouTube Partnership Best Practices

1. **Never ask for a scripted review.** Provide the tool, a demo, and talking points. Let the creator form their own opinion.
2. **Provide a ready-to-clone demo repo.** Reduce their setup time to zero. Include a `README` with "record from here" instructions.
3. **Ask for a permanent link in the video description.** The description link drives traffic long after the video stops trending.
4. **Track with UTM:** `?utm_source=youtube&utm_medium=video&utm_campaign=[creator-name]`
5. **Measure:** Unique visitors from YouTube → npm installs → Pro conversions. YouTube videos have a long tail — measure over 90 days, not 7.

---

## Tier 3: Conference Sponsorships

Conference sponsorships are expensive per-attendee but create face-to-face connections that build lasting relationships. For a library at tour-kit's stage, be selective.

### Conferences to Target

#### React-Specific Conferences

| Conference | Location | Typical Cost (Sponsor) | Attendees | Priority |
|-----------|----------|----------------------|-----------|----------|
| **React Summit** | Amsterdam + Remote | $2,000-5,000 | 1,500+ in person, 30K+ remote | High (when budget allows) |
| **React Conf** | Various | Varies | 1,000+ | High (if accepting sponsors) |
| **React Advanced** | London | $1,500-3,000 | 500-800 | Medium |
| **React Day Berlin** | Berlin | $1,000-2,500 | 400-600 | Medium |
| **RemixConf / React Router Conf** | Various | $1,000-2,000 | 300-500 | Low (less aligned) |

#### Broader Frontend Conferences

| Conference | Location | Typical Cost (Sponsor) | Attendees | Priority |
|-----------|----------|----------------------|-----------|----------|
| **Next.js Conf** | Online (Vercel) | Varies | 50K+ remote | High (free if accepted as community partner) |
| **ViteConf** | Online | Low/Free | 20K+ remote | Low-Medium |
| **CityJS conferences** | London, Athens, etc. | $500-1,500 | 200-400 | Low-Medium (good value) |

### Conference Strategy: Talks Over Booths

**For a library at this stage, speaking is 10x more valuable than a booth.**

A conference booth costs $2,000-5,000 and gets you 100 brief conversations. A conference talk costs $0 (speakers are usually free) and gets you 30 minutes of undivided attention from 200-1,000 developers, plus a recording that lives on YouTube forever.

**Talk submission strategy:**

| Talk Title | Angle | Target Conference |
|-----------|-------|-------------------|
| "Headless UI Patterns for Onboarding" | Architecture talk. Mentions tour-kit but is genuinely useful even without it. | React Summit, React Advanced |
| "Building WCAG 2.1 AA Compliant Overlays in React" | Accessibility talk. Tour-kit is the case study. | Any React/frontend conference |
| "The $300/Month Tooltip: Why We Open-Sourced Our Onboarding Stack" | Business/OSS talk. Story-driven, resonates with indie and OSS audiences. | React Summit, CityJS, conference "non-technical" tracks |
| "From 0 to 2,000 Stars: Launching an Open-Source React Library" | Launch retrospective. Practical advice, not self-congratulation. | Indie-focused conferences, React meetups |

**CFP timeline:** Most conferences accept CFPs 3-6 months before the event. Submit to 5-10 conferences per cycle. Expect a 10-20% acceptance rate.

### Meetup Sponsorships (Low-Cost, High-ROI)

Local React meetups are undervalued:
- Sponsorship costs $100-300 (usually just pizza and drinks)
- 20-50 attendees who are actively building React apps
- You can give a 10-minute lightning talk
- Attendees are more likely to try a tool recommended at a meetup than at a conference

**Target meetups:**
- React meetups in major tech hubs (SF, NYC, London, Berlin, Amsterdam, Paris)
- Next.js meetups
- shadcn/ui community events (if they exist)

**Budget:** $100-300/month for 1-2 meetup sponsorships.

---

## Tier 4: Paid Social (Twitter/X Promoted Posts)

Paid social has the lowest ROI of any channel for developer tools, but can be useful for amplification during key moments.

### When to Use Paid Social

| Moment | Budget | Goal |
|--------|--------|------|
| Launch day | $100-200 | Amplify the launch thread to reach beyond your follower count |
| Major milestone (1K stars, v1.0) | $50-100 | Boost a celebratory post |
| New tutorial published | $50 | Test if the tutorial resonates with a broader audience |
| Comparison page published | $50-100 | Target followers of competitor accounts |

### Twitter/X Promoted Posts Best Practices

1. **Only promote organic winners.** If a tweet got good engagement organically, amplify it. Don't promote content that flopped — paid reach won't fix bad content.
2. **Target narrowly.** Interest targeting: React, Next.js, TypeScript, shadcn/ui, JavaScript, web development. Follower targeting: @shadcn, @dan_abramov, @leaborstein, @t3dotgg.
3. **Budget caps.** Never spend more than $50/day on a single promoted post. Set a campaign limit.
4. **Measure clicks, not impressions.** Impressions are vanity. Track click-through → docs visit → npm install.
5. **Avoid promoted posts that look like ads.** Developer audiences scroll past anything that feels promotional. Promote technical tips, code snippets, and demo GIFs — not "Buy tour-kit Pro!"

### Budget

$100-200/month. This is a testing budget, not a growth channel. If a specific promotion proves ROI > 3x, scale it up cautiously.

---

## Tracking & Attribution

### UTM Parameter Convention

Every paid link uses this UTM structure:

```
?utm_source=[platform]&utm_medium=[format]&utm_campaign=[campaign-name]
```

| Channel | utm_source | utm_medium | utm_campaign example |
|---------|-----------|-----------|---------------------|
| This Week in React | `thisweekinreact` | `newsletter` | `launch-2026-q2` |
| Bytes | `bytes` | `newsletter` | `launch-2026-q2` |
| React Status | `reactstatus` | `newsletter` | `month2-sustained` |
| YouTube (Theo) | `youtube` | `video` | `theo-tutorial-june` |
| YouTube (Jack H) | `youtube` | `video` | `jackherrington-review` |
| Twitter promoted | `twitter` | `promoted` | `launch-thread-boost` |
| Conference | `reactsummit` | `conference` | `2026-booth` |

### Attribution Model

```
Source → Docs Visit → npm Install → GitHub Star → Pro Purchase

Track:
1. Source: UTM parameters on docs site (Vercel Analytics)
2. Docs engagement: Page views, time on site, scroll depth
3. Conversion proxies: Getting-started page views, API reference views
4. Pro purchase: Stripe checkout with utm_source metadata

Attribution window: 30 days from first touch
```

### Monthly Paid Channel Report

Track these metrics monthly for every paid channel:

| Metric | How to Measure |
|--------|---------------|
| Spend | Invoice/receipt |
| Clicks | UTM tracking in Vercel Analytics |
| Cost per click (CPC) | Spend / clicks |
| Docs visitors from channel | UTM filtered analytics |
| Getting-started page views | Funnel tracking |
| Estimated npm installs | Correlation (imprecise but directional) |
| Pro license purchases attributed | Stripe utm metadata |
| Customer acquisition cost (CAC) | Spend / Pro purchases within 30-day window |
| Return on ad spend (ROAS) | (Pro purchases × $99) / spend |

### Decision Framework

| CAC Result | Action |
|-----------|--------|
| < $15 | Scale up spend on this channel |
| $15-25 | Maintain current spend, optimize copy/targeting |
| $25-50 | Reduce spend, test alternative copy/placement |
| > $50 | Pause this channel, reallocate budget |

---

## Channel Experimentation Roadmap

### Month 1: Foundation

| Action | Budget |
|--------|--------|
| This Week in React: 2 sponsored issues | $860 |
| Twitter promoted: launch thread + 1 tutorial | $150 |
| **Total** | **$1,010** |

### Month 2: Expand & Measure

| Action | Budget |
|--------|--------|
| This Week in React: 1 sponsored issue | $430 |
| React Status: 1 sponsored issue | $700 |
| YouTube Tier C creator: 1 sponsored tutorial | $200 |
| Twitter promoted: 2 posts | $100 |
| **Total** | **$1,430** |

### Month 3: Optimize

| Action | Budget |
|--------|--------|
| Best-performing newsletter: 2 issues | $860-1,400 |
| YouTube Tier B creator: 1 partnership | $400 |
| Local meetup sponsorship: 1 event | $200 |
| Twitter promoted: best-performing content | $100 |
| **Total** | **$1,560-2,100** |

### Months 4-6: Scale Winners, Cut Losers

By month 4, you have 3 months of data. The channel report tells you:
- Which newsletter converts best per dollar
- Whether YouTube partnerships have a positive 90-day ROI
- Whether paid social is worth continuing at all

**Rules:**
- Double down on any channel with CAC < $15
- Maintain channels with CAC $15-25 and test optimizations
- Cut channels with CAC > $50 after 2 months of data
- Reallocate savings to the best-performing channels
- Start testing new channels with the reserve budget (Tier C YouTubers, niche newsletters, podcast sponsorships)

---

## Channels We're NOT Pursuing (And Why)

| Channel | Why Not |
|---------|---------|
| **Google Ads (search)** | CPCs for "product tour library" are low (~$1-3) but conversion intent is weak from ads. Developers trust organic results over ads. Our SEO strategy (doc 06) will capture this traffic without paying per click. |
| **Facebook/Instagram Ads** | Wrong audience. React developers don't discover libraries on Facebook. |
| **LinkedIn Ads** | Extremely expensive ($5-15 CPC). Good for enterprise SaaS, wrong for a $99 dev tool. |
| **Podcast ads (general tech)** | Too broad and too expensive ($1,000-5,000/episode). Revisit when revenue supports it. |
| **Banner ads on dev sites** | Low click-through rates (< 0.1%). Most developers use ad blockers. |
| **Affiliate programs** | Creates wrong incentives. Developers recommending tour-kit should do it because they genuinely like it, not for a $10 commission. |
| **Print/event swag** | Stickers and t-shirts are nice but don't drive measurable acquisition. Save for when there's a community that would wear the merch with pride. |

---

## Sponsorship Relationship Management

### How to Approach Newsletter Curators

**Email template for This Week in React:**

```
Subject: Sponsorship inquiry for tour-kit (React onboarding library)

Hi Sebastien,

I'm [name], building tour-kit — a headless React library for product
tours and onboarding. TypeScript strict, WCAG 2.1 AA accessible,
works natively with shadcn/ui. Free core (MIT) + Pro packages ($99
one-time).

We'd love to sponsor 2 issues in [month]. Happy to write copy that
matches your newsletter's tone, or you can write it if you prefer.

Docs: [link]
GitHub: [link]
Demo: [link]

Is your sponsorship calendar open for [dates]?

Best,
[name]
```

### How to Approach YouTube Creators

**DM/email template:**

```
Subject: Tour-kit — possible video collab?

Hey [name],

Big fan of your [specific recent video title] — especially the part
about [specific detail that shows you actually watched it].

I'm building tour-kit, a headless React library for product tours.
Hooks-based, TypeScript-strict, works with shadcn/ui. Thought it
might make a good tutorial or review for your channel.

I've got a demo repo ready to clone that shows it working in a
Next.js app: [link]

Happy to provide a free Pro license and cover a sponsorship fee
if you're interested. No pressure either way.

[name]
```

**Rules:**
- Personalize every outreach. Reference a specific video they made.
- Don't send mass emails. Quality over quantity.
- Accept "no" gracefully. Don't follow up more than once.
- If they cover tour-kit, thank them publicly on Twitter.

---

## Summary: Paid Channels Priority Stack

```
1. This Week in React newsletter     — Highest ROI, start here
2. React Status newsletter           — Second-best newsletter option
3. YouTube Tier C creators           — Low cost, high engagement
4. YouTube Tier B creators           — Medium cost, good reach
5. Local meetup sponsorships         — Cheap, personal connections
6. Twitter/X promoted posts          — Amplification only
7. Conference talks (free)           — High value, submit CFPs now
8. Conference booths (paid)          — Defer until revenue supports it
9. YouTube Tier A creators           — Aspirational, pursue relationship now
10. Bytes / JS Weekly newsletters    — One-time launch splash only
```

Invest in the top 3-4 channels for the first 3 months. Expand only when data proves ROI. Cut anything with CAC > $50. Every dollar must earn its place.
