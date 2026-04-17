## Subreddit: r/reactjs

**Title:** I wrote up exactly what you get for free vs paid in Tour Kit's open-core model (with the actual math on when paid makes sense)

**Body:**

I maintain Tour Kit, a headless product tour library for React. We get asked constantly whether you need the Pro license, so I put together a detailed breakdown.

Short version: the three MIT packages (@tour-kit/core, @tour-kit/react, @tour-kit/hints) ship the full tour engine, all hooks, every component, router adapters for Next.js and React Router, headless mode, keyboard nav, focus management, and persistence. Under 25KB gzipped total. No watermark, no trial period, no feature gates.

Pro ($99 one-time) adds nine packages for analytics integration, onboarding checklists, product announcements, in-app surveys, media embedding, scheduling, adoption tracking, and AI features. The honest take: if you just need tours and hints, Free is enough. Pro becomes worth it when you'd spend more than a few hours building the equivalent (analytics plumbing, checklist state machines, survey fatigue prevention, etc.).

I also compared the pricing model to AG Grid, MUI X, Appcues, Pendo, React Joyride, and Shepherd.js. The Shepherd.js AGPL situation surprised some people in earlier threads.

Full article with comparison tables and code examples: https://usertourkit.com/blog/tour-kit-free-vs-pro

Happy to answer questions about the architecture, the licensing decisions, or anything else.
