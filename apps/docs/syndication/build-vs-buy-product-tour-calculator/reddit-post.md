## Subreddit: r/reactjs

**Title:** We calculated 3-year TCO for three product tour approaches — the results surprised us

**Body:**

I spent a week pulling cost data from Appcues, Pendo, Userpilot, and industry reports to figure out what product tours actually cost across three approaches: building from scratch, using an open-source library, and paying for SaaS.

The short version:

- DIY from scratch: $70K-$85K year one, $142K over three years. Maintenance alone is $25K/year.
- Headless library (disclosure: I built one called Tour Kit): $18K-$36K year one, $48K over three years.
- SaaS (Appcues, Pendo, etc.): $6K-$54K year one, but $36K-$99K+ over three years depending on MAU count.

The crossover point is around 25K MAUs. Below that, SaaS is genuinely cheaper. Above it, per-MAU pricing starts compounding and the library approach pulls ahead.

The data point that surprised me most: IBM research shows maintenance consumes 50-75% of total software costs. Atlassian's internal onboarding build hit $3M over three years, growing from 3 to 7 dedicated engineers.

I included the actual TCO formulas so you can plug in your own hourly rate and MAU count. Also covered the qualitative stuff the math doesn't capture: design control, vendor lock-in, performance overhead (SaaS tools inject 40-150KB of scripts), and accessibility ownership.

Full breakdown with comparison tables and code examples: https://usertourkit.com/blog/build-vs-buy-product-tour-calculator

Curious what approach others have taken and whether these numbers match your experience.

---

## Subreddit: r/SaaS

**Title:** The real cost of build vs buy for product tours — $3M Atlassian case study and TCO formulas

**Body:**

I pulled together cost data for three approaches to product tour onboarding: building from scratch, using a headless library, and paying for SaaS platforms like Appcues or Pendo.

Key findings:

- Year one favors SaaS for small teams ($6K-$54K vs $70K-$85K DIY)
- By year three, the picture flips above 25K MAUs because per-user pricing compounds
- Pendo's average annual contract is ~$48K/year. At 50K MAUs, that's $99K+ over three years
- Atlassian spent $3M over three years building onboarding internally, scaling from 3 to 7 people

I also found that nobody frames "headless library" as a third category. Every build-vs-buy article is binary. But a headless library gives you code ownership without the full DIY maintenance burden.

Full analysis with TCO formulas you can plug your own numbers into: https://usertourkit.com/blog/build-vs-buy-product-tour-calculator

Disclosure: I built Tour Kit, an open-source headless tour library, so I'm biased toward the library approach. All numbers are sourced.
