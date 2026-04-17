## Subreddit: r/reactjs

**Title:** I built step-level drop-off tracking for product tours — here's what the data shows

**Body:**

I've been working on analytics for product tours and went down a rabbit hole analyzing drop-off patterns. Chameleon published data from 550M tour interactions that has a fascinating finding: 4-step tours complete at 74%, but 5-step tours drop to 34%. One step is the difference between most users finishing and most users bailing.

The problem with most tour analytics is they only track completion rate. That's like tracking "page views" without knowing which page — you know the number but can't diagnose anything. Step-level tracking (fire a `step_viewed` event on every transition, then compare counts in a funnel chart) tells you exactly which step kills momentum.

A few things I found useful:

- **Time-on-step separates two problems.** A user who spends 2 seconds and leaves is uninterested. A user who spends 45 seconds and leaves is confused. Same drop-off, completely different fix.
- **Skip vs abandonment matters.** Clicking "Skip tour" is an intentional decision. Closing the tab is passive disengagement. Treating them the same hides the real issue.
- **Progress indicators boost completion by 12%.** Easiest win in onboarding.
- **"Invite your team" is the universal drop-off step.** If your tour includes a social action before users have seen value, that's almost certainly your worst-performing step.

I wrote up the full implementation with React code (using PostHog and Mixpanel for the funnel visualization): https://usertourkit.com/blog/product-tour-drop-off-tracking

What's your experience been with tour analytics? Anyone using a different approach to track step-level engagement?
