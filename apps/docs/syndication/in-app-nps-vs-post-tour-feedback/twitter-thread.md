## Thread (6 tweets)

**1/** Most product tours ask NPS right after completion. That's the wrong survey at the wrong moment.

NPS measures loyalty. A user who finished onboarding 12 seconds ago hasn't formed a loyalty opinion. Here's the timing framework that actually works:

**2/** The survey type-to-moment mapping:

- CES (effort score) → right after a tour step ("how easy was that?")
- CSAT → at tour completion ("rate this experience")
- NPS → 14-30 days later, then every 90 days

Transactional surveys fire close to the event. Relationship surveys wait.

**3/** The "honeymoon effect" is real.

Users score NPS 8-9 fresh off a good tour. Two months later, half have churned. Your NPS dashboard was green the entire time.

Fix: defer NPS to value realization. Use CSAT for the immediate post-tour signal.

**4/** In-app survey response rates: 20-40%
Email survey response rates: 5-15%

But in-app carries a risk: interrupting workflows. For developer-facing products, breaking deep focus takes 15-20 minutes to recover from.

Trigger on navigation transitions, never mid-task.

**5/** The gap nobody talks about: survey fatigue during onboarding.

Users are already learning new navigation and concepts. Adding a survey on top increases abandonment of the onboarding flow itself.

Rule: suppress all surveys while a tour is active.

**6/** Full guide with React code examples for event-driven survey triggers, fatigue prevention, and accessible survey widgets:

https://usertourkit.com/blog/in-app-nps-vs-post-tour-feedback
