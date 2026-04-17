## Thread (6 tweets)

**1/** Every "how to evaluate onboarding tools" article is written for product managers. None cover what engineers actually care about: bundle size, TypeScript quality, testability, vendor lock-in.

So I built an 8-criterion scoring checklist. Here's what I found:

**2/** Criterion that surprised me most: accessibility.

The POUR+ framework (2026 academic paper) is the first a11y evaluation model designed for sequential onboarding flows.

A real-world prototype scored 2.9/5. Most tools fail on Personalisation (pause, skip, pacing) entirely.

**3/** Bundle size gap is staggering:

- Tour Kit: <20KB gzipped
- React Joyride: ~37KB
- Shepherd.js: ~28KB
- Appcues (SaaS): ~180KB

SaaS tools that inject external scripts add 100-200KB to your initial load. Run Lighthouse before and after installing any tool.

**4/** Two criteria that zero existing checklists include:

1. Testability: Can you programmatically control tours in Playwright/Cypress?
2. Vendor lock-in: Can you export tour definitions? What happens when you cancel?

If you can't test it, you can't refactor it safely.

**5/** The evaluation process: build the same 5-step tour in each tool, score each criterion 1-5, weight 1-3x by priority.

Takes ~4 hours per tool. The cost of choosing wrong and migrating later is measured in weeks.

**6/** Full checklist with code examples, comparison tables, and a blank scorecard template:

https://usertourkit.com/blog/onboarding-tool-evaluation-checklist

(Disclosure: I built Tour Kit, so I'm biased. The checklist works for evaluating any tool.)
