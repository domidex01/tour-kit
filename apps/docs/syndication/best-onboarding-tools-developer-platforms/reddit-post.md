## Subreddit: r/reactjs (primary), r/webdev (secondary)

**Title:** I compared 8 onboarding tools for developer platforms — here's what I found about bundle sizes and accessibility

**Body:**

I'm building a developer tool and needed onboarding. Tried 8 options (4 open-source libraries, 4 SaaS platforms) by building the same 3-step flow in each: API key setup, first-request walkthrough, sandbox prompt. All tested in Vite 6 + React 19 + TypeScript 5.7.

The bundle size range is wild. Driver.js comes in at ~5 KB gzipped. React Joyride is ~50 KB. The SaaS platforms (Appcues, Userpilot, Chameleon) inject 150-250 KB+ of JavaScript through their SDKs.

The accessibility situation is worse. I audited each for WCAG 2.1 AA compliance. None of the commercial platforms certify it. Most OSS libraries have partial keyboard navigation but skip focus trapping and ARIA live regions. Tour Kit (which I built, full bias disclosure) was the only one passing a full WCAG 2.1 AA audit, though it only supports React.

The biggest takeaway: developer tools need different onboarding than consumer SaaS. Your users will close a tooltip faster than they'll close a terminal. They want code snippets, not product videos. Most onboarding tools are designed for the opposite audience.

Quick data points:
- Tour Kit core: <8 KB gzipped, MIT, React 18/19
- Driver.js: ~5 KB gzipped, MIT, framework-agnostic, no React hooks
- Shepherd.js: ~30 KB, MIT, framework-agnostic, most mature OSS
- React Joyride: ~50 KB, MIT, React-only, pre-built UI
- SaaS platforms: $249-$300+/month starting, 150-250 KB+ SDKs

Full comparison table with TypeScript support, pricing, and decision framework: https://usertourkit.com/blog/best-onboarding-tools-developer-platforms

Happy to answer questions about the testing methodology or specific tools.
