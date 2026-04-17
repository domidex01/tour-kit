## Title: Comparing 8 onboarding tools for developer platforms: bundle sizes from 5 KB to 250 KB+

## URL: https://usertourkit.com/blog/best-onboarding-tools-developer-platforms

## Comment to post immediately after:

I've been building a developer tool and hit the onboarding question every dev platform faces: do you use a library or a SaaS platform?

I tested 8 options by building the same 3-step flow (API key setup, first request, sandbox) in each. The results surprised me in two ways:

1. Bundle size variance is extreme. Driver.js is 5 KB gzipped. Appcues injects 200 KB+. When your dev tool already loads Monaco Editor (~2 MB), that 200 KB matters more than you'd think for perceived performance.

2. Accessibility is an afterthought across the board. I couldn't find a single commercial platform that certifies WCAG 2.1 AA compliance for their onboarding UI. Most open-source libraries have partial keyboard navigation but skip focus trapping and screen reader announcements.

Full disclosure: I built Tour Kit, one of the tools in the comparison. I've tried to be transparent about its limitations (React-only, no visual builder, smaller community). The comparison table includes all the data points so you can make your own judgment.

The article also references the Smashing Magazine case study on platformOS's award-winning onboarding approach, which offered three parallel routes for different technical levels. That pattern is worth stealing for any developer platform.
