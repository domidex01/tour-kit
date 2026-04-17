# Why developers, not product managers, should own your onboarding code

## The accountability gap behind every broken product tour

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-developer-responsibility)*

Every no-code onboarding vendor pitches the same story: "Ship product tours in under an hour, no developers needed." It sounds great in a demo. Then three months later your Lighthouse score drops 15 points, screen readers can't navigate the tooltip overlay, and the PM who configured the tour has moved on to a different initiative. The developer gets the 2am page.

Onboarding isn't a configuration problem. It's a code problem. And code problems belong to developers.

## The accountability vacuum nobody talks about

No-code onboarding tools create a structural gap between who ships changes and who owns the consequences. PMs configure tours in a visual builder. Those tours inject third-party scripts into production. When the script causes a performance regression or breaks after a deploy, the PM doesn't get paged. The developer does.

ProductPlan put it plainly: "Product management may not feel the same level of ownership or accountability [for onboarding] as they do for other features." That's not a criticism of PMs. It's an observation about incentive structures.

PMs measure activation. Developers measure uptime, load times, and correctness. When those goals conflict, and they do every time a 200KB onboarding script lands on your marketing page, the developer's concerns lose. They're invisible until something breaks.

## The performance tax developers inherit

As of April 2026, the average page already loads 20+ external scripts totaling roughly 449KB of third-party JavaScript (HTTP Archive). Each additional onboarding tool adds 50KB to 500KB on top of that.

Google's own data shows that increasing page load from 1 second to 3 seconds drives a 32% bounce rate increase. And 79% of users who experience poor site performance won't come back.

No-code onboarding tools inject scripts at runtime. They bypass tree-shaking, your bundle analysis pipeline, and your performance budgets. The PM who added the tour never sees the cost. The developer who reviews the Lighthouse report does.

Compare that to a code-first library like Tour Kit, which ships at under 8KB gzipped. It tree-shakes. It's part of your build graph, your CI checks, your performance budgets.

## Accessibility compliance is structurally a developer problem

WCAG 2.1 Success Criterion 4.1.2 states: "This success criterion is primarily for web authors who develop or script their own user interface components."

Product tours are custom UI components. They create overlays, trap focus, auto-advance content, and intercept keyboard navigation. No-code tools rarely expose ARIA controls, focus management, or keyboard trap prevention to the PM configuring the tour. These are implementation details that require a developer who understands the DOM.

## The "build vs. buy" framing is outdated

The standard argument: building onboarding in-house costs $50,000 to $150,000. Buying a SaaS tool costs $200 to $1,000 per month.

But the framing ignores a third option: maintained open-source libraries that give you code ownership at near-zero cost. The real choice isn't "build vs. buy." It's "subscribe to a SaaS vendor and cede control, or use a maintained open-source library with full code ownership."

## Why someone might disagree (and where they're right)

Teams using no-code tools who iterate on onboarding weekly see 25% higher activation rates than those waiting for quarterly engineering sprints. That's real. But the root cause is sprint cadence, not ownership. A developer-owned codebase with good CI/CD and feature flags can ship onboarding changes just as fast.

Product managers should absolutely own onboarding strategy: what to show, when, to whom. The argument is about implementation. PMs define the experience. Developers build it reliably, accessibly, and performantly.

## What this means for your team

If you're a developer, onboarding already is your problem. The question is whether you control it proactively or inherit it reactively.

Proactive ownership means onboarding tours live in your codebase, versioned and tested. Accessibility is built in from the first step. Performance impact is visible in your CI pipeline.

Reactive inheritance means debugging why a third-party script broke after a framework upgrade. Explaining to legal why the product tour doesn't meet WCAG 2.1. Writing CSS overrides with !important to make vendor tooltips match your design system.

Full article with code examples and comparison table: [usertourkit.com/blog/onboarding-developer-responsibility](https://usertourkit.com/blog/onboarding-developer-responsibility)

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, The Startup*
