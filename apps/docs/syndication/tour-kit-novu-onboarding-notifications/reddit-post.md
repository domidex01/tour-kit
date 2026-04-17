## Subreddit: r/reactjs

**Title:** I wrote a guide on connecting product tour events to Novu for omnichannel onboarding notifications

**Body:**

I've been building Tour Kit, an open-source product tour library for React. One problem I kept running into: the tour teaches users something, then vanishes. If they don't come back, the lesson is wasted.

So I wired Tour Kit's analytics callbacks to Novu (open-source notification infrastructure, 36K+ GitHub stars). The idea: when a user completes a tour, Novu sends an in-app notification immediately, then an email 24 hours later if they haven't returned. Skip a step? Novu nudges them about the missed feature after 4 hours.

The integration boils down to a ~30 line analytics plugin that maps Tour Kit's `tour_completed`, `tour_skipped`, and `tour_abandoned` events to Novu workflow triggers. Novu handles the multi-channel routing, delays, and digest batching (so users don't get 5 emails if they finish 5 micro-tours in a row).

Key gotcha: Novu's Node SDK is server-only, so if your Tour Kit runs client-side you need an API route proxy. The guide covers both the server-side and client-safe versions.

Cross-channel onboarding apparently boosts retention by 130% vs 71% for in-app alone (Braze data), though your mileage will vary.

Full walkthrough with all TypeScript code: https://usertourkit.com/blog/tour-kit-novu-onboarding-notifications

Would love to hear if anyone else is doing omnichannel onboarding with open-source tools. What notification service are you using?
