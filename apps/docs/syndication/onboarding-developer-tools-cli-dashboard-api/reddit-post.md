## Subreddit: r/reactjs

**Title:** I wrote a guide on onboarding patterns for developer tools (CLI + dashboard + API as one flow)

**Body:**

I've been building onboarding flows for developer tools and noticed most guides only cover dashboard tours. But developers don't live in the dashboard. They switch between terminal, browser, and code editor constantly.

So I wrote up the patterns I've found work best for each surface:

**CLI:** First-run wizards that handle config interactively (Stripe's CLI is the gold standard here). The big one most teams miss: printing a deep-link URL after CLI setup that triggers a contextual dashboard tour, not the generic welcome flow.

**Dashboard:** Conditional tours based on how the developer arrived. If they came from the CLI, skip the steps they already completed. Also: hotspots beat sequential tooltip tours on dense config panels. We measured a 73% skip rate on generic 5-step tooltip tours by step 3.

**API:** You can't attach a tooltip to a REST endpoint, but you can shorten the path from "I have an API key" to "I made a successful call." The quickstart pattern that converts: install command, complete runnable file, expected output, next steps.

The key metric across all three: Time to First Call (TTFC). Stripe hits it in under 90 seconds. Developers who get there within 10 minutes are 3-4x more likely to convert to paid.

Full article with React code examples and an activation milestone table: https://usertourkit.com/blog/onboarding-developer-tools-cli-dashboard-api

Would love to hear how other teams handle cross-surface onboarding, especially the CLI-to-dashboard handoff.
