## Subreddit: r/opensource (primary), r/reactjs (secondary)

### r/opensource

**Title:** I researched why most OSS contributors never make a second PR — here's what the data says about onboarding

**Body:**

I spent a while digging into the contributor onboarding problem for open-source projects. Mike McQuaid (Homebrew maintainer) describes the funnel: millions of users, thousands of contributors, tens of maintainers. The drop-off at each stage is brutal.

The data from GitHub's Octoverse is interesting:

- README = +55% productivity
- CONTRIBUTING.md = +17% productivity  
- Good First Issues (25% tagged) = +13% more new contributors
- Mentorship = +46% productivity, 3x culture health

But here's what stood out: almost nobody uses interactive walkthroughs. Less than 1% of projects. Every other onboarding element has measurable ROI, but the interactive layer is essentially untested at scale.

I wrote up a guide on using product tours for contributor onboarding, including the "AI slop" problem (36M new GitHub devs, many using AI to generate low-quality PRs) and why teaching quality standards before the first PR matters more than ever.

Full writeup with code examples and comparison table: https://usertourkit.com/blog/product-tours-open-source-contributor-onboarding

Curious if anyone has tried interactive onboarding for their OSS project. What worked? What didn't?

---

### r/reactjs

**Title:** Building interactive contributor onboarding tours for OSS docs sites (React + TypeScript example)

**Body:**

Wrote up a guide on embedding interactive product tours in open-source documentation sites for contributor onboarding. The idea: instead of a giant CONTRIBUTING.md, walk new contributors through the codebase, dev setup, and PR process step by step.

Includes working React/TypeScript code for a 4-step contributor tour, a checklist-based first contribution flow, and progressive engagement milestones (first PR → reviewer → maintainer).

The data is compelling: README files boost productivity 55%, contribution guidelines add 17%, mentorship adds 46%. Interactive tours combine all three signals but less than 1% of projects use them.

Code examples and full writeup: https://usertourkit.com/blog/product-tours-open-source-contributor-onboarding

Uses Tour Kit (which I built — full disclosure), but the patterns apply to any React-based docs site.
