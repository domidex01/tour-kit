## Thread (6 tweets)

**1/** "Product tour" and "interactive walkthrough" mean different things depending on which vendor blog you read.

Navattic: "interactive tour" = external demo
Userpilot: "interactive walkthrough" = in-app actions

They literally contradict each other. Here's how to actually think about it:

**2/** Map two axes, not one:

- WHERE it lives: external vs. in-app
- HOW users advance: button-click vs. real action

In-app + passive = product tour
In-app + active = interactive walkthrough

**3/** Chameleon analyzed 15M product tour interactions:

- 61% average completion
- 3-step tours hit 72%
- Self-serve tours: 123% higher completion than auto-triggered
- Progress indicators: -20% dismissal rate

How you trigger matters more than passive vs. active.

**4/** The implementation difference is one property.

Same library, same tooltip rendering, same step config.

Add `advanceOn: { selector: '#button', event: 'click' }` and it switches from Next-button to action-driven advancement.

**5/** What no other article covers: the developer tradeoffs.

- UI drift: both patterns break when DOM selectors change
- Accessibility: WCAG 2.1 AA requires focus trapping, ARIA roles, aria-live
- Bundle cost: SaaS tools add 40-100KB. Headless libs: <8KB.

**6/** Full breakdown with comparison tables, code examples, and a decision framework:

https://usertourkit.com/blog/product-tour-vs-interactive-walkthrough
