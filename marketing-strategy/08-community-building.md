# Community Building Plan

> Community IS the marketing for developer tools. shadcn/ui grew entirely through grassroots community -- no ads, no paid campaigns. Supabase built a contributor ecosystem that markets itself. Tour-kit's community strategy follows the same playbook: earn trust through genuine helpfulness, then let the community amplify the message.

---

## Community Strategy Overview

Community building for tour-kit follows a phased approach tied to real adoption milestones. Each phase unlocks new channels and programs only when there's enough momentum to sustain them. Launching infrastructure too early (a dead Discord, an empty forum) signals abandonment and actively harms perception.

### Phase 1: GitHub-Only, Lean Engagement (0-500 Stars)

**Timeline:** Pre-launch through first 4-8 weeks post-launch.

**Philosophy:** Keep everything on GitHub. One platform, one notification stream, one place to check. The maintainer (you) is the entire community team. Every interaction is high-touch and personal.

**What to do:**
- Respond to every issue within 24 hours
- Respond to every Discussion thread within 24 hours
- Review every PR within 48 hours (even if just an acknowledgment)
- Personally thank every contributor, star-giver who engages, and person who mentions tour-kit anywhere
- Maintain 5-10 "good first issue" items at all times
- Write a CONTRIBUTING.md that makes first contributions feel safe
- Engage in external communities (r/reactjs, Reactiflux, Twitter/X) as a helpful community member, not a promoter

**What NOT to do:**
- Do not launch Discord yet (a server with 12 members and no activity is worse than no server)
- Do not create a Slack workspace
- Do not start a newsletter community
- Do not appoint moderators or community managers
- Do not create elaborate contributor tiers or programs

**Success criteria to advance:** 500+ GitHub stars AND 3+ new Discussion threads per week AND 2+ external mentions per week (Reddit, Twitter, blog posts).

### Phase 2: Add Discord, Structured Discussions (500-2,000 Stars)

**Timeline:** Typically 2-6 months post-launch.

**Philosophy:** The community is now large enough that GitHub-only creates friction. People want real-time help, casual conversation, and a sense of belonging. Discord provides that. But it must feel alive from day one -- seed it before opening it.

**What to do:**
- Launch Discord server (details below)
- Structure GitHub Discussions into formal categories with templates
- Establish a contributor recognition program (lightweight)
- Begin weekly engagement rituals (What are you building? thread)
- Invite the 10-20 most active community members to Discord early (seed the server)
- Create a "Community" section in the docs site linking to all channels
- Start spotlighting contributors in changelogs and on social media

**What NOT to do:**
- Do not hire a community manager yet (the maintainer + 1-2 active community members can handle this)
- Do not create paid community tiers
- Do not gate any content behind Discord membership

**Success criteria to advance:** 2,000+ GitHub stars AND 100+ Discord members with 20+ weekly active AND 5+ contributors with 2+ merged PRs each.

### Phase 3: Community Champions, Contributor Program, Meetups (2,000+ Stars)

**Timeline:** Typically 6-18 months post-launch.

**Philosophy:** The community is self-sustaining enough that it generates its own content, answers its own questions, and advocates without prompting. Formalize what's already happening organically. Invest in the people who've earned trust.

**What to do:**
- Launch formal Community Champions program
- Grant merge rights to trusted contributors on specific packages
- Host monthly community calls (optional, only if demand exists)
- Support community-organized meetups and conference talks
- Create a Contributors page on the docs site
- Establish governance documentation (decision-making process, RFC process)
- Consider sponsoring community members to speak at conferences
- Build an "Awesome Tour-Kit" ecosystem list

**What NOT to do:**
- Do not over-formalize and kill the organic culture
- Do not create bureaucratic processes that slow down contribution
- Do not lose the personal touch -- the maintainer should still be visibly present

---

## GitHub as Community Hub

GitHub is the primary community platform for the foreseeable future. Every developer already has an account, notifications are built in, and the proximity to code reduces friction between "talking about contributing" and "actually contributing."

### GitHub Discussions Setup

Enable GitHub Discussions on the tour-kit repository with the following category structure:

| Category | Type | Purpose | Template |
|----------|------|---------|----------|
| **Q&A** | Question/Answer | Technical help, "how do I...?" questions, debugging | Require: tour-kit version, React version, reproduction steps or code snippet |
| **Ideas** | Open-ended | Feature requests, API design proposals, "wouldn't it be cool if..." | Require: problem description, proposed solution, alternatives considered |
| **Show & Tell** | Open-ended | Share what you've built with tour-kit, demos, screenshots, blog posts | No template -- keep it low-friction |
| **General** | Open-ended | Announcements, meta-discussion, community updates | No template |
| **RFC** | Open-ended | Formal proposals for significant changes (new packages, API breaks, architecture) | Require: motivation, detailed design, drawbacks, alternatives, migration path |

**Response SLA:**
- Q&A: First response within 24 hours. Resolution or workaround within 72 hours.
- Ideas: Acknowledgment within 48 hours. Triage decision (will consider / won't do / needs RFC) within 1 week.
- Show & Tell: React with emoji within 24 hours. Comment if genuinely interesting.
- RFC: Detailed response within 1 week. Community feedback period of 2 weeks before decision.

**Moderation rules:**
- Pin important announcements and active RFCs
- Close resolved Q&A threads (mark the answer)
- Transfer misplaced issues to the correct category
- Lock threads that devolve into unproductive arguments (rare, but have the mechanism ready)

### Issue Management

#### Issue Templates

Create three issue templates in `.github/ISSUE_TEMPLATE/`:

**1. Bug Report (`bug_report.yml`)**
```yaml
name: Bug Report
description: Something isn't working as expected
labels: ["bug", "needs-triage"]
body:
  - type: textarea
    id: description
    attributes:
      label: What happened?
      description: A clear description of the bug
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to reproduce
      description: Minimal steps or a link to a reproduction repo
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
      description: What you expected to happen
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: Tour-kit version
    validations:
      required: true
  - type: input
    id: react-version
    attributes:
      label: React version
    validations:
      required: true
  - type: dropdown
    id: package
    attributes:
      label: Which package?
      options:
        - "@tour-kit/core"
        - "@tour-kit/react"
        - "@tour-kit/hints"
        - "@tour-kit/adoption"
        - "@tour-kit/analytics"
        - "@tour-kit/announcements"
        - "@tour-kit/checklists"
        - "@tour-kit/media"
        - "@tour-kit/scheduling"
    validations:
      required: true
```

**2. Feature Request (`feature_request.yml`)**
```yaml
name: Feature Request
description: Suggest a new feature or enhancement
labels: ["enhancement", "needs-triage"]
body:
  - type: textarea
    id: problem
    attributes:
      label: What problem does this solve?
      description: Describe the use case or pain point
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Proposed solution
      description: How you'd like this to work (API examples welcome)
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
      description: Other approaches you've thought about
    validations:
      required: false
```

**3. Documentation (`documentation.yml`)**
```yaml
name: Documentation Issue
description: Report unclear, missing, or incorrect documentation
labels: ["documentation"]
body:
  - type: input
    id: page
    attributes:
      label: Which page or section?
      description: URL or path to the documentation in question
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: What's wrong or missing?
    validations:
      required: true
```

#### Label Taxonomy

| Label | Color | Purpose |
|-------|-------|---------|
| `bug` | `#d73a4a` | Confirmed bugs |
| `enhancement` | `#a2eeef` | New features or improvements |
| `documentation` | `#0075ca` | Documentation improvements |
| `good first issue` | `#7057ff` | Suitable for first-time contributors |
| `help wanted` | `#008672` | Maintainer would appreciate community help |
| `needs-triage` | `#fbca04` | Awaiting maintainer review |
| `wontfix` | `#ffffff` | Declined after consideration |
| `duplicate` | `#cfd3d7` | Duplicate of existing issue |
| `package:core` | `#1d76db` | Related to @tour-kit/core |
| `package:react` | `#1d76db` | Related to @tour-kit/react |
| `package:hints` | `#1d76db` | Related to @tour-kit/hints |
| `package:pro` | `#b60205` | Related to Pro-tier packages |
| `breaking` | `#e11d48` | Would require a breaking change |
| `performance` | `#f9d0c4` | Performance-related |
| `accessibility` | `#0e8a16` | Accessibility-related |

#### "Good First Issue" Strategy

Maintaining a healthy pipeline of good first issues is one of the highest-leverage community activities. Research shows that projects with ~25% of issues tagged as "good first issue" see 13% more new contributors (GitHub State of the Octoverse).

**Rules:**
- Always maintain 5-10 open "good first issue" items
- Each good first issue MUST include:
  - Clear description of what needs to change
  - Which file(s) to look at
  - Link to relevant documentation or code
  - Expected outcome (what "done" looks like)
  - Estimated difficulty (15 min, 1 hour, half day)
- Replenish good first issues weekly as they get claimed
- Categories that work well for first issues:
  - Documentation fixes (typos, unclear explanations, missing examples)
  - Adding unit tests for uncovered edge cases
  - Improving TypeScript types (stricter generics, better inference)
  - Adding JSDoc comments to public APIs
  - Small accessibility improvements (ARIA labels, keyboard handling edge cases)
  - Updating examples or adding new example configurations

**What makes a BAD good first issue:**
- Requires deep understanding of the positioning engine or step sequencing
- Touches multiple packages simultaneously
- Has unclear scope or definition of done
- Is actually a complex feature disguised as a small task

#### Stale Issue Policy

Use the [actions/stale](https://github.com/actions/stale) GitHub Action:

- Issues with no activity for 60 days get a "stale" label and a polite comment asking if it's still relevant
- Issues with no response for 14 days after the stale label get closed automatically
- Issues labeled `good first issue`, `help wanted`, or `enhancement` are exempt from stale bot
- PRs with no activity for 30 days get a stale warning
- The stale message should be warm, not bureaucratic: "Hey! This issue has been quiet for a while. Is this still relevant? If so, feel free to reopen or comment. We close stale issues to keep the tracker manageable, not because we don't care."

#### Declining Feature Requests Gracefully

Not every feature request belongs in tour-kit. When declining:

1. **Thank them** for taking the time to think through the proposal
2. **Acknowledge the use case** -- show you understand why they want it
3. **Explain the reasoning** -- architectural fit, scope, maintenance burden, or philosophical alignment
4. **Offer alternatives** -- a workaround, a userland solution, or a different library that handles it
5. **Leave the door open** -- "If the community shows strong demand for this, we'll reconsider"

**Template response:**
> Thanks for the thoughtful proposal! I can see why [feature] would be useful for [use case].
>
> We've decided not to include this in tour-kit because [reason -- e.g., it would add complexity to the core that only benefits a small percentage of users / it goes against the headless-first philosophy / it would significantly increase bundle size].
>
> A few alternatives you might consider:
> - [Workaround using existing APIs]
> - [Userland implementation approach]
> - [Other library that handles this well]
>
> If this comes up frequently, we'll revisit the decision. Closing for now, but feel free to reopen if you have new arguments or if others want to upvote this.

### Contributing Guide

The CONTRIBUTING.md file is the front door to the contributor experience. It should make contributing feel achievable, not intimidating.

#### Structure

```markdown
# Contributing to Tour-Kit

Thanks for wanting to contribute! Here's everything you need to get started.

## Quick Start (5 minutes)

1. Fork and clone the repo
2. Install dependencies: `pnpm install`
3. Build all packages: `pnpm build`
4. Run in dev mode: `pnpm dev`
5. Run type checks: `pnpm typecheck`

## What Can I Contribute?

- **Bug fixes** -- Found a bug? Check if there's an issue. If not, open one first.
- **Documentation** -- Typos, unclear explanations, missing examples. Always welcome.
- **Tests** -- More test coverage is always appreciated.
- **Features** -- Check the Issues tab for `help wanted` labels. For new features,
  open an issue first to discuss the approach.

## Development Workflow

1. Create a branch from `main`: `git checkout -b my-feature`
2. Make your changes
3. Run `pnpm typecheck` to catch type errors
4. Run `pnpm build` to verify the build succeeds
5. Commit using conventional commits: `fix:`, `feat:`, `docs:`, `chore:`
6. Push and open a PR

## PR Review Process

- PRs are typically reviewed within 48 hours
- We may request changes -- this is normal and collaborative, not adversarial
- Once approved, a maintainer will merge
- Your contribution will be credited in the changelog

## Code Style

- TypeScript strict mode is required
- Follow existing patterns in the codebase
- Exports should have JSDoc comments
- Tests are expected for new functionality

## Questions?

Open a Discussion thread in the Q&A category. We're happy to help.
```

#### Key Principles for the Contributing Guide

- **Short.** Developers won't read a 2,000-word contributing guide. Get them to a working dev environment in 5 minutes.
- **Honest about expectations.** If PRs take 48 hours to review, say so. If you might request changes, say so. Unmet expectations create resentment.
- **Multiple entry points.** Some people want to fix a typo. Some want to implement a feature. Give both a clear path.
- **No gatekeeping language.** Avoid "you must" and "you should." Use "we recommend" and "here's how."

### README as Community Entry Point

The README (covered in detail in document 11) should include a "Contributing" section that:

- Links to CONTRIBUTING.md
- Links to good first issues: `https://github.com/user/tour-kit/labels/good%20first%20issue`
- Links to GitHub Discussions
- Includes a brief, encouraging call to action: "We welcome contributions of all sizes. Check out the good first issues to get started."

**Star/fork call-to-action:** A subtle line near the top of the README: "If tour-kit is useful to you, consider giving it a star. It helps others discover the project." This is acceptable in the open-source community and not considered pushy. Do not use animated GIF badges or "please star" banners -- those feel desperate.

---

## Discord Server

### When to Launch

**Criteria (ALL must be met):**
- 500+ GitHub stars
- 3+ active Discussion threads per week (proves demand for community interaction)
- At least 10 identifiable community members who engage regularly
- The maintainer has bandwidth to check Discord daily

**Why wait:** A Discord server with 15 members and no messages is an anti-signal. It tells potential users the project is dead or struggling. GitHub Discussions can handle community needs until there's enough activity to make a real-time channel feel alive.

**Pre-launch preparation:**
- Invite 10-20 active community members 1 week before public launch
- Seed channels with real conversations (not fake ones)
- Set up bots and integrations
- Write the welcome message and rules
- Post 2-3 days of real content before opening the doors

### Server Structure

#### Channel Categories

```
📋 WELCOME
  #rules-and-info         -- Server rules, code of conduct, useful links
  #introductions          -- New members introduce themselves
  #announcements          -- Release notes, breaking changes, events (read-only)

❓ HELP
  #general-help           -- "How do I...?" questions
  #typescript-help        -- TypeScript-specific questions (types, generics)
  #nextjs-integration     -- Next.js App Router, SSR, and routing questions
  #shadcn-ui-integration  -- Styling and component composition questions

💡 COMMUNITY
  #show-and-tell          -- Share what you've built
  #ideas-and-feedback     -- Feature ideas, UX feedback
  #what-are-you-building  -- Weekly thread: share your project

🔧 DEVELOPMENT
  #contributing           -- Discussion about contributing to tour-kit
  #core-development       -- Architecture discussions, RFC threads
  #pr-reviews             -- PR discussion and review requests

☕ OFF-TOPIC
  #random                 -- Non-tour-kit conversation
  #jobs                   -- Job postings (dev-related only)
```

#### Role Structure

| Role | Color | Permissions | How to Earn |
|------|-------|-------------|-------------|
| **Maintainer** | Red | Full admin, can manage channels and roles | Core team only |
| **Core Contributor** | Orange | Manage messages, pin messages, access to #core-development | 10+ merged PRs + demonstrated reliability |
| **Contributor** | Green | Access to #contributing and #core-development | 1+ merged PR |
| **Pro User** | Blue | Access to #pro-support (if created later) | Verified Pro license purchase |
| **Community** | Gray | Standard access to all public channels | Default role on join |

#### Bot Setup

**Essential bots:**

1. **Welcome Bot** (MEE6 or Carl-bot)
   - Welcome message in #introductions with server overview
   - Auto-assign Community role
   - Point to #rules-and-info and #general-help

2. **GitHub Integration** (official GitHub Discord bot)
   - Post new releases to #announcements
   - Post new issues labeled `help wanted` to #contributing
   - Post merged PRs to #contributing (celebrate contributions)

3. **FAQ Bot** (custom or Carl-bot auto-responses)
   - Auto-respond to common questions with links to docs:
     - "How do I install?" -> link to getting started guide
     - "Does it work with Next.js?" -> link to Next.js integration guide
     - "What's the difference between free and Pro?" -> link to pricing page
     - "How do I use it with shadcn/ui?" -> link to shadcn/ui guide

4. **Thread Bot**
   - Auto-create threads for messages in #general-help (keeps the channel clean)

#### Rules and Code of Conduct

Post in #rules-and-info:

```
Welcome to the Tour-Kit community!

1. Be respectful. We follow the Contributor Covenant Code of Conduct.
2. Ask questions freely. There are no stupid questions.
3. Search before asking. Check the docs and existing threads first.
4. No spam or self-promotion. Sharing your tour-kit project is welcome.
   Promoting unrelated products is not.
5. Help others when you can. The best communities are mutually supportive.
6. Keep it professional. No NSFW content, no harassment, no discrimination.
7. Use threads. Long discussions should move to threads to keep channels readable.

Violations result in: warning -> 24h mute -> permanent ban.
Report issues to any Maintainer via DM.
```

### Engagement Tactics

**Weekly "What Are You Building?" Thread**
- Posted every Monday in #what-are-you-building
- Maintainer kicks it off by sharing a recent tour-kit update or personal project
- Genuinely engage with every response (ask follow-up questions, offer suggestions)
- Highlight the most interesting ones on Twitter/X

**Monthly Community Call (Phase 3 only, if demand exists)**
- 30-minute Discord Stage or Google Meet
- Format: 10 min roadmap update, 10 min community showcase, 10 min open Q&A
- Record and post to YouTube (if there's a channel)
- Do NOT start these until people are asking for them. Forced community calls with 3 attendees are demoralizing.

**Contributor Spotlights**
- When someone's PR is merged, post a shout-out in #announcements
- Include what they contributed and why it matters
- Tag them so the community can congratulate them

**Roadmap Updates**
- Share roadmap updates in Discord FIRST, before anywhere else
- This makes Discord members feel like insiders, not just consumers
- Let the community react and discuss before the public announcement

---

## External Community Engagement

External engagement is about being a genuine member of developer communities -- not a marketer with a product to push. The golden rule: if you removed all mentions of tour-kit from your community participation, would you still be adding value? If not, you're spamming.

### Reactiflux Discord (200K+ members)

**How to participate authentically:**
- Hang out in #react, #react-native, #typescript, and #help channels
- Answer questions about React patterns, hooks, accessibility, and positioning -- topics where tour-kit's architecture gives you genuine expertise
- When someone asks about product tours specifically, mention tour-kit as ONE option alongside alternatives (React Joyride, Shepherd.js, Driver.js). Be honest about trade-offs.
- Never cold-drop a link to tour-kit in an unrelated conversation
- Build a reputation over weeks and months, not hours

**Frequency:** 3-5 helpful answers per week. Quality over quantity.

### Reddit

**Target subreddits:**
- r/reactjs (525K+ members) -- primary
- r/nextjs -- Next.js-specific discussions
- r/webdev -- broader web development
- r/SaaS and r/indiehackers -- for the indie hacker ICP

**Engagement rules:**
- **Be a community member first, maintainer second.** Your Reddit account should have diverse activity, not just tour-kit mentions.
- **Answer other people's questions.** Help with React architecture, TypeScript issues, accessibility problems -- even when tour-kit isn't relevant.
- **Cadence:** 3-5 helpful comments per week, maximum 1 tour-kit-related post per month.
- **When to mention tour-kit:** Only when someone explicitly asks for a product tour library, or when sharing a genuinely useful tutorial/comparison that happens to include tour-kit.
- **Never do:**
  - Post "Check out my library!" threads more than once at launch and once per major release
  - Use alt accounts to upvote or comment on your own posts
  - Respond defensively to criticism
  - Downvote competitors or speak negatively about other libraries

**Templates for natural Reddit engagement:**

When someone asks "What product tour library should I use?"
> Depends on your requirements. For React projects, the main options are:
> - **React Joyride** -- most established, huge community, but uses inline styles and has had React 19 compatibility issues
> - **Shepherd.js** -- framework-agnostic, Svelte-based with React wrapper
> - **Driver.js** -- lightweight, vanilla JS with React integration
> - **Tour-Kit** -- headless, hooks-based, designed for shadcn/ui/Tailwind stacks (disclosure: I maintain this one)
>
> If you need a headless approach where you control the UI completely, tour-kit fits that. If you want something battle-tested with a large community, Joyride is the safe bet. Happy to answer questions about any of them.

### Twitter/X Developer Community

**Strategy:** Build genuine relationships, share valuable content, and let tour-kit mentions happen naturally within a broader developer presence.

**Daily habits (15-20 minutes):**
- Follow and engage with React ecosystem voices (core team, library authors, influential developers)
- Reply to interesting technical threads with genuine insights
- Retweet and quote-tweet other people's cool work (not just tour-kit-related)
- Share code snippets, accessibility tips, React patterns -- content that's useful regardless of tour-kit

**Tour-kit-specific content (2-3 times per week max):**
- Ship-in-public updates: "Just shipped keyboard navigation for multi-page tours. Here's how focus management works across route changes..."
- Code snippet threads showing real patterns (not feature announcements disguised as education)
- Celebrating contributors: "Shoutout to @contributor who just added [feature]. Here's what it does..."

**Relationship building:**
- Engage with React core team members, shadcn, Tailwind authors, Next.js team
- Comment thoughtfully on their work (not "great work! btw check out tour-kit")
- Build genuine rapport over months before ever asking for anything

**What never to do:**
- Mass DM people asking them to try tour-kit
- Buy followers or engagement
- Post the same promotional tweet more than once
- Tag influencers in self-promotional tweets
- Respond to negative feedback with defensiveness

### Dev.to and Hashnode

**Strategy:** Publish long-form technical content that's genuinely useful, with tour-kit as a natural part of the narrative.

**Content cadence:** 1-2 articles per month.

**Types of articles that work:**
- Tutorials: "Building Accessible Product Tours in React" (mentions tour-kit as one approach)
- Comparisons: "React Joyride vs Tour-Kit: A Technical Deep Dive" (honest, with code examples)
- Architecture posts: "How We Built a Headless Tour Engine" (shares tour-kit's design decisions)
- Accessibility deep dives: "Focus Management in Multi-Step UI Overlays" (educational, tour-kit as example)

---

## Contributor Program

### Contributor Levels

The contributor program has four levels. Each level is earned through demonstrated contribution, not applied for. Promotions happen naturally as the maintainer recognizes sustained involvement.

#### Level 1: First-Time Contributor

**How to earn:** Submit and get 1 PR merged (any size, including docs fixes and typos).

**Recognition:**
- Name appears in the GitHub release notes for that version
- Shout-out in Discord #announcements (if Discord exists)
- Listed in CONTRIBUTORS.md (auto-generated from git history)

**What they get:**
- Contributor role in Discord
- Invitation to the #contributing channel

#### Level 2: Regular Contributor

**How to earn:** 3+ merged PRs that demonstrate understanding of the codebase and coding standards.

**Recognition:**
- Featured in the monthly changelog
- Named in a Twitter/X contributor spotlight post
- Listed on the Contributors page of the docs site with avatar and link

**What they get:**
- Everything from Level 1
- Free Pro license (if they don't already have one)
- Direct line to the maintainer for technical questions
- Invitation to weigh in on RFCs and roadmap decisions

#### Level 3: Community Champion

**How to earn:** Demonstrated sustained impact beyond code -- answering community questions, writing tutorials or blog posts about tour-kit, giving talks, creating example projects, or mentoring new contributors. This level is about influence and helpfulness, not just code volume.

**Recognition:**
- Featured on the docs site Contributors page with a "Champion" badge
- Shout-out in major release announcements
- Credited in the project's "About" narrative

**What they get:**
- Everything from Level 2
- Early access to upcoming features and design decisions
- Invitation to monthly community calls (when they exist)
- Maintainer will amplify their content (retweet, share blog posts)

#### Level 4: Core Contributor

**How to earn:** Invitation only, based on sustained high-quality contributions, deep understanding of the architecture, and demonstrated reliability. This person can be trusted with merge rights.

**Recognition:**
- Listed as a Core Contributor in README and docs site
- Decision-making authority on their area of expertise
- Mentioned in project governance documentation

**What they get:**
- Everything from Level 3
- Merge rights on specific packages (e.g., they "own" @tour-kit/hints)
- Write access to the repository (scoped to their packages)
- Input on release decisions and breaking changes
- Standing invitation to pair-program with the maintainer

### Recognition Practices

**In changelogs:**
Every changeset entry should credit the contributor. Not "Fixed keyboard navigation" but "Fixed keyboard navigation (thanks @username!)". This costs nothing and means everything to contributors.

**Contributors page on docs site:**
Auto-generate from GitHub contributors API, but add a manual "Champions" section with photos, bios, and links. This page should feel like a team page, not a list.

**Social media shout-outs:**
When a contributor's PR is merged, post about it. Be specific: "Thanks to @username for adding Loom embed support to @tour-kit/media. Here's what it does: [screenshot/code]." Generic "thanks for contributing!" posts feel empty.

**Swag (Phase 3, if budget allows):**
Physical recognition (stickers, t-shirts) for Core Contributors and Champions. This is low-priority and only worth doing if the community is large enough that it feels like a genuine thank-you, not a marketing play.

### Contributor Onboarding

The first contribution experience determines whether someone becomes a regular contributor or never comes back. Optimize relentlessly for this moment.

#### First PR Experience Optimization

**Within 2 hours of PR submission:**
- Auto-assign the PR to a maintainer (GitHub Actions)
- Bot posts a welcome comment: "Thanks for your first PR! A maintainer will review this within 48 hours. In the meantime, here's what to expect: [link to PR review process]."

**During review:**
- Be encouraging, not just correct. "Nice approach! One suggestion..." is better than "This needs to change."
- If changes are needed, explain WHY, not just WHAT. Link to relevant code or docs.
- Never request changes on trivial style issues that a linter should catch (set up CI to handle formatting)
- If the PR needs significant rework, offer to pair on it rather than just requesting changes

**After merge:**
- Thank them in the PR comments
- If Discord exists, post in #announcements
- Suggest a next contribution: "If you enjoyed working on this, you might also be interested in [related good first issue]."

#### Pair Programming Sessions

For contributors tackling complex issues (positioning engine, accessibility improvements, new package development):

- Offer 30-minute pair programming sessions via Discord voice or Google Meet
- Schedule at the contributor's convenience (respect time zones)
- Record the session (with permission) and post it as a YouTube unlisted video for other contributors
- This is high-effort but creates deeply committed contributors

#### Monthly Contributor Office Hours (Phase 2+)

- 1-hour open session on Discord Stage or Google Meet
- First Tuesday of each month (consistent schedule)
- Format: maintainer answers questions, reviews in-progress PRs, discusses upcoming work
- No presentation, no formality -- just open conversation
- Cancel if fewer than 3 people RSVP (no empty rooms)

---

## Community Metrics

Track these metrics monthly. The goal is not to hit arbitrary numbers but to understand trajectory and identify problems early.

### GitHub Metrics

| Metric | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|---------------|---------------|---------------|
| Stars | 0-500 | 500-2,000 | 2,000+ |
| Forks | 10-50 | 50-200 | 200+ |
| Contributors (all-time) | 5-15 | 15-50 | 50+ |
| New contributors per month | 2-5 | 5-15 | 15+ |
| Open issues (healthy range) | 10-30 | 20-60 | 30-100 |
| Median issue response time | < 24h | < 24h | < 12h |
| Median PR review time | < 48h | < 48h | < 24h |
| Discussion threads per week | 1-3 | 3-10 | 10+ |

### Discord Metrics (Phase 2+)

| Metric | Phase 2 Target | Phase 3 Target |
|--------|---------------|---------------|
| Total members | 50-200 | 200-1,000 |
| Daily active members | 10-30 | 30-100 |
| Messages per week | 50-200 | 200+ |
| Help questions answered by community (not maintainer) | 20% | 50%+ |
| Weekly active helpers (non-maintainer) | 3-5 | 10+ |

### External Metrics

| Metric | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|---------------|---------------|---------------|
| Reddit mentions per month | 2-5 | 5-15 | 15+ |
| Twitter/X mentions per month | 5-20 | 20-100 | 100+ |
| Blog posts about tour-kit (external) | 0-2 | 2-10 | 10+ |
| Conference talks mentioning tour-kit | 0 | 1-3 | 3+ |

### Contributor Health Metrics

| Metric | Healthy Signal | Warning Signal |
|--------|---------------|----------------|
| New contributors per month | Steady or growing | Declining for 3+ months |
| Repeat contributors (2+ PRs) | 30%+ of contributors return | Less than 10% return |
| PR merge time | < 48 hours median | > 1 week median |
| Contributor-to-champion pipeline | 1-2 new champions per quarter | No new champions in 6 months |
| Community self-service ratio | Community answers 50%+ of questions | Maintainer answers 90%+ of questions |

### Measurement Tools

- **GitHub Insights:** Built-in contributor, traffic, and community metrics
- **Cauldron.io or CHAOSS metrics:** Open-source community health analytics
- **Discord Server Insights:** Built-in analytics for member activity
- **Mention or Brand24:** Track social media mentions (optional, paid)
- **Google Analytics on docs site:** Track traffic from community channels
- **npm download stats:** correlate with community activity spikes

---

## Code of Conduct

### Adopt the Contributor Covenant

Use [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) -- it's the most widely adopted code of conduct in open source. Place it in `CODE_OF_CONDUCT.md` at the repository root.

### Why This Matters

A code of conduct isn't bureaucratic overhead. It serves three purposes:

1. **Sets expectations.** New community members know what behavior is acceptable before they encounter a problem.
2. **Protects the community.** Gives maintainers a clear framework for addressing toxic behavior without it feeling personal or arbitrary.
3. **Signals professionalism.** Enterprise evaluators (the Tertiary ICP) look for a code of conduct as a sign of project maturity. Its absence is a red flag for procurement teams.

### Enforcement Process

```
1. REPORT
   Anyone can report a violation via:
   - Email: conduct@tour-kit.dev (or maintainer's email)
   - Discord DM to any Maintainer
   - GitHub: open a private security advisory

2. REVIEW (within 24 hours)
   - Maintainer reviews the report
   - If the report involves a maintainer, another core contributor reviews
   - Document the incident privately

3. RESPOND (within 48 hours)
   Based on severity:

   Level 1 - Minor (first offense, unintentional):
   → Private message explaining what was inappropriate and why
   → No public action

   Level 2 - Moderate (repeated minor, or single intentional offense):
   → Private warning with specific behavioral expectations
   → Temporary mute in Discord (24-72 hours)
   → Comment hidden/deleted on GitHub

   Level 3 - Severe (harassment, discrimination, threats):
   → Immediate ban from Discord
   → Blocked on GitHub
   → No appeal for 6 months minimum

4. FOLLOW UP
   - Inform the reporter that action was taken (without revealing specifics)
   - Document the outcome privately for future reference
   - If patterns emerge, escalate to the next level
```

### Safe Space Commitment

Include this in the README, Discord rules, and docs site footer:

> Tour-kit is committed to providing a welcoming and harassment-free experience for everyone, regardless of gender identity, sexual orientation, disability, physical appearance, body size, race, ethnicity, age, religion, or technology choices. We do not tolerate harassment in any form. Participants who violate these rules will be sanctioned or expelled at the discretion of the maintainers.

---

## Appendix: Community Building Anti-Patterns

These are common mistakes that kill developer communities. Avoid them.

| Anti-Pattern | Why It Fails | What to Do Instead |
|-------------|-------------|-------------------|
| Launching Discord before there's demand | Dead channels signal a dead project | Wait for 500+ stars and active GitHub Discussions |
| Ignoring issues and PRs for weeks | Contributors feel disrespected and don't return | Set response SLAs and stick to them |
| Over-promoting in external communities | Gets you banned and destroys credibility | Be helpful first, mention tour-kit only when directly relevant |
| Creating elaborate contributor programs too early | Feels performative when there are only 3 contributors | Start simple, formalize when organic patterns emerge |
| Not crediting contributors | People contribute for recognition as much as technical growth | Credit every contribution in changelogs, social, and docs |
| Gatekeeping with complex PR requirements | First-time contributors bounce and never return | Make first contributions easy, provide mentorship for complex ones |
| Ignoring accessibility in community platforms | Excludes people you claim to welcome | Use platforms with screen reader support, provide text alternatives |
| Treating community as a marketing channel | Developers see through it immediately | Community is about mutual value, not lead generation |
| Responding defensively to criticism | Alienates the community and looks unprofessional | Thank critics, acknowledge valid points, explain decisions calmly |
| Copying competitors' community structure | What works for a 50K-star project won't work for a 200-star project | Scale community infrastructure to match actual community size |

---

## Quarterly Review Checklist

Every quarter, review the community strategy against these questions:

- [ ] Are we meeting our response SLAs for issues, PRs, and Discussions?
- [ ] Do we have 5-10 good first issues available right now?
- [ ] Are new contributors returning for a second PR? If not, why?
- [ ] Is the community answering questions for each other, or is it all maintainer?
- [ ] Are we engaging in external communities (Reddit, Twitter/X, Discord) consistently?
- [ ] Have we credited every contributor in changelogs and social media?
- [ ] Is it time to advance to the next phase? Do we meet the criteria?
- [ ] Are there any Code of Conduct issues that need addressing?
- [ ] What's the single biggest friction point for new contributors right now?
- [ ] Are we still having fun? (Burnout kills open-source projects faster than anything else.)
