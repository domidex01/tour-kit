## Thread (6 tweets)

**1/** Product tours vanish when users click "Done." If they don't come back, the lesson is wasted. I wrote a guide on connecting tour events to @novaborhq for omnichannel follow-up notifications.

**2/** The setup: a Tour Kit analytics plugin (~30 lines of TypeScript) maps tour_completed, tour_skipped, and tour_abandoned events to Novu workflow triggers. One novu.trigger() call fans out to in-app, email, SMS, push.

**3/** The interesting part: Novu's digest engine. If a user finishes 5 micro-tours in 30 minutes, they get ONE summary notification, not 5. Configurable time window in the workflow definition.

**4/** Cross-channel onboarding retains users at 2x the rate of single-channel (130% vs 71%, Braze data). But most teams wire the tour to one tool and email to another. The systems don't talk.

**5/** Novu is open-source (36K+ GitHub stars), free tier handles 10K events/month. Tour Kit is MIT. The whole setup costs $0 for early-stage apps.

**6/** Full guide with all TypeScript code, Novu workflow definitions, and API route proxy for client-side setups: https://usertourkit.com/blog/tour-kit-novu-onboarding-notifications
