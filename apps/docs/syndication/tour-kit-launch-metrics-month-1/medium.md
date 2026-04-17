# Month 1 of an open source React library: the real numbers

## 183 stars, 89 downloads, and everything I'd do differently

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-launch-metrics-month-1)*

I shipped User Tour Kit thirty days ago. A headless product tour library for React, built solo, with 10 packages in a Turborepo monorepo. Here are the real numbers.

Not the "how I got 10K stars" version. The actual month-1 numbers for a library that didn't go viral, didn't get featured by a tech influencer, and didn't have a marketing budget.

## Why publish the numbers at all

Building-in-public retrospectives almost always come from projects that already succeeded. The "here's how I got to 5,000 stars" posts create survivorship bias that makes everyone else feel like they're failing.

According to Buffer's 2025 State of Social Media report, 45% of creators who shared their journey publicly saw stronger user trust and brand loyalty. But that stat hides something: most of the published journeys are curated highlight reels.

I wanted to write the post I wished existed when I launched. Modest numbers, honest context, specific lessons.

## Where Tour Kit started

Frustration with existing product tour libraries. React Joyride ships at 37KB gzipped. Shepherd.js requires AGPL licensing for commercial use. Most alternatives force you into their CSS and don't compose with shadcn/ui or Tailwind.

I wanted a headless library where the logic lives in hooks and the UI is yours. Tree-shakes to under 8KB for the core. TypeScript strict mode. WCAG 2.1 AA from the start, not patched in later.

Three months of solo development. Ten packages.

## Key decisions

The architecture call that took the longest: splitting core logic from React bindings. Every hook composes through `@tourkit/core`. The React package is a presentation layer.

That split added two weeks to development. But it means the library could support Vue or Svelte bindings later without rewriting business logic.

## The actual numbers

Here's the dashboard from day 30:

| Metric | Day 1 | Day 7 | Day 30 |
|--------|-------|-------|--------|
| GitHub stars | 12 | 47 | 183 |
| npm weekly downloads | 8 | 34 | 89 |
| Unique docs visitors | 31 | 112 | 487 |
| GitHub issues opened | 0 | 2 | 9 |
| External PRs | 0 | 0 | 2 |
| Discord members | 0 | 3 | 18 |
| Blog articles published | 5 | 12 | 34 |

For context: research from a 202-developer survey on open source tool adoption found that 70.1% of open source discovery happens through social or community channels. An arxiv study on Hacker News launch diffusion found repositories gain an average of 121 stars within 24 hours and 289 within a week of front-page exposure.

I didn't hit the front page of Hacker News.

183 stars in month 1 puts Tour Kit somewhere in the "shows traction, visible to developers" tier. Not the "signals a legitimate project" tier (that's 1,000+). And that's fine. Star velocity matters more than raw count.

## What worked

**Content-first launch.** I published 34 blog articles in the first month. The 202-developer survey also found that 73% of developers want tutorials and quickstart guides as their first interaction with a new library. So that's where I spent the time.

The articles that drove the most traffic were comparisons and technical posts. Tutorials came third. I expected tutorials to win.

**Honest comparisons.** I wrote comparison articles that gave competitors credit where earned. React Joyride has 600K+ weekly downloads for a reason: it works, it's battle-tested, and the community is huge. Acknowledging that in writing earned more trust than pretending Tour Kit was objectively better at everything. It isn't.

**Bundle size as a positioning wedge.** Tour Kit's core ships under 8KB gzipped. In a market where most alternatives are 20-40KB, that number does real work.

## What went wrong

**The docs site at launch was too minimal.** I had API reference pages but not enough "getting started" narrative. The first three GitHub issues were all variations of "how do I actually set this up?"

Nobody reads API docs first. They want a 5-minute tutorial that ends with something working on screen.

**Reddit timing was terrible.** Posted on a Friday evening. Got 4 upvotes and zero comments. Tanner Linsley, creator of react-table and TanStack Query, wrote about this: "The existence of a great product is not enough for it to be a success." Great code with no distribution strategy gets zero adoption.

**The "headless" marketing problem.** How do you demo something invisible? Screenshots and GIFs sell libraries. My initial demos were just code. No visual payoff. I had to build styled example apps after launch. That should have been ready on day one.

## The vanity metrics trap

Stars and downloads are the numbers everyone asks about. But npm download counts are mostly CI noise. My 89 weekly downloads tell me almost nothing about actual adoption.

The metrics I actually watch:

1. First issue from a stranger (day 4)
2. First external PR (day 19)
3. First unprompted mention (day 22)
4. First "I switched from X" (not yet)

These aren't vanity metrics. They're adoption signals that indicate someone made a deliberate choice to use, contribute to, or recommend the library.

## What I'd cut

The announcement templates. Two days writing platform-specific launch posts. Most got negligible traction.

The Pro tier pricing page. At month 1 with 183 stars, a pricing page adds friction without adding revenue. I should have kept everything MIT for the first 90 days.

The extended package count. Ten packages is a lot for month 1. I should have launched with three, then added the rest based on what users actually asked for.

## What's next

The honest assessment: 183 stars and 89 weekly downloads after 30 days is not a breakout launch. But it's a real start, with real users filing real issues and submitting real PRs.

Full article with code examples and all the data: https://usertourkit.com/blog/tour-kit-launch-metrics-month-1

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, The Startup*
