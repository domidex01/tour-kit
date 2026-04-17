## Thread (6 tweets)

**1/** No-code onboarding tools are technical debt in disguise.

Your PM sets up Appcues. Six months later: broken tooltips, CSS in a dashboard nobody can find, and the person who configured it just quit.

Here's why code-first onboarding wins for developer teams:

**2/** Problem #1: CSS overrides live in a vendor dashboard.

Outside version control. Outside code review. Outside your CI pipeline.

Every UI update risks breaking your tours — and you won't know until a customer screenshots the mess.

**3/** Problem #2: Knowledge silos.

The PM who configured your onboarding flows leaves. Nobody else knows the targeting rules or A/B test variants.

Code-owned onboarding lives in your repo. Git blame tells you who wrote it and why.

**4/** Problem #3: The "build vs buy" framing is a false binary.

Custom build: ~$55K/yr
SaaS tool: $12K-$50K/yr
Code-first library: 1 sprint, no subscription

The vendors never write that third column. Wonder why.

**5/** This doesn't mean no-code is always wrong.

Zero frontend devs? Appcues works.
Non-technical operators? SaaS handles permissions.

But if you have React developers and a product you'll maintain for years — the no-code path accumulates debt that code-first avoids.

**6/** Full article with comparison table, cost data from vendor sources, and code examples:

https://usertourkit.com/blog/no-code-onboarding-technical-debt

(Disclosure: I built Tour Kit, an open-source alternative. Bias acknowledged, sources linked.)
