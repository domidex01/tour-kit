## Subreddit: r/reactjs

**Title:** I wrote up the patterns we used for onboarding both buyers and sellers in a React marketplace app

**Body:**

Been working on the onboarding architecture for a two-sided marketplace and thought the patterns might be useful for anyone dealing with multi-role apps.

The core problem: buyers and sellers need completely different first experiences, but most teams ship one generic tour and wonder why activation is low. 68% of new vendors abandon onboarding due to friction (Appscrip, 2026 data), and marketplace Day 30 retention is sitting at 8%.

What worked for us:

**Role detection at the provider level.** Instead of conditionals scattered through every component, we define separate step arrays for sellers vs buyers and swap them at the TourKitProvider based on the auth context. For users who are both buyer and seller (like on Etsy), we detect the active role from the current route.

**Progressive disclosure for sellers.** The biggest mistake is asking for everything upfront (tax forms, KYC, bank details, profile photos all at once). We broke it into 4 milestone-gated phases: signup (3 steps), first listing (contextual tooltips), verification (only after a listing exists), and improvement hints (week 2+). Each phase shows 3-4 steps max.

**Checklists with task dependencies.** Gating "connect payout" behind "create first listing" keeps sellers from getting lost. Clicking a checklist task launches the relevant tour. This cut "where do I go next?" support tickets by ~35%.

**Buyers get hints, not tours.** Buyer onboarding is mostly contextual beacons triggered by behavior (e.g., saved search hint after 3rd browse session), not a linear walkthrough.

I wrote it all up with TypeScript code examples and a comparison table of marketplace vs regular SaaS onboarding dimensions: https://usertourkit.com/blog/marketplace-app-onboarding-two-sided-tour-strategies

Curious if anyone else has dealt with the multi-role onboarding problem in React. What patterns did you land on?

---

## Subreddit: r/SaaS

**Title:** How we structured onboarding for a two-sided marketplace (68% of vendors abandon due to friction)

**Body:**

Spent the last few weeks digging into marketplace onboarding data and the numbers are rough: 68% of new vendors abandon due to friction, Day 30 retention for marketplace apps is 8%, and 80% of seller retention failures trace directly to onboarding (Gartner via UserGuiding).

The insight that changed our approach: marketplace onboarding isn't "SaaS onboarding times two." It's a fundamentally different architecture because you're managing two funnels that depend on each other.

Key patterns that moved the needle:

1. **Supply first.** Airbnb, Etsy, Uber all bootstrapped supply before demand. Seller onboarding should get 70% of your engineering investment because activated sellers create the value that retains buyers.

2. **Progressive disclosure over front-loading.** Don't ask for KYC, bank details, and tax forms on day one. Gate verification behind "first listing published" so sellers are already invested.

3. **Checklists as activation scaffolding.** Visible progress indicators ("3 of 6 steps complete") keep sellers returning to finish setup. Reduced support tickets by ~35% in our testing.

4. **Buyer onboarding is contextual, not a walkthrough.** Trust signals on first visit, discovery hints on sessions 2-3, education after first purchase.

Wrote up the full architecture with data, code examples, and a comparison of marketplace vs SaaS onboarding patterns: https://usertourkit.com/blog/marketplace-app-onboarding-two-sided-tour-strategies

Would love to hear how other marketplace founders are handling the chicken-and-egg onboarding problem.
