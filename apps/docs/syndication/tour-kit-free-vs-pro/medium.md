# Can You Use Tour Kit Without the Pro License?

## A package-by-package breakdown of what's free and what costs $99

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-free-vs-pro)*

Yes. Tour Kit's three core packages are MIT-licensed and free forever. You can ship production product tours, multi-step onboarding flows, and persistent feature hints without paying anything or hitting a usage cap.

We built Tour Kit, so take everything below with that context. Every claim maps to a specific package you can inspect on GitHub.

Tour Kit uses an open-core licensing model. The foundational packages (@tour-kit/core, @tour-kit/react, @tour-kit/hints) are MIT-licensed and free. Nine extended packages (analytics, checklists, surveys, announcements, media, scheduling, adoption, AI, license validation) require a one-time $99 Pro license. No MAU limits, no seat limits, no recurring fees.

**The free tier includes:** Multi-step tours with branching, element highlighting, keyboard navigation, WCAG 2.1 AA focus management, router-aware tours (Next.js, React Router), localStorage persistence, custom storage adapters, RTL/LTR support, headless mode, and shadcn/ui compatibility. All under 25KB gzipped.

**Pro adds:** Analytics integration (PostHog, Mixpanel, GA4), onboarding checklists with task dependencies, product announcements (5 display variants), in-app surveys (NPS, CSAT, CES), feature adoption tracking, media embedding, time-based scheduling, and AI-powered tour generation.

**When Pro becomes worth $99:** When you'd spend more than a few hours building the equivalent yourself. Developer time at US market rates runs $75-150/hour. If the analytics package saves you four hours of wiring up PostHog event callbacks, the math works.

The honest comparison: Appcues starts at $249/month. Over three years, that's $8,964 versus $99. But Appcues includes a visual builder and managed backend. Tour Kit requires React developers. If your team doesn't have them, Tour Kit isn't the right tool.

Full breakdown with code examples, comparison tables, and FAQ: [usertourkit.com/blog/tour-kit-free-vs-pro](https://usertourkit.com/blog/tour-kit-free-vs-pro)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
