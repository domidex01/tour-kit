---
title: "We calculated 3-year TCO for DIY tours vs libraries vs SaaS — here's the math"
published: false
description: "Build from scratch costs $70K-$85K in year one. SaaS costs $6K-$54K. But over three years, a headless library wins for teams above 25K MAUs. Here are the formulas."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/build-vs-buy-product-tour-calculator
cover_image: https://usertourkit.com/og-images/build-vs-buy-product-tour-calculator.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/build-vs-buy-product-tour-calculator)*

# The developer's calculator: DIY tour vs library vs SaaS

Every product team hits the same crossroads: build onboarding from scratch, install an open-source library, or pay for a SaaS platform. The usual advice is to "just buy" and move on. But that advice comes from the vendors selling you the subscription. We ran the numbers across all three paths and found the answer depends on four variables: your team's hourly rate, your MAU count, how many tours you maintain, and your time horizon.

Disclosure: we built Tour Kit. That makes us biased toward the library path. Every number below is sourced, and you can plug in your own inputs to check our work.

```bash
npm install @tourkit/core @tourkit/react
```

## The problem: build-vs-buy is a false binary

Every build-vs-buy article frames the decision as two options, but product tour implementation actually has three distinct paths with different cost curves, maintenance profiles, and long-term trade-offs. As of April 2026, 35% of enterprises have replaced at least one SaaS tool with a custom build, and 78% plan to build more this year ([Retool 2026 Build vs Buy Report](https://www.businesswire.com/news/home/20260217548274/en/Retools-2026-Build-vs.-Buy-Report-Reveals-35-of-Enterprises-Have-Already-Replaced-SaaS-With-Custom-Software)). The binary framing misses a third category: headless libraries that sit between DIY and SaaS.

What each path looks like in practice:

You can build from scratch, writing tooltip positioning, overlay rendering, step sequencing, keyboard navigation, scroll handling, focus trapping, and analytics hooks yourself. That's two to three engineers, one UX designer, and two to six months before you ship anything.

Or install a headless library. It handles the hard parts (positioning, state, accessibility) while you render the UI with your own components. One engineer, two to four weeks.

Or pay for SaaS. Embed a third-party script, configure tours in a visual builder, pay per monthly active user. A product manager can ship a tour in 15 minutes, but you give up design control and code ownership.

Each path follows a different cost curve. Building from scratch is cheap at month zero and expensive forever. SaaS is expensive at month one and scales against you. The library path sits in the middle.

## The argument: headless libraries win on three-year TCO for growing teams

Year-one costs tell a misleading story because they hide the maintenance multiplier and MAU-based pricing that dominate years two and three. We calculated costs using a US-based senior React developer at $150/hour, roughly $95K salary plus benefits and overhead. Adjust for your region: Eastern Europe averages $35-90/hour, South/Southeast Asia $20-70/hour ([HatchWorks, 2025](https://hatchworks.com/blog/software-development/build-vs-buy/)).

| Cost component | DIY (from scratch) | Headless library | SaaS platform |
|---|---|---|---|
| License / subscription | $0 | $0 (MIT) or $99 one-time | $2,988-$10,548/yr (Appcues) or $15K-$48K/yr (Pendo) |
| Initial engineering | $45,000-$60,000 | $12,000-$24,000 (2-4 weeks) | $3,000-$6,000 (1-2 days + learning curve) |
| Maintenance (year 1) | $25,000+ (quarterly updates) | $6,000-$12,000 (library handles core updates) | $0 (vendor handles it) |
| Opportunity cost | 2-6 months of feature work delayed | 2-4 weeks of feature work delayed | Minimal delay |
| **Year 1 total** | **$70,000-$85,000** | **$18,000-$36,099** | **$5,988-$54,000** |

Sources: DIY estimates from [Appcues engineering cost analysis](https://www.appcues.com/blog/build-vs-buy-saas); SaaS pricing from [Appcues pricing](https://userorbit.com/blog/appcues-pricing-guide) and [Pendo pricing](https://userorbit.com/blog/pendo-pricing-guide) as of April 2026.

## Three-year TCO: where the lines cross

Year one favors SaaS for small teams, but the cost curves diverge sharply over 36 months because maintenance compounds on DIY builds and per-MAU pricing scales against you on SaaS platforms. The crossover point between SaaS and library typically falls between 10K and 25K monthly active users.

| 3-year TCO | DIY | Headless library | SaaS (10K MAUs) | SaaS (50K MAUs) |
|---|---|---|---|---|
| Initial build | $52,500 | $18,000 | $4,500 | $4,500 |
| Maintenance (3 years) | $75,000 | $27,000 | $0 | $0 |
| Subscription (3 years) | $0 | $0-$99 | $31,500 | $94,500+ |
| Framework upgrades | $15,000 | $3,000 | $0 | $0 |
| **3-year total** | **$142,500** | **$48,000-$48,099** | **$36,000** | **$99,000+** |

SaaS still wins on raw cost at 10K MAUs. Double that to 50K, and the library path costs half as much. Cross 100K MAUs and SaaS bills often exceed $100K over three years, all for code you don't own.

IBM research shows maintenance consumes 50-75% of total software costs over a product's lifetime ([Adevs, 2026](https://adevs.com/blog/software-maintenance-costs/)). The DIY path gets crushed by this multiplier. A headless library absorbs most of that maintenance burden because the library maintainers handle positioning bugs, browser updates, React version compatibility, and accessibility patches. You maintain your UI layer and tour configurations.

## Counterargument: when SaaS or DIY is genuinely the right call

The library path isn't always correct. Patrick Thompson documented Atlassian's internal onboarding build at $3 million over three years, with staffing growing from 3 to 7 people and infrastructure costs hitting $200K-$500K annually ([Userpilot, 2026](https://userpilot.com/blog/build-vs-buy-user-onboarding/)). That case argues for SaaS, not libraries. Atlassian's scale meant their onboarding team became a product team unto itself.

SaaS genuinely wins for teams without frontend engineers, products under 5K MAUs, and situations where a product manager needs to ship tours without code changes. Appcues and Userpilot both do this well, and the AdRoll growth team reported that "creating modals takes 15 minutes rather than days" after adopting Appcues.

DIY wins for genuinely novel use cases: AR onboarding, 3D product walkthroughs, or non-web platforms where no library exists. The Salesflare co-founder's experience confirms the time cost, though. Their gamification checklist alone required a couple of weeks, with complete onboarding taking roughly two months. For a startup, that's a quarter of a runway segment.

## How to run your own numbers

The tables above use our assumptions, but your team's hourly rate, MAU count, and maintenance capacity will shift the outcome. Below are the three formulas we used so you can plug in your own values and see which path actually costs less for your specific situation.

**DIY three-year TCO:**

```
initial_cost = (engineers * hourly_rate * hours_per_week * build_weeks)
annual_maintenance = initial_cost * 0.20
framework_upgrades = hourly_rate * 40 * major_versions_in_3_years
total = initial_cost + (annual_maintenance * 3) + framework_upgrades
```

**Library three-year TCO:**

```
integration_cost = (1 * hourly_rate * hours_per_week * integration_weeks)
annual_maintenance = integration_cost * 0.15
license = 99  // Tour Kit Pro, one-time
total = integration_cost + (annual_maintenance * 3) + license
```

**SaaS three-year TCO:**

```
monthly_cost = base_price * ceil(maus / pricing_tier_size)
annual_cost = monthly_cost * 12
setup_cost = hourly_rate * 16  // ~2 days integration
total = setup_cost + (annual_cost * 3)
```

MAU count is the variable that swings the outcome most. Below 5K MAUs, SaaS wins. Above 25K, the library path starts pulling ahead on cost. And once you cross 100K MAUs, SaaS pricing becomes a line item your finance team will question during quarterly reviews.

## What the formulas don't capture

Cost calculators reduce decisions to dollars, but four qualitative factors regularly override the math: design control, vendor lock-in risk, performance overhead, and accessibility ownership. These are harder to quantify but often matter more than the TCO difference between options.

**Design control.** SaaS tools give you a visual builder but limited customization. Got a design system? shadcn/ui, Radix, custom tokens? SaaS widgets will stick out like a sore thumb. A headless library renders your components instead, so tours match your product.

```tsx
// Tour Kit: your components, your design system
import { Tour, TourStep } from '@tourkit/react';

<Tour tourId="onboarding">
  <TourStep target="#dashboard-chart">
    {/* Your shadcn/ui Card component, your Tailwind classes */}
    <Card className="p-4 max-w-sm">
      <CardTitle>Revenue dashboard</CardTitle>
      <CardDescription>
        This chart updates in real time as sales come in.
      </CardDescription>
    </Card>
  </TourStep>
</Tour>
```

**Vendor lock-in.** SaaS tour configurations live on someone else's server. If the vendor raises prices (Pendo increased from ~$15K to ~$48K average annual contract), changes their API, or shuts down, your onboarding breaks. With a library, your tour code lives in your repo alongside your application code.

**Performance overhead.** SaaS onboarding tools inject third-party scripts that add 40-150KB to your bundle and create additional network requests. We measured this in our [Lighthouse audit of onboarding SaaS tools](https://usertourkit.com/blog/onboarding-tool-lighthouse-performance). Tour Kit's core ships at under 8KB gzipped with zero runtime dependencies.

**Accessibility ownership.** WCAG 2.1 AA compliance is your responsibility regardless of approach. SaaS tools handle some of it, but you can't audit their implementation. With a library, you own the ARIA attributes, keyboard navigation, and focus management. When an audit finds an issue, you fix it in your code instead of filing a ticket.

## The decision framework

Sometimes the math is close enough that the qualitative factors above should drive the choice. If your team clearly fits one of these profiles, skip the calculator entirely and follow the recommendation that matches your constraints, team composition, and growth trajectory.

**Choose DIY if** you're building something genuinely novel (AR onboarding, 3D tours, non-web platforms) that no library or SaaS supports. Accept the 2-4x maintenance multiplier.

**Choose a headless library if** you have React developers, care about design consistency, and plan to scale past 10K MAUs. This is where Tour Kit fits. Honest limitation: no visual builder, React 18+ only, smaller community than React Joyride.

**Choose SaaS if** your team has no frontend engineers, you need tours this week, and your MAU count stays under 10K.

**Choose nothing if** contextual tooltips and good empty states handle the job. Not every product needs a guided tour.

## What about AI changing the math?

AI coding tools have reduced custom development timelines by an estimated 30-50% for well-defined tasks as of April 2026, which changes the initial build cost column in the calculator but leaves the maintenance multiplier untouched. The question isn't whether AI makes building faster; it's whether faster building matters when maintenance is 50-75% of lifetime cost.

AI can generate tooltip components and step sequencing quickly. But browser quirks, React version upgrades, positioning edge cases, and accessibility compliance still need human attention. The initial build gets cheaper. Ongoing maintenance doesn't shrink.

Here's the more interesting effect: AI makes library-based approaches stronger too. You can use AI to generate tour step configurations, content, and targeting rules while the library handles infrastructure like positioning, scroll handling, focus trapping, and overlay rendering. AI + headless library might be the actual fourth option nobody's discussing yet.

## FAQ

### How much does it cost to build a product tour from scratch?

A DIY product tour built by a US-based team typically costs $45,000-$60,000 in year one, including development and maintenance. Mid-market companies report $200,000. Atlassian spent $3 million over three years at enterprise scale. Maintenance runs 15-25% of the initial build cost annually.

### Is it cheaper to use a SaaS onboarding tool or an open-source library?

For teams under 5,000 MAUs, SaaS tools like Appcues ($249/month) or Userpilot ($199/month) cost less than library integration time. Above 25,000 MAUs, a headless library like Tour Kit becomes cheaper because there's no per-user pricing. The crossover depends on your developer hourly rate and MAU growth.

### What hidden costs do SaaS onboarding tools have?

SaaS onboarding tools carry hidden costs beyond the subscription: performance overhead (40-150KB injected scripts), vendor lock-in risk, limited design customization, and pricing tied to MAU growth. Pendo's average annual contract rose to $48,000 as of 2026. Switching costs compound over time.

### How long does it take to integrate a product tour library?

Tour Kit integration for a typical 5-10 step onboarding tour takes 2-4 weeks for one React developer, including design implementation and testing. Building from scratch typically requires 2-6 months with 2-3 engineers. SaaS tools deploy faster (1-2 days) but offer less customization.

### Should startups build or buy their onboarding?

Most startups should buy (SaaS) or compose (headless library) rather than build from scratch. Salesflare's co-founder reported onboarding took two months to build. SaaS works well pre-product-market-fit when speed matters most. Switch to a library once you've proven your flow and need design control at scale.
