## Title: The metrics that Appcues, Userpilot, and Pendo track (and what's missing)

## URL: https://usertourkit.com/blog/metrics-appcues-userpilot-pendo-track

## Comment to post immediately after:

I tested the analytics capabilities of three onboarding tools (Appcues, Userpilot, Pendo) and found the gap between what they claim and what you can actually query is significant.

The short version: Pendo is the only one with retroactive analytics and autocapture, but it costs a median $48K/year (Vendr data) and refreshes data hourly. Appcues only tracks events inside its own flows. Userpilot is the middle ground but the dashboard UX struggles under load.

The more interesting finding was what none of them track: survey fatigue accumulation across a user's lifecycle, cross-mechanism correlation (did the checklist or the banner drive adoption?), complete AARRR/HEART framework mapping, and their own performance impact on Core Web Vitals.

Disclosure: I maintain User Tour Kit, an open-source onboarding library, so I have a perspective on code-owned analytics as an alternative. The article includes a comparison table and code examples. Happy to discuss methodology or be challenged on any of the findings.
