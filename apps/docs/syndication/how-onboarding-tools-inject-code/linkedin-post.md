Every SaaS onboarding tool asks you to paste a script tag into your app. What happens next?

We profiled five platforms (Appcues, Pendo, WalkMe, Userpilot, Chameleon) running on a production-grade Next.js app. On pages where no onboarding flow was active, we still measured 180-340ms of additional main thread blocking per page load.

That's invisible in your bundle analysis. webpack-bundle-analyzer won't show it. Only Lighthouse audits with third-party attribution will surface it.

The security story is worse. These tools can't use Subresource Integrity because they push silent CDN updates. Some require unsafe-inline CSP exceptions. The Polyfill.io attack (100k sites compromised) demonstrates the identical threat model.

The alternative exists: npm-installed libraries that compile into your bundle. No extra network requests. Version-pinned. Zero CSP exceptions. Part of your React component tree instead of a parallel DOM observer.

Full analysis with performance data, security breakdown, and audit instructions:
https://usertourkit.com/blog/how-onboarding-tools-inject-code

#webperformance #javascript #react #security #saas #productdevelopment
