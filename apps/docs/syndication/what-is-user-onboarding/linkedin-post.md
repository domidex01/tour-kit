Every "what is user onboarding" definition is written for product managers. None answer the question developers actually have.

For engineers, onboarding is a state management problem: tracking flow completion, conditionally rendering UI, persisting progress across sessions, and making sure a screen reader can navigate the whole thing.

The accessibility gap is the most surprising part. Search "user onboarding WCAG" and you'll find nothing. Yet every onboarding tooltip needs role="dialog", focus trapping, and keyboard dismissal.

Some numbers that shape how I think about this:
- 63% of customers say onboarding influences subscription decisions
- Completion drops from 72% (3 steps) to 16% (7 steps)
- 90% of users who don't get value in week one churn

Wrote the developer-oriented definition with a React hook example and the three patterns that cover most SaaS apps:

https://usertourkit.com/blog/what-is-user-onboarding

#react #javascript #webdevelopment #useronboarding #accessibility
