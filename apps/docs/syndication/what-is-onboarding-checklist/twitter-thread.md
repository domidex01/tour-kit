## Thread (6 tweets)

**1/** The average onboarding checklist completion rate across 188 SaaS companies is 19.2%.

Median is even worse: 10.1%.

I dug into the data and built an accessible React implementation. Here's what I found:

**2/** Company size matters more than you'd think:

$1-5M revenue: 27.1% completion
$10-50M revenue: 15.0%

Why? Smaller teams keep checklists to 3-5 tasks. Bigger teams let every PM add their feature until the checklist becomes a product roadmap.

**3/** Industry gaps are wild too:

FinTech: 24.5%
Healthcare: 20.5%
MarTech: 12.5%

The pattern: regulated industries force tighter task scoping because compliance demands focus.

**4/** Three things that actually move the number:

- Keep it to 4-7 tasks (Miller's Law)
- Collapsible, not modal (+123% completion)
- Connect checklist items to contextual tours (+21%)

**5/** The thing nobody talks about: accessibility.

W3C says progress indicators need role="progressbar" with aria-valuenow. Task items need keyboard focus. Completions need screen reader announcements.

I couldn't find a single onboarding tool article that covers any of this.

**6/** Full breakdown with benchmarks, comparison table, and a 40-line accessible React component:

https://usertourkit.com/blog/what-is-onboarding-checklist
