## Subreddit: r/reactjs

**Title:** We wired Formbricks surveys to fire after product tour completion — here's the glue code

**Body:**

We needed to collect feedback right after users finish onboarding tours in our React app. The timing matters — asking "how was the tour?" 2 seconds after completion gets way better response rates than emailing a survey later.

We used Tour Kit (headless tour library) + Formbricks (open-source survey tool, 11.8K GitHub stars). The integration is about 40 lines of TypeScript:

1. Formbricks SDK initializes in a provider component
2. Tour Kit's `onComplete` callback calls `formbricks.track('tour_completed')`
3. Formbricks checks if any survey matches that action and shows it

Three things bit us in production:

- **Formbricks SDK is async** — if the tour completes before the SDK finishes loading, the track call silently fails. We added a typeof guard.
- **2-second delay is the sweet spot** — showing the survey instantly felt jarring. Formbricks has a delay setting in the dashboard.
- **Handle dismissals separately** — Tour Kit has distinct `onComplete` and `onDismiss` callbacks. We fire different survey actions for each (completers get CES, dismissers get a single "what made you close it?" question).

Both tools are open source and free to self-host. The whole stack runs without any SaaS subscriptions if you host Formbricks yourself.

Full writeup with all the code: https://usertourkit.com/blog/tour-kit-formbricks-in-app-surveys

Disclosure: I built Tour Kit. Formbricks is an independent project.
