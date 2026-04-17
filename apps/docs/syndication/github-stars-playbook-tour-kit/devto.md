---
title: "From 0 to 1000 GitHub Stars: What Actually Worked for My React Library"
published: false
description: "I built a headless product tour library for React as a solo dev. Here's the real playbook — what moved the star count, what flopped, and the data behind each tactic."
tags: opensource, react, javascript, webdev
canonical_url: https://usertourkit.com/blog/github-stars-playbook-tour-kit
cover_image: https://usertourkit.com/og-images/github-stars-playbook-tour-kit.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/github-stars-playbook-tour-kit)*

# From 0 to 1000 GitHub stars: the Tour Kit playbook

I started building Tour Kit in late 2025. A headless product tour library for React, split across 10 composable packages, shipped under 12KB gzipped. Zero dependencies.

Nobody cared.

The repo sat at 3 stars for weeks. All three were mine, my partner's, and a friend who probably didn't look at the code. That's the starting line for most open source projects, and the playbooks written by teams with marketing budgets don't account for it.

This is the honest version. What actually moved the star count for a solo-maintained React library, and what didn't.

## The starting point: a repo nobody noticed

Stars are social proof currency, not a success metric, but they determine whether anyone gives your library a second look. Enterprise teams scan star counts before adding a dependency. Investors glance at them during due diligence. Developers use them as a rough filter when comparing libraries on npm trends.

But a Carnegie Mellon and Socket research team found roughly [6 million suspected fake stars on GitHub](https://arxiv.org/abs/2412.13459) as of 2024, with about 15.8% of repositories holding 50+ stars involved in fake star campaigns. Sixty percent of those repos turned out to be phishing or malware vectors. The metric itself is corroded.

I decided early that every star Tour Kit earned would come from someone who actually looked at the code, tried the library, or read a blog post. No star-for-star exchanges. No buying GitHub accounts at $25 each. That constraint slowed things down, but it means every adoption metric I report is clean.

Still worth pursuing? Yes. A legitimately useful library with 12 stars gets dismissed before anyone reads the README.

## Key decisions: the README is your landing page

The first hundred stars came from one thing: a README that communicated the value proposition in under 10 seconds. I rewrote it four times before visitors started converting to stargazers, and that rewriting process taught me more about marketing than any playbook I'd read.

The early versions explained the architecture. Nobody cared about the architecture. What worked:

- A one-line pitch at the top: "Headless product tours for React. You own the UI."
- A 15-line code example showing a working tour in a shadcn/ui project
- A comparison table: Tour Kit vs React Joyride vs Shepherd.js vs Driver.js, with real bundle sizes from bundlephobia
- GitHub badges (build status, bundle size, TypeScript, MIT license)

Poor documentation is the number-one reason developers abandon open source projects. For a headless library where the repo *is* the product, the README is the landing page, the sales pitch, and the onboarding flow combined.

The first external stars trickled in from developers searching "headless product tour react" on GitHub. They found the repo, read the README, tried the install, and starred. No marketing required, just search-matching.

I spent zero dollars on this phase. The cost was time: roughly 20 hours rewriting docs, recording a demo GIF, and building the comparison table.

## What went wrong: Hacker News flopped, Reddit delivered

I assumed Hacker News would be the primary growth channel. A study of [138 repository launches](https://arxiv.org/abs/2511.04453) found repos gain an average of 121 stars within 24 hours of hitting the HN front page, 189 within 48 hours, and 289 within a week. Those numbers sold me on the strategy.

So I tried HN first.

The "Show HN" post got 4 upvotes and sank. I've since learned that "Show HN" carries no statistical advantage after controlling for post quality. The title and description matter far more than the tag. My title was too generic.

Reddit was different. A post on r/reactjs explaining *why* I built a headless tour library instead of contributing to React Joyride generated genuine discussion. Developers who'd struggled with Joyride's inline styles and class component architecture showed up in the comments. A few tried Tour Kit that day and starred it.

Indie Hackers contributor Amber Sahdev [documented a similar pattern](https://www.indiehackers.com/post/0-to-1000-github-stars-for-your-open-source-dev-tools-db2efb62f1): a single post on a relevant subreddit generated 143,000 views, roughly 500 shares, and sustained months of growth through SEO effects and GitHub's star-broadcast network (when someone stars your repo, their followers see it in their feed).

Her observation stuck with me: "More than half of the stars came many months after my last Reddit post."

The key was authenticity. Developers are allergic to hype. I posted from my personal account, acknowledged Tour Kit's limitations (no visual builder, React 18+ only, smaller community than Joyride), and linked directly to the repo instead of a marketing landing page.

Best subreddits for a React library, ranked by conversion:

1. r/reactjs (highest intent, technical audience)
2. r/webdev (broader reach, lower conversion)
3. r/opensource (community-minded, likely to star)
4. r/SideProject (supportive but lower traffic)

## What worked: content that compounds

Stars from Reddit spikes decay within a week or two. Technical blog posts targeting keywords your competitors ignore keep producing traffic for months, sometimes years. Tour Kit's content strategy became the single biggest contributor to sustained star growth.

I started publishing technical blog posts targeting keywords that competing tour libraries ignored. React Joyride has zero blog content. Shepherd.js has no blog. Driver.js has minimal documentation and no educational content.

The entire "react product tour" keyword space was owned by SaaS companies charging $249/month for hosted solutions. So I wrote the content they couldn't: code-first tutorials showing actual TypeScript, comparisons backed by bundlephobia data, and thorough walkthroughs of accessibility patterns. Every article linked back to the repo.

Three types of content moved the star count:

**Comparison articles with real data.** "Tour Kit vs React Joyride" with a side-by-side table comparing bundle sizes, TypeScript support, React 19 compatibility, and license types. Developers searching for alternatives found the comparison, tried Tour Kit, and starred.

**Tutorials targeting unserved keywords.** "How to add a product tour to a Next.js App Router project" had zero competition when I published it. The tutorial ranked, drove traffic to the repo, and converted.

**Building-in-public posts.** Candid updates about architecture decisions, bundle size optimization, and the business model (MIT free tier, $99 one-time Pro). These performed well on dev.to and Hashnode (cross-posted with canonical URLs to preserve SEO authority).

Ondrej Mirtes, creator of PHPStan, [described the same pattern](https://phpstan.org/blog/how-i-got-from-0-to-1000-stars-on-github-in-three-months-with-my-open-source-side-project): his library hit 1,300 stars and 30,000 downloads in three months, driven primarily by content that solved real problems. His advice: "Release the first version as soon as it's useful. Don't wait for it to be perfect."

## What I'd skip next time

Not every growth channel works for a solo-maintained library at the zero-to-one stage. Three popular tactics wasted my time, and understanding why they failed matters as much as knowing what succeeded.

**Product Hunt.** I watched Appwrite Sites hit #1 Product of the Day and Kilo Code rack up 500,000+ downloads after a Product Hunt launch. But those projects had polished marketing sites, existing communities ready to upvote, and teams behind them. For a solo-maintained library without a landing page, Product Hunt is premature.

**Awesome lists (too early).** The sindresorhus/awesome ecosystem is a real discovery channel. An "awesome-react" inclusion drives ongoing traffic. But submitting a PR to an awesome list at 50 stars feels presumptuous.

**Twitter threads.** Low conversion for developer tools in my experience. The audience scrolls past technical content unless you already have a following. Time spent on Twitter would've been better spent writing docs.

## What I'd double down on

Three tactics produced outsized returns relative to time invested, and I'd prioritize all three from day one if I were starting over with a new open source library.

**Docs as AI training data.** AI coding assistants (Copilot, Cursor, Claude) pull from your documentation when suggesting code. Tour Kit ships llms.txt and llms-full.txt files specifically designed for AI ingestion. Comprehensive docs aren't just for human readers anymore. They're marketing material for AI tools that suggest your library to developers.

As the Strategic Nerds 2026 developer marketing guide put it: "Your documentation is now training data."

**Issue responsiveness.** Mirtes again: "I take pride in being responsive to all incoming feedback. Although I don't fix each reported bug right away, I at least respond." A maintainer who replies within hours signals that the project is alive.

**The comparison table in the README.** This single element converted more visitors than anything else. A semantic HTML table with real numbers. Specific numbers win over adjectives.

## The numbers that actually matter

GitHub stars tell you who bookmarked your repo, but not who's building with it in production. Track these alongside stars:

| Metric | What it measures | Why it matters more than stars |
|--------|-----------------|-------------------------------|
| npm weekly downloads | Actual installs | Someone ran `npm install`, not just bookmarking |
| GitHub issues opened | Active usage | Bug reports mean people are building with it |
| PRs from external contributors | Community investment | Someone cared enough to fix something |
| Discord members | Community size | Ongoing engagement, not a one-time star |
| Blog referral traffic | Content effectiveness | Are tutorials driving adoption? |

MUI has 97,000 GitHub stars and 4.5 million weekly npm downloads. Ollama hit 136,000+ stars with 261% growth in 2024 alone. Stars and real adoption *can* track together, but only when the star count reflects genuine interest.

## What's next

The playbook I'd give to anyone starting at zero:

1. Write a README that converts in 10 seconds. Demo GIF, one-line pitch, comparison table.
2. Post authentically on the one subreddit where your target users actually hang out.
3. Write the tutorial nobody else has written. Target a keyword your competitors ignore.
4. Ship your docs as llms.txt for AI discovery.
5. Respond to every issue within 24 hours.
6. Track npm installs alongside stars. Stars without installs is noise.

Kasey Byrne, who's done developer marketing at Postman, npm, Rasa, and Botpress, [put it plainly](https://www.decibel.vc/articles/developer-marketing-and-community-an-early-stage-playbook-from-a-devtools-and-open-source-marketer): "You don't need paid advertising for a developer-focused company in the early stages."

She's right. You need a library that solves a real problem, documentation that proves it, and the patience to let word of mouth compound.

Tour Kit's docs live at [usertourkit.com](https://usertourkit.com/). The repo is public. Every star is earned.
