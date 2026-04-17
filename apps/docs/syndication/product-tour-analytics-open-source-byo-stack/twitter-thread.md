## Thread (6 tweets)

**1/** Appcues charges $249/mo for tour analytics. Pendo starts at $800+/mo. What if you could get the same metrics for $0?

I compared 4 open-source stacks for product tour analytics. Here's what I found:

**2/** Stack 1: PostHog (self-hosted or cloud)

- 1M free events/month
- Full funnels, retention, session replay
- MIT licensed
- Needs 16 GB RAM to self-host

Closest thing to replacing Amplitude for tour analytics.

**3/** Stack 2: Plausible + Umami

Plausible: ~1 KB, no cookies, GDPR-ready. Good for "did they finish?"
Umami: MIT, deploys to Vercel, gives you direct SQL access to event data.

Neither has funnels. Both cost $0 self-hosted.

**4/** Stack 3: Roll your own

navigator.sendBeacon() + a database table + one SQL query.

Tour completion rate without any third-party scripts. Total control.

**5/** The cost gap at 10K MAU:

Appcues: $2,988/yr
Chameleon: $3,348/yr
Pendo: $10,000+/yr

PostHog cloud: $0/yr
Self-hosted: $480-960/yr
Custom API: $0/yr

The tradeoff: you build dashboards yourself.

**6/** Full breakdown with TypeScript plugin code, comparison tables, and the 5 metrics actually worth tracking (spoiler: "tours started" is a vanity metric):

https://usertourkit.com/blog/product-tour-analytics-open-source-byo-stack
