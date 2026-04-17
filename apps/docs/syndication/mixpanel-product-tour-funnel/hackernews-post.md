## Title: Funnel analysis for product tours with Mixpanel

## URL: https://usertourkit.com/blog/mixpanel-product-tour-funnel

## Comment to post immediately after:

I've been working on measuring product tour effectiveness in React apps and wrote up the approach I landed on using Mixpanel funnels.

The core idea: fire ordered events on each tour step transition, then build a Mixpanel funnel that shows exactly where users drop off. Mixpanel's time_event() gives you automatic step duration tracking, and identified funnels let you segment by user cohort.

The most interesting finding from testing was that the "invite teammates" step in our onboarding tour had a 38% drop-off, higher than any other step. Moving it to a post-onboarding nudge recovered 22% of completions. The lesson: sequential onboarding tours shouldn't include collaborative actions.

Also worth noting the economics: Mixpanel's free tier handles 1M events/month. A 5-step tour with 3 events per step uses only 15 events per user session, so at 10K MAU you're using about 15% of the free allocation.

The tour implementation uses Tour Kit (my project, headless React), but the Mixpanel adapter pattern is library-agnostic.
