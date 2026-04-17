---
title: "Why I chose $99 one-time over $300/month recurring"
slug: "why-i-chose-99-one-time-over-300-month-recurring"
canonical: https://usertourkit.com/blog/why-i-chose-99-one-time-over-300-month-recurring
tags: react, javascript, open-source, indie-hacking, pricing
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/why-i-chose-99-one-time-over-300-month-recurring)*

I spent three weeks staring at a pricing page draft before I deleted the whole thing and started over.

The first version had tiers. Three of them: Starter at $29/month, Pro at $79/month, Enterprise at "Contact Sales." It looked exactly like every other developer tool pricing page on the internet.

That's when I realized something was off. I was building Tour Kit to be the opposite of those tools (headless, transparent, code-owned) and then copying their business model without questioning it.

So I questioned it. Here's what I found, what I decided, and where I was wrong along the way.

## The starting point: the subscription model I almost built

Every SaaS pricing guide says the same thing: recurring revenue is king. And they're not wrong about the math. Monthly subscriptions give you predictable revenue, lower upfront commitment from buyers, and a number (MRR) that investors understand.

I built a spreadsheet. If I got 50 subscribers at $79/month, that's $3,950 MRR. At 100 subscribers, nearly $8,000. The compounding looked beautiful on a graph.

But I kept hitting the same problem: Tour Kit is a React library. You install it with `npm install`, it runs in your bundle, and it doesn't phone home. There's no server. No dashboard. No cloud infrastructure. Charging monthly for something that sits in someone's `node_modules` felt like charging rent on furniture they already own.

The onboarding SaaS tools I was competing against (Appcues at $249/month, Userpilot at $249/month, Pendo at "Contact Sales") charge those prices because they run infrastructure. They host your tours, inject scripts, serve assets, collect analytics. The monthly cost reflects ongoing operational expense.

Tour Kit has none of that. The core is 7.2KB gzipped. It ships in your build. The ongoing cost to me of supporting one more user is approximately zero.

## What made me switch

Three things pushed me toward one-time pricing.

The first was a Hacker News thread where a developer wrote: "I paid $200 for this 5 years ago and it still works perfectly. Why would I pay $10/month forever?" That comment had 847 upvotes. The sentiment wasn't isolated. As of April 2026, 78% of finance decision-makers report increased scrutiny of recurring software costs, and 62% of businesses are actively consolidating their SaaS portfolios ([Getmonetizely, 2026](https://www.getmonetizely.com/articles/why-are-one-time-pricing-models-making-a-comeback-in-saas)). Subscription fatigue is real, and developers feel it more acutely than most.

The second was the competition itself. Onboarding tool pricing ranges from $55/month (HelpHero) to $300+/month (Appcues, WalkMe). Even the "affordable" options (UserGuiding at $89/month, Product Fruits at $129/month) add up fast. A bootstrapped team paying $129/month for onboarding will spend $1,548 in year one, $3,096 by year two, $4,644 by year three. For a React library that weighs less than a medium JPEG.

The third was a conversation with another indie developer who told me something blunt: "Your library doesn't have a server. Why are you pretending it does?"

## The $99 number

Choosing the actual price was harder than choosing the model. I considered $49 (too cheap, signals a side project), $149 (works but adds friction), and $199 (competitive with annual plans but feels expensive for a library).

$99 landed in a psychological gap I liked. According to CostBench data from 2026, the median developer tool costs about $32/user/month, which works out to $384/year ([CostBench, 2026](https://costbench.com/software/developer-tools/)). A one-time $99 payment is roughly three months of a typical tool subscription.

Low enough for a developer to expense without approval. High enough that it doesn't look like abandonware.

The Heavybit developer pricing survey confirmed something I suspected: 56% of developers cite productivity as their primary goal when selecting a tool, not cost savings ([Heavybit, 2026](https://www.heavybit.com/library/article/pricing-developer-tools)). So the framing isn't "save money compared to Appcues." It's "spend $99 once, ship onboarding flows forever, never think about this line item again."

I also looked at what actually works in the React ecosystem. TailwindUI proved that premium add-ons around a free framework is viable. react-admin generates roughly 1M EUR/year from an open-core model. The pattern is clear: give away the core, charge for the professional layer.

## What went wrong (and what I learned)

The first mistake was overthinking the free/paid boundary. I spent two weeks drawing lines between "core features" and "Pro features" that made no sense to users. If `useTour()` is free but `useTourAnalytics()` is paid, a developer's first reaction is annoyance, not gratitude for the free tier.

I rewrote the boundary. The three core packages (`@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`) are MIT-licensed, free forever, and functionally complete for building product tours. The Pro packages (surveys, scheduling, adoption tracking, checklists, announcements, media, analytics) add *adjacent* capabilities. Not gated core features. Adjacent tools you might not need at all.

This is the critical distinction. The open-source community pushes back hard when "open core" means the free version is crippled to upsell you. Tour Kit avoids this because the MIT core genuinely works on its own. The Pro layer is for teams that want the full onboarding platform, not for accessing basic functionality.

The second mistake was almost using Gumroad for payments. Nothing against Gumroad, but it's built for digital products, not developer tool licensing. I needed automated license key delivery, activation limits, and ideally something the developer community already trusts.

Polar.sh solved this. It's open-source itself (Apache 2.0), charges 4% + $0.40 per transaction with no monthly fees, and handles license key generation natively. Guillermo Rauch (Vercel's CEO) endorsed it publicly. The transaction fees are 20% lower than alternatives like Gumroad or Lemon Squeezy as Merchant of Record ([Polar.sh, 2026](https://polar.sh/resources/why)).

## What I'd do differently

If I started over, I'd set the price at $149.

Not because $99 is too low for the value (it might be) but because $149 gives more room for discounts, promotions, and early-adopter pricing. Starting at $99 and raising to $149 later is harder than starting at $149 and running $99 launch sales.

I'd also set activation limits from day one. Currently Tour Kit Pro activates on unlimited projects per license. That's generous and might need to change. AppSumo data shows that ~40% of lifetime deal products shut down within 3 years, partly because unlimited usage by early buyers consumes all the margin ([The Bootstrapped Founder, 2026](https://thebootstrappedfounder.com/lifetime-deals-and-saas-businesses/)).

And I'd be louder about the pricing decision earlier. Building in public creates trust. I waited too long to write this article.

## What worked (and the honest tradeoffs)

One-time pricing means I'm always starting from zero. No MRR. No compounding revenue curve. Every month, I need new buyers.

It also means I can't raise prices on existing customers. If Tour Kit Pro becomes dramatically more valuable in version 3.0, everyone who paid $99 in version 1.0 still has full access. That's the deal, and I'm fine with it, but it's a real constraint.

The counterargument is that subscription revenue isn't as stable as it looks. Developer tools have high churn. When budgets tighten, subscriptions get cut. A one-time payment is money in the bank. No churn anxiety, no "will they renew" spreadsheet.

There's also a marketing advantage I didn't expect. "Pay once, use forever" is a sentence that stops people mid-scroll. In a world where every tool wants a monthly relationship with your credit card, offering permanence is differentiation.

## What's next

Tour Kit's pricing will stay at $99 one-time for Pro. The MIT core will stay free. Those aren't up for debate.

For now, the model is simple. Three packages are free. Eight packages cost $99, once. You own the code, you own the license, and you never see a renewal email.

That clarity is the whole point.

```bash
npm install @tourkit/core @tourkit/react
```

Get started at [usertourkit.com](https://usertourkit.com/) or browse the [full documentation](https://usertourkit.com/docs).
