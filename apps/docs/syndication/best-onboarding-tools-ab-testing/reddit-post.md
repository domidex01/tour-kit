## Subreddit: r/reactjs

**Title:** I tested 7 onboarding tools that claim built-in A/B testing. Here's what each one actually lets you do.

**Body:**

I spent a week comparing onboarding tools that advertise A/B testing capabilities. The gap between marketing and reality is pretty wide.

Quick findings: Pendo caps you at 2 variants per experiment. Appcues doesn't have control groups yet (listed as "coming soon"). UserGuiding locks A/B testing behind a $349/month plan. Chameleon is doing something interesting with AI-generated variants, but it's Growth tier only.

The thing that surprised me most: not a single tool mentions WCAG 2.1 AA compliance for experiment variants. You could be A/B testing two versions of a tour and one of them is completely inaccessible to screen reader users.

On the developer experience side, most tools are no-code visual builders aimed at product teams. If you want experiments defined in code (type-safe, version-controlled, testable in CI), your options are basically Statsig (pure experimentation engine, you build the onboarding UI) or Tour Kit (headless React library with accessibility baked in, which I built, so take that with appropriate skepticism).

Firebase just launched A/B testing for the web in March 2026 too. Free tier, zero restrictions. But adds ~35KB to your bundle.

Bundle sizes across the board: Tour Kit core <8KB gzipped, Statsig SDK ~12KB, Firebase ~35KB, SaaS platforms 40-60KB each.

Full comparison with pricing table: https://usertourkit.com/blog/best-onboarding-tools-ab-testing

Happy to answer questions about any specific tool.
