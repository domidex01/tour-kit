## Thread (6 tweets)

**1/** Your SaaS subscriptions cost $18K/year. But the real engineering cost? $82K.

I calculated the "developer tax" — the hidden overhead of third-party tools. Here's the breakdown:

**2/** The shadow bundle problem:

Onboarding widget: 45KB
Analytics: 30KB
In-app messaging: 60KB
NPS survey: 25KB

That's 160KB of JavaScript you can't tree-shake, audit, or profile. Calibre App recommends <300KB total per page.

Half your budget. Gone before your app renders.

**3/** Where the tax actually hides:

- Integration maintenance: 4h/month per tool
- Context switching: 100+ hours/year per dev (Lokalise)
- Vendor lock-in: 80% of software cost is post-launch (Okteto)

The subscription is 22% of the real cost.

**4/** The pattern I landed on:

Buy: Stripe, Clerk, Sentry (infrastructure you shouldn't build)

Own in code: product tours, surveys, announcements (user-facing UI that charges per MAU)

If it injects JS into your frontend and scales with your users, own it.

**5/** The 2026 wrinkle: AI tools are making it worse.

$20-100/month per AI subscription. Usage-based pricing. No IT visibility.

82% of IT pros report burnout from tool management.
44% would trade vacation days for simpler software.

(Freshworks 2026 survey, 2,001 respondents)

**6/** Full breakdown with the developer tax formula, comparison tables, and a buy-vs-own decision framework:

https://usertourkit.com/blog/saas-tool-developer-tax

(Disclosure: I build Tour Kit, an open-source tour library. The math applies regardless of which alternative you pick.)
