## Title: The Open-Source Onboarding Stack: Composing Tours, Analytics, and Surveys from Libraries

## URL: https://usertourkit.com/blog/open-source-onboarding-stack

## Comment to post immediately after:

I wrote this as a reference guide for teams evaluating whether to buy a SaaS onboarding platform (Appcues, Pendo, Userpilot) or assemble their own from open-source tools.

The key finding: nobody frames open-source onboarding as a composable stack. Every comparison lists tools in isolation. But the real decision is architectural — you're picking a guidance layer (tour library), an analytics layer (PostHog, Plausible), a feature flags layer (PostHog, GrowthBook), and a feedback layer (surveys). These can be wired together the same way you'd compose a JAMstack.

Some specific data points from the research:

- React Joyride has 400K+ weekly npm downloads but hasn't been updated in 9 months and is incompatible with React 19
- Building onboarding from scratch: $60K for a startup, up to $3.5M/3yr for enterprise (Atlassian)
- A single SaaS onboarding script tag adds 150-400KB to your bundle; the full open-source stack (Tour Kit + PostHog SDK) ships under 55KB gzipped
- No mainstream tour library advertises WCAG 2.1 AA compliance

Disclosure: I built Tour Kit, which features prominently in the article. The cost data comes from Userpilot's published analysis, and all bundle sizes are verifiable on bundlephobia.

Happy to answer questions about the architecture or the specific library comparisons.
