## Subreddit: r/reactjs

**Title:** I wrote up how to track product tour step-by-step drop-off with Mixpanel funnels

**Body:**

I've been building product tours in React and the biggest blind spot was always: do users actually finish the tour? And if they drop off, where?

Mixpanel's funnel reports turned out to be a good fit because they track ordered event sequences. The setup is: fire a `tour_step_completed` event on each step transition, then build a funnel in Mixpanel's dashboard that shows conversion between steps.

The interesting finding from testing: in a 5-step onboarding tour, the "invite teammates" step had a 38% drop-off. Users weren't ready to invite during onboarding. Moving it to a separate nudge after onboarding recovered about 22% of completions.

Some useful data points:
- Mixpanel free tier handles 1M events/month, so a 5-step tour with 3 events per step at 10K MAU is only 150K events
- `mixpanel.time_event()` gives you automatic step duration tracking without manual timestamps
- Identified funnels let you segment by user plan, and the difference was significant (67% completion for free vs 89% for paid users)

One gotcha: if your tour events fire out of order (React useEffect race condition), Mixpanel silently drops them from the funnel. Took a while to debug that one.

Full article with code examples and the analytics adapter pattern: https://usertourkit.com/blog/mixpanel-product-tour-funnel

I used Tour Kit (a headless tour library I'm building) for the tour side, but the Mixpanel integration pattern works with any tour library.
