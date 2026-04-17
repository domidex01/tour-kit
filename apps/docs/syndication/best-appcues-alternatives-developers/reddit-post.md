## Subreddit: r/reactjs (primary), r/SaaS (secondary)

**Title:** I compared 7 Appcues alternatives for React teams — here's what I found

**Body:**

I was looking into Appcues alternatives after realizing the pricing scales faster than expected ($249/mo at 2,500 MAU, custom quotes at 10K+). Figured other React devs might be in the same boat, so I did a side-by-side comparison of seven options.

The main things I compared: bundle size (or script weight for SaaS tools), React 19 compatibility, WCAG 2.1 AA accessibility, and pricing.

Quick findings:

- Appcues injects a ~180 KB third-party script outside your React tree. Custom CSS is gated behind their Growth plan.
- React Joyride has 603K weekly downloads but still uses class components — no React 19 path.
- Shepherd.js is solid but AGPL-licensed, meaning your app needs to be open-sourced unless you buy a commercial license.
- Driver.js is tiny (5 KB) but it's vanilla JS with direct DOM manipulation — no React integration.
- Flows.sh is interesting if you want managed infrastructure with a real developer API.
- OnboardJS is headless open source with a $59/mo SaaS option for analytics.

I also included Tour Kit in the comparison — full disclosure, I built it. It's a headless React library (8 KB gzipped, MIT). I tried to be fair about the tradeoffs: no visual builder, smaller community, younger project.

Full breakdown with comparison table and code examples: https://usertourkit.com/blog/best-appcues-alternatives-developers

Happy to answer questions about any of these tools. What's everyone else using for product tours in React?
