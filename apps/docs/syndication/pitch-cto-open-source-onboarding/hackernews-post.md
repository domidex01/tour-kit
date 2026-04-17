## Title: The cost math for replacing SaaS onboarding tools with open-source libraries

## URL: https://usertourkit.com/blog/pitch-cto-open-source-onboarding

## Comment to post immediately after:

I put this together after going through the actual process of pitching our CTO on dropping a $48K/year onboarding SaaS (Pendo-tier pricing) in favor of an open-source React library.

The surprising finding: the strongest argument wasn't developer experience or bundle size. It was the three-year TCO comparison. SaaS onboarding tools at 10K MAU run $115K-$160K+ over three years (with 5-20% annual renewal uplifts). An MIT-licensed library costs one sprint of integration and $0/month ongoing.

The second strongest argument was security posture. SaaS onboarding tools inject third-party JavaScript from an external CDN into your production app. You can't audit what data the script reads, you can't pin a version, and if the CDN is compromised, your users are exposed. For SOC 2 or HIPAA shops, this is increasingly flagged in audits.

The article covers seven specific CTO objections with data-backed responses, the common mistakes that kill the pitch (leading with ideology instead of math, asking for full migration instead of a spike), and a one-page pitch template.

Disclosure: I built Tour Kit, one of the libraries mentioned. The framework is library-agnostic though.
