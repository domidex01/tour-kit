## Subreddit: r/reactjs

**Title:** I wired product tour callbacks to React Email — behavior-based onboarding emails with zero new infrastructure

**Body:**

I've been working on a product tour library (Tour Kit) and kept running into the same problem: users finish the tour, don't come back the next day, and everything we showed them is forgotten.

The fix turned out to be connecting tour lifecycle events to email. Tour Kit fires callbacks on step completion, skips, and abandonment. I routed those to a Next.js API route that picks a React Email template and sends it through Resend.

The interesting part is the behavior-based targeting. If someone skips the "Invite your team" step, they get an email about that specific feature. If they complete everything, they get a "here's what to try next" email instead. Cross-channel onboarding campaigns boost retention by ~130% vs 71% for in-app only (Braze data).

Some data points that shaped the approach:
- React Email is at 920K weekly npm downloads now
- Behavior-based email sequences convert 30% better than time-based drip schedules
- Welcome emails hit 50-70% open rates, dropping 3-5% per subsequent email
- 5-7 emails over 14 days seems to be the sweet spot

One gotcha: `@react-email/tailwind` pulls in 6.5 MB at build time. Server-side only, but still surprising.

Full write-up with all the code (email templates, Tour Kit callbacks, API route, cross-channel deduplication): https://usertourkit.com/blog/tour-kit-react-email-onboarding-emails

Curious if anyone else has connected their in-app onboarding to email sequences — what patterns worked for you?
