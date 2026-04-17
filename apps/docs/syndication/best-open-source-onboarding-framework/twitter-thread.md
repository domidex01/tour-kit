## Thread (6 tweets)

**1/** Most "best onboarding framework" lists mix tour libraries with SaaS platforms. They're written by vendors. Here's what I found testing every open-source option in a React 19 project:

**2/** The #1 confusion: tour libraries (tooltip renderers) vs onboarding frameworks (tours + checklists + surveys + analytics). Most devs start with a tour library, then spend months bolting on the rest.

**3/** React Joyride has 400K+ weekly npm downloads but no stable React 19 release. Intro.js is AGPL v3 (not free for commercial SaaS). Shepherd.js is the most actively maintained legacy option with 170+ releases.

**4/** Driver.js at ~4KB gzipped does one thing well. If you just need tooltips pointing at buttons, it's the right pick. But the moment you need checklists or surveys, you're building infrastructure.

**5/** The hidden cost: a senior engineer spending 40 hours/year wiring up checklists, surveys, and analytics on a bare-bones tour library = $6,000 in engineering time. SaaS alternatives start at $1,500/mo.

**6/** Full comparison with bundle sizes, licensing data, and a decision framework for choosing the right tool:

https://usertourkit.com/blog/best-open-source-onboarding-framework

(Bias disclosed: I built Tour Kit, one of the frameworks compared)
