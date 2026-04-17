# How to Choose Between Pendo, Appcues, and an Open-Source Onboarding Library

*A decision framework with real pricing data*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/pendo-vs-appcues-vs-open-source)*

Three paths, three tradeoffs. Pendo gives you analytics-first onboarding with enterprise pricing. Appcues gives you a no-code builder with MAU-based billing. Open-source libraries hand you full control at zero recurring cost.

The right pick depends on who edits your tours and how much you're willing to pay per active user.

I built Tour Kit as an open-source option, so factor that bias into everything below. Every number is verifiable against public sources.

## The quick version

Pendo fits enterprise teams with $25K+ budgets who need combined analytics and in-app guidance. Appcues fits product managers who want a visual builder at $3,000-$18,000 per year. Open-source libraries fit engineering-led teams who want sub-10KB bundles and predictable costs.

As of April 2026, Pendo's median contract sits at $48,463/year (Vendr marketplace data), Appcues Growth starts at $879/month for 2,500 MAU, and Tour Kit ships at under 8KB gzipped with an MIT license.

## Three questions that decide for you

**Who edits tours?** If it's PMs who don't write code, use Appcues. If it's developers, use open source. If it's a product analytics team that also wants guides, use Pendo.

**What's your annual budget?** Under $1,000/year, open source is the only realistic option. $3,000-$15,000/year puts you in Appcues territory. Over $25,000/year opens up Pendo or Appcues Enterprise.

**Does performance matter?** Pendo's agent script adds roughly 300KB to page weight. Appcues adds around 200KB. Open-source libraries that compile into your bundle tree-shake to 8KB or less.

## The tradeoffs nobody talks about

Pendo's in-app guides are secondary to its analytics product. You're paying enterprise rates for analytics that happen to include tours. If you already run PostHog or Mixpanel, you're duplicating spend.

Appcues tours look like Appcues tours. CSS overrides help, but matching a custom design system means fighting the tool. And MAU pricing means your bill grows with success.

Open-source means no visual builder. Every tour change requires a code change and a deploy. For teams that ship daily, that's fine. For teams with monthly release cycles, it's friction.

The full breakdown with comparison tables, code examples, and migration guides is on the Tour Kit blog.

---

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
