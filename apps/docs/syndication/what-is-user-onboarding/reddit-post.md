## Subreddit: r/reactjs

**Title:** Every "what is user onboarding" article is written for PMs. I wrote one for devs.

**Body:**

I was looking up user onboarding definitions while building an onboarding system and every single result was marketing content. "Guide users to value!" Sure, but what does onboarding actually look like in code?

It's four things running in parallel: state tracking (which flows has this user seen?), conditional logic (should we show this tour to this user right now?), rendering (portals, positioning, focus trapping, z-index), and measurement (are people actually completing these flows?).

The part that surprised me: search for "user onboarding WCAG" or "onboarding ARIA" and you get nothing. Zero results. Yet every tooltip in a product tour needs role="dialog", aria-label, and trapped focus. Almost none of the popular libraries handle this correctly out of the box.

Some numbers that changed how I think about it:
- 63% of customers say onboarding influences their subscription decision
- Tour completers convert to paid at 2.5x the rate of non-completers (Appcues 2024)
- Completion drops from 72% at 3 steps to 16% at 7 steps (Chameleon)
- 90% of users who don't get value in week one churn

Wrote it up with a React hook example and the three onboarding patterns that cover most SaaS apps: https://usertourkit.com/blog/what-is-user-onboarding

Curious if anyone else has hit the accessibility gap in onboarding tooling. What are you using?
