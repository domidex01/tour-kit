## Title: No-code onboarding tools don't publish their bundle sizes — and other things I found researching the build vs buy decision

## URL: https://usertourkit.com/blog/no-code-vs-library-product-tour

## Comment to post immediately after:

I spent a few weeks researching the no-code vs library decision for product tours. Most existing content is written by no-code vendors (Appcues, Chameleon) or is too generic to be useful, so I tried to build a concrete framework based on team size.

The most interesting findings:

1. No major no-code onboarding vendor publishes their script payload size. Appcues, Userpilot, Chameleon, Pendo — none of them. You're injecting a third-party script and trusting it won't hurt your Core Web Vitals. Meanwhile, open-source libraries publish exact bundle sizes (React Joyride: 37KB, Shepherd.js: 25KB, Tour Kit: <8KB gzipped).

2. Accessibility with no-code tools is effectively unauditable. They inject DOM elements outside your framework's component tree, with ARIA attributes you can't control. MDN data shows pages with ARIA present average 41% more detected errors — not because ARIA is bad, but because ARIA done wrong is worse than no ARIA.

3. The pricing model creates a perverse incentive. All no-code tools charge per MAU, meaning your costs grow precisely when you succeed. Appcues starts at $300/month, Chameleon at $299/month, and Pendo ranges from $15k to $140k+/year.

4. Migration is expensive. ProductFruits estimates 2-4 weeks of manual tour rebuilding to leave any no-code platform. Analytics data stays behind.

Disclosure: I built Tour Kit (MIT-licensed React tour library), so I have a clear bias toward the library approach. But I tried to be honest about when no-code tools make sense — especially for teams with dedicated growth PMs who iterate weekly on onboarding flows.
