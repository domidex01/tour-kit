## Thread (6 tweets)

**1/** 33% of SaaS companies don't have a welcome screen.

Meanwhile, 90% of users churn if they don't get value in week one.

That's a fixable gap.

**2/** Three patterns that actually work:

Segmentation: Notion asks "What will you use this for?" and customizes everything.

Action-first: Slack says "Reduce emails by 32%" + one-click team invite. Boosted activation 25%.

Progressive: Step indicators alone increase completion 22%.

**3/** The key stat: personalized welcome flows see 40% better retention than generic "Welcome!" greetings.

But keep it to 2-3 questions max. 72% of users bail if there are too many steps.

**4/** Most welcome screen guides target product managers with screenshots.

Nobody covers:
- How to actually build one in React
- Accessibility (ARIA dialog pattern)
- When to use a modal vs. a full page

So I wrote that guide.

**5/** Quick accessibility checklist for modal welcome screens:

- role="dialog" + aria-modal="true"
- Trap keyboard focus
- aria-labelledby for the title
- Return focus on close

Most implementations miss all four.

**6/** Full breakdown with comparison table (Slack, Notion, Pinterest, Asana, GA4), data sources, and a React component:

https://usertourkit.com/blog/what-is-welcome-screen-saas
