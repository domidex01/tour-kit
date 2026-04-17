## Title: Tour Kit: What you get for free vs. $99 in an open-core React tour library

## URL: https://usertourkit.com/blog/tour-kit-free-vs-pro

## Comment to post immediately after:

I built Tour Kit, a headless product tour library for React. The most common question I get is whether you actually need the paid tier, so I wrote a detailed breakdown.

The three MIT packages (core, react, hints) include the full position engine, all accessibility features, router adapters, headless mode, and the complete component library. Under 25KB gzipped. No watermark or usage limits.

Pro ($99, one-time, not subscription) adds nine packages: analytics integration, onboarding checklists, product announcements, in-app surveys, feature adoption tracking, media embedding, time-based scheduling, and AI features. These are the things teams typically spend 20-40 hours building from scratch after the basic tour is working.

I compared the model to AG Grid (MIT Community + paid Enterprise at $999+/dev/year), MUI X ($180+/dev/year), and SaaS tools like Appcues ($249/mo+). The open-core approach felt right because the core tour functionality should be free, but the extended onboarding features have real engineering cost.

One thing that surprised me during research: Shepherd.js is AGPL, which means you'd need to open-source your entire application to use it in a distributed product. Most developers I talked to didn't know this.
