## Subreddit: r/SaaS

**Title:** I broke down what onboarding tools actually cost at 2K, 10K, and 50K MAUs. The growth penalty is real.

**Body:**

I spent a few hours pulling together actual pricing data for every major onboarding SaaS tool (Appcues, Pendo, Userpilot, Chameleon, UserGuiding) because I was curious how the costs scale.

The short version: they all use per-MAU pricing, and the math gets rough fast. At 2,000 MAUs you're paying $69–$600/month depending on vendor. At 10,000 MAUs it's $299–$1,667/month. Pendo's median enterprise contract is $48,500/year according to Vendr's data from 530 real purchases.

The structural problem is that the vendor's revenue scales with your user count, not your revenue. If you're running a freemium product, you're paying to onboard free users who may never convert. One documented case: a company grew from 3K to 30K MAUs, their onboarding bill jumped 10x, but revenue only doubled.

I did this research because I build an open-source onboarding library (so obvious bias), but the pricing data stands on its own. Sources are all public: vendor pricing pages and Vendr marketplace.

Curious if anyone here has dealt with onboarding tool bill shock after a growth phase. What did you do?

Full breakdown with comparison table and cost projections: https://usertourkit.com/blog/mau-pricing-onboarding-tool
