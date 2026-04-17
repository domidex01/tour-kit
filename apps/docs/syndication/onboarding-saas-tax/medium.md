# The $3.6B Onboarding Tax: How SaaS Tools Extract Developer Value

## The hidden cost engineering teams absorb every time product buys a new tool

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-saas-tax)*

SAP paid $1.5 billion for WalkMe in June 2024. Not for the code. Not for the team. For access to the enterprises already locked into WalkMe's proprietary adoption scripts.

That acquisition wasn't an anomaly. It was a price tag on a business model: sell onboarding to product managers, then bill engineering teams for the integration work that never ends.

As of April 2026, the combined digital adoption platform and onboarding software market sits around $3.6 billion annually. The DAP segment alone is valued between $1.59 billion and $3 billion depending on which research firm you ask. Add the standalone onboarding software segment at roughly $550 million, plus the PLG tooling layer that wraps around both, and the total crosses $3.6 billion with room to spare.

That's $3.6 billion flowing from engineering budgets into vendor pockets. And the developers doing the integration work don't get a say in the purchase.

---

## Who pays the onboarding tax

The onboarding SaaS tax isn't a subscription fee. It's the engineering hours, performance budget erosion, and recurring migration sprints that accumulate invisibly in every team that integrates a third-party onboarding tool. Product managers sign the contract, but developers absorb the cost over months and years of maintenance work that nobody tracks against the tool's ROI.

Here's how the money actually moves. A product manager evaluates Pendo, Appcues, or Userpilot. They see a demo. The vendor's sales team quotes a price: $300/month for Appcues Start, $299/month for Userpilot's entry tier, or $48,000/year average for Pendo. The PM signs the contract.

Then the ticket hits engineering.

The developer installs a script tag, wires up event listeners, maps user properties, configures tour triggers, and debugs CSS conflicts with the existing design system. That "30-minute setup" the vendor promised in the demo turns into two weeks of integration work. And it recurs every quarter when the vendor pushes an update, every six months when you upgrade React, and every year when someone on the product team decides to switch from Pendo to Userpilot because the pricing changed.

Pendo pulled in $200 million in revenue in 2024 and secured a $100 million credit facility in September 2025. That revenue comes from somewhere. It comes from the engineering hours your team spends maintaining an integration that could have been 200 lines of owned code.

---

## Where $3.6 billion actually goes

As of April 2026, the onboarding market splits into three segments: digital adoption platforms ($1.6B-$3B), standalone onboarding software (~$550M), and the PLG tooling layer (~$500M+). None of these segments prioritize developer experience, because in every case the buyer is a product manager while the maintainer is an engineer.

**Digital adoption platforms** ($1.6B-$3B) — WalkMe (SAP), Whatfix, Apty. What developers get: proprietary scripts, vendor CSS, zero tree-shaking.

**Onboarding software** (~$550M) — Appcues, Userpilot, Chameleon. What developers get: no-code builders that generate code developers can't modify.

**PLG tooling layer** (~$500M+) — Pendo, Amplitude, Mixpanel (onboarding features). What developers get: analytics SDKs at 30-60KB each, limited export.

Every segment shares the same structural problem: the buyer isn't the user. Product managers buy onboarding tools. Developers maintain them.

This misalignment is why 65% of total software costs happen after the original deployment. Your subscription fee? Smallest part of the bill. Real cost lives in engineering hours that nobody tracks against the tool's ROI.

And the performance cost compounds silently. SpeedCurve's research shows pages with third-party scripts enabled can hit Largest Contentful Paint times of 26.82 seconds, compared to under 1 second without them. Twenty external scripts is the average. Stack an onboarding tool, an analytics tracker, and an NPS survey widget together, and they'll consume half of a 300KB JavaScript budget before your application renders a single component.

---

## The counterargument: onboarding tools save engineering time

The $3.6 billion market exists because onboarding tools solve a genuine problem: product managers need to ship activation flows without filing engineering tickets, and building from scratch is expensive. Userpilot estimates $3.5 million for an enterprise-grade system. Even a startup version costs $60,000 for a designer and developer working two months. Most teams shouldn't build their own onboarding from zero.

Product managers genuinely need to ship onboarding flows without waiting for engineering sprints. No-code builders exist because the feedback loop between "we need a tooltip here" and "a developer will get to it in two weeks" is too slow for companies iterating on activation metrics.

And the data these platforms collect is real. PLG companies using self-serve onboarding reached value 18.3% faster and reduced customer acquisition costs by 30-50% compared to non-PLG peers.

Nobody's arguing that onboarding tools don't create value. They do.

But does $3.6 billion of value need to flow through vendor lock-in and proprietary scripts? Or could most of it be delivered through open, composable libraries that developers actually control?

---

## What this means for engineering teams

The onboarding tool market is heading toward the same unbundling that hit content management systems in the 2010s, when headless CMS tools let developers reclaim their architecture without removing content teams from the workflow.

Here's what engineering teams can actually do:

**Audit the real cost.** Track how many engineering hours your team spends on onboarding tool integration, maintenance, CSS overrides, and migration over a quarter. Compare that to the subscription price. The ratio will surprise you.

**Separate the concerns.** Onboarding logic (step sequencing, progress tracking, conditional display) is a solved problem in 200-400 lines of TypeScript. Analytics integration? Also solved. Your design system already handles UI rendering.

**Own the core, rent the periphery.** Use open-source libraries for tour logic and rendering. Use your existing analytics stack for tracking. Give product managers a config-driven approach instead of a no-code builder.

Full disclosure: I built User Tour Kit as an open-source alternative to proprietary onboarding tools. So yes, I have a stake in this argument. Tour Kit doesn't have a visual builder. It requires React developers. It won't replace Pendo for a product team with zero engineering support.

But for engineering teams already frustrated with vendor CSS conflicts, bundle bloat, and annual migration sprints, the math is changing. The onboarding tax is a choice, not a cost of doing business.

The question every engineering lead should ask: is your team paying the onboarding tax because the tool creates irreplaceable value, or because nobody's done the math on what it actually costs?

---

*Full article with code examples and market data sources: [usertourkit.com/blog/onboarding-saas-tax](https://usertourkit.com/blog/onboarding-saas-tax)*

*Suggested Medium publications: JavaScript in Plain English, Better Programming, The Startup*
