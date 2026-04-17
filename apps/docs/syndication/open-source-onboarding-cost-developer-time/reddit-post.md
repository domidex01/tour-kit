## Subreddit: r/reactjs

**Title:** I calculated the actual cost of using "free" product tour libraries — the numbers surprised me

**Body:**

I've been building onboarding systems for React apps and recently sat down to figure out what open source tour libraries actually cost in developer time (not license fees).

The short version: at US dev rates ($70-$150/hr), a typical integration takes 40-80 hours. Monthly maintenance runs 5-10 hours for selector updates, framework patches, and bug workarounds. That's $10,000-$20,000 in year one for a "free" library.

Some data points that stood out during research:

- Userpilot's build-vs-buy analysis puts startup onboarding builds at ~$60,000 (2-month timeline including design and PM)
- The 2024 Tidelift report found 60% of OSS maintainers work unpaid, and 44% cite burnout
- Shepherd.js has an open React 19 compatibility issue (#3102) as of April 2026
- React-Shepherd's repo is no longer maintained separately
- Enterprises underestimate software costs by 2x-4x according to the Software Pricing Guide

The hidden cost nobody talks about is what I'm calling the "feature creep timeline" — month 1 you need tours, month 3 analytics, month 6 checklists. Each addition means another library or custom build.

To be fair: React Joyride is genuinely great for MVPs and simple tours. 600K+ weekly downloads for good reason. The cost argument only applies when your requirements grow beyond basic tooltips.

Full breakdown with comparison table (open source vs SaaS vs code-owned): https://usertourkit.com/blog/open-source-onboarding-cost-developer-time

Disclosure: I build Tour Kit, an open source onboarding library. The article includes our numbers too, and we're honest about our tradeoffs (no visual builder, React 18+ only, smaller community).

Curious if others have tracked their actual time spent maintaining tour/onboarding libraries?
