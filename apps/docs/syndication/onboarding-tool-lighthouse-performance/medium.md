*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-tool-lighthouse-performance)*

# The Hidden Performance Cost of Your Onboarding Tool

## How SaaS onboarding platforms affect Lighthouse scores and what to do about it

You added an onboarding tool. Your Lighthouse score dropped 15 points. Nobody connected the two events until a PM noticed the regression three sprints later.

SaaS onboarding platforms like Appcues, Pendo, WalkMe, and Userpilot inject third-party JavaScript that competes with your app for the browser's main thread. The cost is measurable. But here's the thing: no vendor publishes their script payload size.

## The numbers that matter

Lighthouse calculates your performance score from six weighted metrics. Total Blocking Time (TBT) carries 30% of the total weight. That single metric is the one most directly harmed by third-party JavaScript.

The 2025 Web Almanac reports the median mobile page has a TBT of 1,916ms. That's nearly 10x the 200ms target. Third-party scripts are a major contributor.

The Chrome Aurora team found that a Google Tag Manager container with 18 tags increases TBT nearly 20x. An onboarding tool running initialization logic, element polling, and overlay rendering generates comparable work.

## The vendor transparency problem

We tried to find the actual script payload size for every major SaaS onboarding tool. Open-source libraries like Driver.js (~5 KB), React Joyride (~25 KB), and Shepherd.js (~35 KB) publish their sizes on npm and bundlephobia.

Appcues, Pendo, WalkMe, Whatfix, Userpilot, Chameleon, and UserGuiding? Not published. Every one loads from a vendor CDN with no public size documentation.

## Async loading is not a fix

Vendors recommend async loading as the solution. It helps initial paint metrics (FCP, LCP). But the JavaScript still executes on the main thread after load, hitting TBT (30% weight) and INP (10% weight).

You're moving the penalty from a 10% metric to a 40% combined weight. That's a worse trade.

## What you can do

Run this test on your own app: disable your onboarding tool, run 5 Lighthouse passes, re-enable it, run 5 more. Compare the median TBT specifically.

Client-side libraries avoid the third-party overhead entirely. They ship as part of your bundle with zero additional network requests. The tradeoff: your developers write code instead of using a visual builder.

Full article with comparison tables and measurement methodology: [usertourkit.com/blog/onboarding-tool-lighthouse-performance](https://usertourkit.com/blog/onboarding-tool-lighthouse-performance)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
