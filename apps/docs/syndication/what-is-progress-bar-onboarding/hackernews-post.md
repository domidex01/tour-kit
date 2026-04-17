## Title: Progress bars in onboarding: ARIA, React, and the psychology of completion

## URL: https://usertourkit.com/blog/what-is-progress-bar-onboarding

## Comment to post immediately after:

Most articles about progress bars in onboarding target product managers. This one is aimed at the developer who has to actually build the thing.

A few data points I found interesting while researching: 78% of SaaS products now include progress indicators in onboarding flows (UserGuiding 2026). Adding them increases completion by 20-30% (UserPilot). But a meta-analysis of 32 experiments found that progress bars perceived as decelerating actually increase abandonment (Irrational Labs 2025). The animation pacing matters more than most developers realize.

The article covers the ARIA implementation (role="progressbar" with the right aria-value* attributes), five psychological principles behind why progress bars work (Zeigarnik effect, endowed progress, goal gradient, anchoring, perceived control), and when you should skip them entirely (branching flows, fewer than 3 steps, tasks under 10 seconds).

Includes React code examples with accessible implementations. Built with Tour Kit's checklists package, which handles the progress state and persistence, but the patterns apply to any setup.
