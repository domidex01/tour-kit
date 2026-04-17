## Title: What is Net Promoter Score? The developer's version, with SaaS benchmarks and React code

## URL: https://usertourkit.com/blog/what-is-nps

## Comment to post immediately after:

Most NPS explainers are written for product managers or marketers. This one covers it from the implementation side: the scoring formula, current SaaS benchmarks (average +36, B2B specifically +29), and when to actually trigger the survey in-app.

The timing detail that surprised me during research: in-app NPS surveys get 20-40% response rates versus 5-15% for email (Refiner.io data). But you have to trigger after onboarding completes and wait for 3+ sessions. Asking during a product tour interrupts the flow and gives you garbage data.

Also worth noting: NPS adoption is declining. Only 23% of enterprise CX leaders still use it as their primary metric (CMSWire/Forrester, 2025). The 0-6 detractor range groups someone mildly disappointed with someone who actively dislikes your product, and cultural norms create a 15-20 point scoring variance across regions.

Full disclosure: I built User Tour Kit (the library in the code examples). The NPS explainer and benchmarks stand on their own regardless of what library you use.
