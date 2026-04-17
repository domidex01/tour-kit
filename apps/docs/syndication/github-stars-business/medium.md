# GitHub Stars Don't Pay the Bills (But They Help)

## What a solo developer learned about the gap between stars and revenue

*Originally published at [usertourkit.com](https://usertourkit.com/blog/github-stars-business)*

I watched the star count on Tour Kit tick past a milestone last month. My first instinct was to screenshot it and post it somewhere. My second instinct was to check my Polar dashboard.

The numbers told two different stories. Stars go up. Revenue doesn't follow in lockstep.

If you're building an open-source developer library as a solo developer in 2026, understanding the gap between those two lines is the difference between a sustainable project and an unpaid job. This isn't a "stars are useless" take. They aren't useless. But the relationship between stars and money is weirder, more indirect, and more useful than most people assume.

---

## The starting point

Every open-source project starts with the same dopamine loop: push code, watch stars accumulate, feel validated, repeat. I launched Tour Kit as a headless React library for product tours with ten packages, MIT-licensed core, and TypeScript-strict configuration. Stars started accumulating almost immediately. And I started paying close attention to a number that felt meaningful but didn't map cleanly to anything else I was tracking.

A GitHub star is a bookmark with social proof attached. Someone saw your repo, thought "looks interesting," and clicked a button. That's it. As of April 2026, a study by He et al. found over 4.5 million suspected fake stars on GitHub. Fake stars cost as little as EUR 0.08/star for bulk purchases and up to EUR 0.80/star for premium stars from aged accounts.

I'm not saying anyone starring Tour Kit is fake. But when a metric can be purchased for less than the cost of a coffee, that tells you something about its weight as a business signal.

---

## Key decisions

The two architectural choices I made early on determined whether GitHub stars would be a vanity metric or a functional part of Tour Kit's growth strategy, and neither decision was obvious at the time.

First, I went open core instead of hosted. MIT-licensed core packages, proprietary extended packages at $99 one-time. This means stars matter mostly as a trust signal. A developer evaluating two libraries with identical READMEs will click into the one with 5,000 stars before the one with 50. Is that fair? No. Is it how decisions actually get made? Yes.

Second, I treated GitHub search ranking as a growth channel. GitHub's search results weight star counts. More stars means higher ranking, which drives organic discovery, which drives more stars. For a solo developer without a marketing budget, that flywheel is the single most concrete business value stars provide.

GitHub added 36 million new developers in 2025. AI-related repositories jumped 178% year-over-year. That's a bigger audience than ever searching for libraries, and stars are the ranking signal in that marketplace.

---

## What went wrong

The biggest mistake I made in Tour Kit's first year was treating GitHub stars as a leading indicator of project health, when they're actually a lagging indicator of awareness that tells you almost nothing about adoption or revenue potential.

I'd check the star count before checking npm installs. A day where stars climbed felt productive even when nothing downstream moved. And when I looked at the numbers honestly, the correlation between stars and actual package adoption was moderate at best.

Worse, I watched what happens when you rely on donations. OpenSSL, one of the most critical pieces of software on the internet, received roughly $2,000 annually in donations as of 2024. Two thousand dollars. For software that secures the internet. One developer on Hacker News shared that after placing a donation link on their 5,000+ star repo, they received exactly one recurring donation: $1 per month.

Stars don't translate to donations. They don't translate to sponsorships. As one HN commenter put it: "Stars don't pay rent. Real contributions, thoughtful PRs, and working code do."

---

## What worked

After recalibrating how I thought about stars, three specific changes moved Tour Kit from "growing star count, flat revenue" to "stars feed a funnel that actually converts."

**Using stars as a discovery engine, not a scoreboard.** Once I stopped obsessing over the daily count and started treating GitHub search ranking as a marketing channel, stars became useful. People searching "react product tour library" find Tour Kit because it ranks well. That ranking comes partly from stars. The stars are means, not ends.

**Tracking what matters downstream.** Time to second interaction turned out to be the strongest predictor. Someone who stars today and opens an issue tomorrow is worth more than a hundred people who starred and disappeared.

**Learning from projects that turned stars into money.** Postiz, an open-source social media tool, reached $14,200/month MRR as a solo developer. Revenue came from cloud hosting, not the code itself. Growth from $6,523 to $12,648 MRR between July and August 2025 coincided with 4.79 million Docker downloads. Stars drove awareness. A separate product drove revenue.

The pattern is consistent. As senko on HN put it: "Open source is not a business model. You have to make something people want AND convince those people it's in their best interest to pay you."

---

## What I'd do differently

If I were starting over, three changes:

First, plan monetization from day one. Not charging for the core, but architecting the paid tier alongside it. One HN commenter's advice is tattooed on my brain: "Think about monetization when you start the project, not when it's done."

Second, spend less energy chasing stars and more on downstream metrics. A single blog post that drives 50 npm installs beats a trending repo day that drives 500 stars and zero installs.

Third, accept real limitations honestly. Tour Kit has no visual builder. You need React developers. The community is smaller than React Joyride or Shepherd.js. Acknowledging these honestly builds more trust than pretending they don't exist.

---

## What's next

The star count on Tour Kit will keep climbing, but the dashboard I check every morning now shows npm installs, documentation page views, and issue quality scores instead of the GitHub star counter that used to be my browser's default tab.

Stars get them to the repo. The README gets them to the docs. Docs get them to `npm install`. And that installation experience decides whether they stay.

That last part is where the real work happens. Not in the star count.

---

*Tour Kit is a headless, composable product tour library for React. MIT-licensed core, under 8KB gzipped, TypeScript-strict. [usertourkit.com](https://usertourkit.com/)*

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, The Startup
