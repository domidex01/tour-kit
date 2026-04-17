## Subreddit: r/reactjs

**Title:** I compared every open-source onboarding framework for React — here's what I found

**Body:**

I spent a week testing open-source onboarding options in a Vite 6 + React 19 + TypeScript 5.7 project. The biggest takeaway: most "best onboarding tools" lists mix tour libraries (tooltip renderers) with full onboarding frameworks, and the distinction matters.

**Tour libraries** (React Joyride, Driver.js, Shepherd.js, Intro.js) attach tooltips to DOM elements. They handle the "point at this button" part. That's it.

**Onboarding frameworks** coordinate the full lifecycle — tours, checklists, surveys, analytics, fatigue prevention. There are very few open-source options here.

Some things that surprised me:

- React Joyride still doesn't have a stable React 19 release (400K+ weekly downloads affected)
- Intro.js is AGPL v3, not truly free for commercial SaaS — many devs discover this after integration
- No single tour library handles checklists, surveys, or analytics — you end up wiring that yourself
- Shepherd.js is the most actively maintained legacy option (170+ releases, March 2026 latest)
- Driver.js at ~4KB gzipped is impressively small for what it does

I also built Tour Kit (bias disclosed), which takes a different approach — 10 composable packages covering tours, hints, checklists, surveys, announcements, analytics, and scheduling. MIT core, <8KB gzipped.

Full comparison with bundle sizes, licensing breakdown, and cost analysis: https://usertourkit.com/blog/best-open-source-onboarding-framework

Would love to hear what others are using. Are there open-source onboarding tools I missed?
