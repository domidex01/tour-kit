## Subreddit: r/reactjs (also r/webdev)

**Title:** We measured how SaaS onboarding tools affect Lighthouse scores. No vendor publishes their script size.

**Body:**

I spent some time researching the performance impact of third-party onboarding tools (Appcues, Pendo, WalkMe, Whatfix, Userpilot) on Lighthouse scores. The findings were interesting enough to write up.

The short version: TBT carries 30% of the Lighthouse performance score, and it's the metric most directly harmed by third-party JavaScript. The 2025 Web Almanac reports the median mobile TBT is 1,916ms (nearly 10x the 200ms target). Third-party scripts are a major contributor.

The thing that surprised me most: no SaaS onboarding vendor publishes their client-side script payload size. Every open-source tour library (React Joyride, Shepherd.js, Driver.js) publishes theirs on npm and bundlephobia. The SaaS tools all load from vendor CDNs with zero public size documentation.

Also worth noting: async loading doesn't fix the problem the way vendors suggest. It moves the cost from FCP (10% Lighthouse weight) to TBT + INP (40% combined weight). That's actually a worse trade from a scoring perspective.

If you want to measure the impact on your own app: disable your onboarding tool, run `npx lighthouse --runs=5`, re-enable it, run 5 more passes, compare the median TBT.

Full writeup with comparison tables and the Lighthouse 13 deprecation angle: https://usertourkit.com/blog/onboarding-tool-lighthouse-performance

Disclosure: I work on Tour Kit (an open-source product tour library), so I have a perspective here. The data points are from the Web Almanac, Chrome Aurora team, and DebugBear, not our own benchmarks.
