## Title: Product tour completion rates: 4 steps = 74%, 5 steps = 34%

## URL: https://usertourkit.com/blog/product-tour-drop-off-tracking

## Comment to post immediately after:

I've been building analytics tooling for product tours and dug into Chameleon's published benchmark data (550M tour interactions). The most striking finding: adding a single step to a 4-step tour cuts completion from 74% to 34%.

The article walks through building step-level drop-off tracking in React — firing `step_viewed`/`step_completed` events on each transition, then visualizing the funnel in PostHog or Mixpanel. The goal is moving beyond binary "completed/not completed" to knowing exactly which step loses users.

Time-on-step turned out to be the most underrated metric. A 2-second step exit means disinterest; a 45-second exit means confusion. Same drop-off rate, completely different remediation. Most tour analytics tools don't surface this distinction.

Honest caveat: this uses Tour Kit (which I'm building), but the event schema and funnel analysis patterns work with any analytics setup that supports custom events.
