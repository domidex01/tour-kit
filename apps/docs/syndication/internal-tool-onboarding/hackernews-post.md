## Title: Building product tours for internal tools with React

## URL: https://usertourkit.com/blog/internal-tool-onboarding

## Comment to post immediately after:

I wrote this because every product tour guide focuses on customer-facing onboarding, but internal tools have a completely different set of problems. Employees can't choose an alternative app, training happens during the most overwhelming week of their career, and the tool evolves while the documentation stays frozen.

The key insight was role-based tours. A sales team and a finance team use the same CRM but need completely different walkthroughs. Shipping one generic 15-step tour means nobody finishes it.

Some numbers that shaped the article: only 12% of US workers rate their company's onboarding favorably (Gallup), structured onboarding cuts time-to-competency from 8-12 months to 4-6 (SHRM), and the DAP market (WalkMe, Whatfix) is projected to hit $3.6B by 2032, mostly because enterprises are desperate for solutions here.

The code-owned approach (React library vs. no-code DAP) makes sense when your engineering team already builds the internal tool. You avoid the $10K-100K/yr licensing, the 200KB+ bundle injection, and the vendor lock-in. The tradeoff is you need a developer to create and maintain the tours.

Accessibility was the section I learned the most writing. Enterprise internal tools have legal obligations under ADA/Section 508, and most tour overlays break screen readers in ways automated testing doesn't catch.
