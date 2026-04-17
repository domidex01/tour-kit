## Thread (6 tweets)

**1/** You added an onboarding tool. Your Lighthouse score dropped 15 points.

Nobody connected the two. Here's why it happens and what the actual numbers look like:

**2/** TBT carries 30% of the Lighthouse performance score.

The 2025 Web Almanac reports mobile median TBT is 1,916ms. Nearly 10x the 200ms target.

Third-party scripts are the #1 contributor.

**3/** We tried to find the script payload size for every major SaaS onboarding vendor.

Appcues? Not published.
Pendo? Not published.
WalkMe? Not published.
Whatfix, Userpilot, Chameleon, UserGuiding? None of them.

Every open-source library publishes theirs.

**4/** "Just load it async" is the vendor recommendation.

But async moves the cost from FCP (10% Lighthouse weight) to TBT + INP (40% combined).

You're moving the penalty to higher-weighted metrics. That's a worse trade.

**5/** How to measure it yourself:

1. Disable your onboarding tool
2. npx lighthouse --runs=5
3. Re-enable it
4. npx lighthouse --runs=5
5. Compare median TBT

Takes 15 minutes. The numbers might surprise you.

**6/** Full breakdown with comparison tables, code examples, and the Lighthouse 13 deprecation angle:

https://usertourkit.com/blog/onboarding-tool-lighthouse-performance
