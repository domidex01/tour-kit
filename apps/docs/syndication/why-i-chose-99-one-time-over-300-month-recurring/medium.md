# Why I Priced My React Library at $99 One-Time Instead of $300/Month

## The pricing decision behind an open-source developer tool

*Originally published at [usertourkit.com](https://usertourkit.com/blog/why-i-chose-99-one-time-over-300-month-recurring)*

I spent three weeks staring at a pricing page draft before I deleted the whole thing and started over.

The first version had tiers. Three of them: Starter at $29/month, Pro at $79/month, Enterprise at "Contact Sales." It looked exactly like every other developer tool pricing page on the internet.

That's when I realized something was off. I was building Tour Kit to be the opposite of those tools (headless, transparent, code-owned) and then copying their business model without questioning it.

So I questioned it. Here's what I found, what I decided, and where I was wrong along the way.

---

## The subscription model I almost built

Every SaaS pricing guide says the same thing: recurring revenue is king. And they're not wrong about the math. Monthly subscriptions give you predictable revenue, lower upfront commitment from buyers, and a number (MRR) that investors understand.

I built a spreadsheet. If I got 50 subscribers at $79/month, that's $3,950 MRR. At 100 subscribers, nearly $8,000. The compounding looked beautiful on a graph.

But I kept hitting the same problem: Tour Kit is a React library. You install it with `npm install`, it runs in your bundle, and it doesn't phone home. There's no server. No dashboard. No cloud infrastructure. Charging monthly for something that sits in someone's `node_modules` felt like charging rent on furniture they already own.

The onboarding SaaS tools I was competing against (Appcues at $249/month, Userpilot at $249/month, Pendo at "Contact Sales") charge those prices because they run infrastructure. They host your tours, inject scripts, serve assets, collect analytics. The monthly cost reflects ongoing operational expense.

Tour Kit has none of that. The core is 7.2KB gzipped. It ships in your build. The ongoing cost to me of supporting one more user is approximately zero.

---

## What made me switch

Three things pushed me toward one-time pricing.

The first was a Hacker News thread where a developer wrote: "I paid $200 for this 5 years ago and it still works perfectly. Why would I pay $10/month forever?" That comment had 847 upvotes. As of April 2026, 78% of finance decision-makers report increased scrutiny of recurring software costs, and 62% of businesses are actively consolidating their SaaS portfolios. Subscription fatigue is real, and developers feel it more acutely than most.

The second was the competition itself. Onboarding tool pricing ranges from $55/month (HelpHero) to $300+/month (Appcues, WalkMe). A bootstrapped team paying $129/month for onboarding will spend $1,548 in year one, $3,096 by year two, $4,644 by year three. For a React library that weighs less than a medium JPEG.

The third was a conversation with another indie developer who told me something blunt: "Your library doesn't have a server. Why are you pretending it does?"

---

## The $99 number

$99 landed in a psychological gap I liked. The median developer tool costs about $32/user/month, which works out to $384/year. A one-time $99 payment is roughly three months of a typical tool subscription.

Low enough for a developer to expense without approval. High enough that it doesn't look like abandonware.

56% of developers cite productivity as their primary goal when selecting a tool, not cost savings. So the framing isn't "save money compared to Appcues." It's "spend $99 once, ship onboarding flows forever, never think about this line item again."

---

## What went wrong

The first mistake was overthinking the free/paid boundary. If `useTour()` is free but `useTourAnalytics()` is paid, a developer's first reaction is annoyance, not gratitude for the free tier.

I rewrote the boundary. The three core packages are MIT-licensed, free forever, and functionally complete for building product tours. The Pro packages (surveys, scheduling, adoption tracking, checklists, announcements, media, analytics) add adjacent capabilities. Not gated core features.

The second mistake was almost using Gumroad for payments. Polar.sh solved this. It's open-source itself (Apache 2.0), charges 4% + $0.40 per transaction with no monthly fees, and handles license key generation natively. Guillermo Rauch (Vercel's CEO) endorsed it publicly.

---

## What I'd do differently

If I started over, I'd set the price at $149. Not because $99 is too low for the value, but because $149 gives more room for discounts, promotions, and early-adopter pricing. Starting at $99 and raising to $149 later is harder than starting at $149 and running $99 launch sales.

I'd also set activation limits from day one. AppSumo data shows that ~40% of lifetime deal products shut down within 3 years, partly because unlimited usage by early buyers consumes all the margin.

---

## The honest tradeoffs

One-time pricing means I'm always starting from zero. No MRR. No compounding revenue curve. Every month, I need new buyers.

But "Pay once, use forever" is a sentence that stops people mid-scroll. In a world where every tool wants a monthly relationship with your credit card, offering permanence is differentiation.

For now, the model is simple. Three packages are free. Eight packages cost $99, once. You own the code, you own the license, and you never see a renewal email.

That clarity is the whole point.

---

*Tour Kit is a headless product tour library for React. Get started at [usertourkit.com](https://usertourkit.com/).*

> **Suggested Medium publications:** JavaScript in Plain English, Better Programming, The Startup, Towards Dev
