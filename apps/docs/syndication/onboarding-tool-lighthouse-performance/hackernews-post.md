## Title: The Performance Cost of Onboarding SaaS Tools: A Lighthouse Audit

## URL: https://usertourkit.com/blog/onboarding-tool-lighthouse-performance

## Comment to post immediately after:

I wrote this after noticing that no SaaS onboarding vendor (Appcues, Pendo, WalkMe, Whatfix, Userpilot, Chameleon, UserGuiding) publishes their client-side script payload size. Every open-source alternative does.

The key findings: TBT carries 30% of the Lighthouse score and is the metric most sensitive to third-party JS. The 2025 Web Almanac shows mobile median TBT at 1,916ms (10x the target). The Chrome Aurora team found a GTM container with 18 tags increases TBT 20x.

The async loading advice vendors give is actually counterproductive from a Lighthouse scoring perspective. It moves the penalty from FCP (10% weight) to TBT + INP (40% combined). And Lighthouse 13 deprecated the dedicated third-party code audit, which means the cost is now harder to attribute even though the metrics still capture it.

I work on Tour Kit (an open-source product tour library), so I'm not a neutral observer. The data comes from the HTTP Archive, Chrome Aurora team research, and DebugBear case studies.
