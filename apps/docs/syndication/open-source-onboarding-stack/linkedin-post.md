Most SaaS teams pay $3,000-8,000/month for onboarding tools like Appcues or Pendo. Building in-house costs $60K+ for a startup.

There's a third option that nobody talks about: the open-source onboarding stack.

Instead of one monolithic platform, you compose libraries for each layer:
- Tour library for guidance (<8KB gzipped)
- PostHog for analytics and feature flags
- Formbricks or built-in surveys for feedback
- Your own UI components for rendering

Total bundle: under 55KB. A single SaaS script tag adds 150-400KB.

The tradeoff is honest: you need React developers, there's no visual tour builder, and you're responsible for maintenance. But you own the code, the data, and the deployment.

I wrote the complete reference architecture with library comparisons, cost analysis, and code examples:

https://usertourkit.com/blog/open-source-onboarding-stack

#react #opensource #productdevelopment #saas #webdevelopment
