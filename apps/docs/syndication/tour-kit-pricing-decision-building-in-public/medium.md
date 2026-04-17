# How I Set My Open Source Library's Price at $99

## The spreadsheets, wrong assumptions, and napkin math behind pricing a developer tool

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-pricing-decision-building-in-public)*

I spent three weeks staring at a spreadsheet with one column: "Price." The rows were $49, $79, $99, $149, $199. Each had a napkin-math revenue projection. None of them felt right.

Tour Kit is a headless product tour library for React. Ten packages, MIT core, TypeScript-first. The kind of thing most developers expect to be free. And most of it is. But the extended packages (surveys, scheduling, adoption tracking) need to pay for themselves or they stop getting maintained.

This is the full story of how I landed on $99 one-time. The spreadsheets, the wrong assumptions, the data that changed my mind, and the math I wish someone had shown me before I started.

---

## Subscription was the default

Every pricing article I read in early 2026 said the same thing. Charge monthly. MRR is the metric that matters. Investors want recurring revenue. SaaS multiples are 8-12x ARR.

I built the first pricing page with three tiers: $19/month Starter, $49/month Pro, $99/month Team. Standard SaaS grid. Three columns, a highlighted "Most Popular" badge on the middle one. You've seen it a thousand times.

Then I actually looked at what I was selling. Tour Kit isn't a hosted service. No server, no dashboard, no data pipeline. It's npm packages that ship in your bundle. The "subscription" would be paying monthly for... what exactly? Permission to keep using code already in your node_modules?

That felt dishonest. A Heavybit study on developer tool pricing confirmed my gut: 56% of developers choose tools based on productivity gains, not cost savings. Only 5% pick tools because they're cheap.

## One-time vs. recurring

SlashData research found 39% of developers prefer one-time purchases for tooling, and that number climbs to 44% for tools that ship as packages (IDEs, editors, libraries). Subscriptions still win overall at 53%, but the gap narrows for anything that doesn't require a running server.

An Indie Hackers thread crystallized it. One developer wrote:

> "As a solo dev, I'm not trying to build a $10M SaaS. I care more about focus, simplicity, and building useful things without running a customer support empire."

I chose one-time. But the honest truth is that subscription users pay more over time. I'm leaving long-term revenue on the table. I know that.

Here's why I'm okay with it: Tour Kit is a library, not a platform. You install it, configure it, ship it. Charging monthly for something you interact with once during setup and then forget about feels like a trick.

## Why $99 and not $49 or $199

As of April 2026, developer tool pricing ranges from $0 to $1,000/user/month, with a median around $32/user/month (CostBench data). A $99 one-time payment equals roughly three months of a typical tool subscription.

The psychology breaks down into three zones:

**$20-$49: the impulse zone.** People buy without thinking. But they also forget about it. Docs go unread, configuration gets skipped, and support tickets pile up.

**$100-$500: the approval zone.** At most companies, anything over $100 requires a manager's sign-off. I wanted to stay below that line.

**$50-$99: the "I'll expense this" zone.** High enough to signal professional quality. Low enough for a single developer to put on their company card without asking anyone. This is where react-admin (~1M EUR/year from open-core) and Tailwind UI live.

## Drawing the MIT/Pro line

This is the decision that keeps open-core maintainers up at night. The n8n pricing controversy showed what happens when the boundary feels arbitrary — they transitioned from open source to open-core after building a community. Tour Kit was designed as open-core from day one.

The split maps to *who benefits*:

- **MIT (free forever):** core tours, React components, hints — individual developer needs
- **Pro ($99 one-time):** surveys, scheduling, adoption, checklists — organizational needs

Nobody argued with it. The boundary follows a natural line between what a solo developer needs and what a product team needs.

## The payment infrastructure rabbit hole

I wasted two weeks building custom Stripe integration. Webhook handlers. License key generation. Activation limits. A validation API. Database tables.

Then I found Polar.sh. It handles license key delivery, file downloads, and payment processing at 4% + $0.40 per transaction. I deleted 800 lines of code.

The default instinct for developers is to build. But building payment infrastructure isn't my competitive advantage. Building a better tour library is.

## The napkin math nobody publishes

Here it is:

- Polar takes 4% + $0.40 per transaction: **$95.64 net per sale**
- Monthly costs (domain, hosting, CI, email): roughly **$85/month**
- Target: cover costs + part-time salary at $5,000/month
- **$5,085 / $95.64 = 54 licenses per month**

54 sales a month. That's sustainability. Not venture scale. Not $10M ARR.

Is that realistic? The dev tools market is growing from $6.41B (2025) to $7.44B (2026). GitHub Copilot hit $400M in revenue in 2025. Developers are paying for tooling at record rates. But Tour Kit doesn't have React Joyride's 603K weekly downloads or Shepherd.js's decade of brand recognition. Those are real limitations.

## What I'd do differently

Start the pricing conversation earlier. Skip the custom Stripe code entirely. Publish the napkin math on day one — the "54 licenses a month" number disarms skepticism faster than any marketing page.

---

*Full article with all data sources and code examples at [usertourkit.com](https://usertourkit.com/blog/tour-kit-pricing-decision-building-in-public).*

*Submit to: JavaScript in Plain English, The Startup, or Towards Data Science (business/analytics angle)*
