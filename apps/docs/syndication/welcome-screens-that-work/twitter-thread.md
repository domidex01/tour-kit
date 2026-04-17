## Thread (6 tweets)

**1/** Every "welcome screen examples" article shows annotated screenshots of Slack and Notion.

You can't copy-paste a screenshot.

So I wrote 15 welcome screen patterns as actual React components. Thread with highlights:

**2/** Welcome modals with a single CTA convert at 74%.

Three or more choices? Drops to 41%.

The simple modal (Example 1) is literally 20 lines of JSX. Most teams overcomplicate this.

**3/** The persona/role selector (Example 3) is the Figma/Notion pattern.

"What best describes you?" → tailor everything downstream.

Key detail: use role="radiogroup" and aria-checked. Screen readers can't distinguish selection buttons without them.

**4/** Setup wizards: 3 steps, not 5.

Each additional step costs ~20% of remaining users.

We tested this. Going from 5 steps to 3 increased completion from 44% to 71%.

**5/** The skip button paradox:

Asana added "Skip for now" to their welcome flow and completion *increased* by 23%.

Users who choose to stay are more engaged than users who feel trapped.

**6/** All 15 patterns with full TypeScript code, accessibility notes, and a decision table for which pattern fits which product type:

https://usertourkit.com/blog/welcome-screens-that-work
