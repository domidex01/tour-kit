## Subject: Lighthouse audit of SaaS onboarding tools — for React Status / Frontend Focus

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a deep-dive on the Lighthouse performance cost of SaaS onboarding tools (Appcues, Pendo, WalkMe). The key finding: no vendor publishes their script payload size, and async loading moves the penalty from FCP (10% weight) to TBT + INP (40% combined weight).

The article includes comparison tables, a measurement methodology, and the Lighthouse 13 deprecation angle. Data is from the 2025 Web Almanac, Chrome Aurora team, and DebugBear.

Link: https://usertourkit.com/blog/onboarding-tool-lighthouse-performance

Thanks,
Domi
