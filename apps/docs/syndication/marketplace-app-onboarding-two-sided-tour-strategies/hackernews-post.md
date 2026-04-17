## Title: Marketplace App Onboarding: Two-Sided Tour Strategies (2026)

## URL: https://usertourkit.com/blog/marketplace-app-onboarding-two-sided-tour-strategies

## Comment to post immediately after:

I've been working on onboarding architecture for two-sided marketplaces and wrote up the patterns that seem to work.

The data is striking: 68% of new vendors abandon onboarding due to friction (Appscrip, 2026), marketplace Day 30 retention is 8%, and 80% of seller retention failures trace to the onboarding process itself (Gartner). The core architectural problem is that buyers and sellers need completely different activation flows, but most teams build one generic tour.

The article covers: role detection at the React provider level (separate step graphs per role), progressive disclosure for seller flows (milestone-gated phases instead of front-loading KYC/tax/banking), checklists with task dependencies as activation scaffolding, and why buyer onboarding should be contextual hints rather than linear tours.

One finding I thought was interesting: Airbnb, Etsy, and Uber all bootstrapped supply before demand. The implication for product tours is that seller onboarding should get ~70% of your engineering investment because activated sellers create the value that retains buyers automatically.

I also couldn't find any marketplace onboarding content that addresses WCAG accessibility, which seems like a gap given the complexity of multi-step seller verification flows.

Happy to discuss the architecture trade-offs. The progressive disclosure pattern in particular has some interesting edge cases around multi-session state persistence.
