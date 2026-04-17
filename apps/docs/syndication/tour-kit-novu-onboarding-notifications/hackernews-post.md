## Title: Connecting product tour events to Novu for omnichannel onboarding

## URL: https://usertourkit.com/blog/tour-kit-novu-onboarding-notifications

## Comment to post immediately after:

I built Tour Kit, an open-source product tour library for React, and kept running into the same problem: tours teach users something, then disappear. Cross-channel onboarding (in-app + email + push) retains users at roughly 2x the rate of in-app alone, but wiring up multiple notification channels is tedious.

This guide shows how to connect Tour Kit's analytics plugin system to Novu's notification API. The plugin maps tour lifecycle events (completion, skip, abandonment) to Novu workflow triggers. Novu handles the multi-channel delivery: immediate in-app notification, delayed email, digest batching.

The interesting technical detail: Novu's digest engine solves the notification fatigue problem. If a user completes 5 micro-tours in 30 minutes, they get one summary notification instead of 5 separate messages. The workflow definition lives in your repo as TypeScript, not in a dashboard.

Trade-offs worth noting: Novu's @novu/js SDK is 1.67 MB unminified (use the lighter @novu/node at 649 KB server-side). Self-hosted Novu requires MongoDB + Redis. And the free tier caps at 10K events/month, which covers ~1K MAU doing 3 tours each.
