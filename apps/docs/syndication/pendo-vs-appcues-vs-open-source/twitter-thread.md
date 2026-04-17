## Thread (6 tweets)

**1/** Pendo's median contract: $48,463/year. Appcues Growth: $879/month at just 2,500 MAU. Open-source tour libraries: $0.

I compared all three approaches. Here's how to pick the right one for your team.

**2/** The real difference isn't features — it's who owns the code.

Pendo and Appcues inject 200-300KB of third-party JS at runtime. Open-source libraries compile into your bundle at 8-50KB.

That gap shows up in Lighthouse.

**3/** Three questions that decide for you:

- Who edits tours? (PMs → Appcues, devs → open source, analytics team → Pendo)
- Annual budget? (Under $1K → open source, $3K-$15K → Appcues, $25K+ → Pendo)
- Performance targets? (Core Web Vitals sensitive → open source)

**4/** The tradeoff with open source: no visual builder.

Every tour change goes through code + deploy. For teams shipping daily, that's fine. For monthly release cycles, it's friction.

**5/** Pendo's real play is analytics-with-guides, not guides alone. If you already run PostHog or Mixpanel, you're paying twice for event tracking.

Appcues' real risk is MAU pricing. Going from 5K to 50K users = 10x your onboarding bill for the same flows.

**6/** Full breakdown with comparison tables, code examples, and migration guides:

https://usertourkit.com/blog/pendo-vs-appcues-vs-open-source

(Disclosure: I built Tour Kit, one of the open-source options. All pricing data from Vendr, Featurebase, and vendor pricing pages.)
