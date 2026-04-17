## Title: The open-source business model for developer libraries

## URL: https://usertourkit.com/blog/open-source-business-model-developer-libraries

## Comment to post immediately after:

I'm the author. I built a React library (product tours/onboarding) as a solo developer and had to figure out how to sustain it financially.

The article compares the three models that actually work for developer libraries in 2026: open core, dual licensing, and open-source SaaS. Some findings:

- Open core works best for frontend libraries because your product runs in someone else's app (no server to host = no SaaS model). The "buyer-based segmentation" framework from Open Core Ventures was the most useful mental model: features for individual contributors stay free, features for managers/executives go paid.

- Dual licensing (AGPL + commercial) creates friction for React libraries specifically because most users are building proprietary apps. The React BSD+Patents controversy in 2017 is still the clearest example of how restrictive licensing backfires.

- The tooling for actually selling licenses has improved a lot. Polar.sh handles key generation + payments for 4% + 40c per transaction. Two years ago you'd have been building a custom Stripe integration.

I went with open core, $99 one-time for the extended packages. The article covers what I'd do differently (define the free/paid boundary earlier, don't build your own payment system).

Happy to discuss any of this — particularly interested in hearing from other library maintainers who've tried different approaches.
