## Title: Product tours for open-source projects: converting users to contributors

## URL: https://usertourkit.com/blog/product-tours-open-source-contributor-onboarding

## Comment to post immediately after:

I researched the contributor onboarding gap in open-source projects. The Homebrew funnel is typical: millions of users, thousands of contributors, tens of maintainers. Each stage loses 90%+ of participants.

GitHub's data shows measurable ROI for each onboarding layer (README = +55% productivity, CONTRIBUTING.md = +17%, Good First Issues = +13% contributors, mentorship = +46% productivity). But less than 1% of projects use interactive walkthroughs. Interesting gap.

The article covers building web-based codebase tours that live on your docs site, so potential contributors can understand the architecture before running git clone. Also addresses the AI slop problem — 36M new GitHub developers in 2025, many using AI tools to generate PRs, and why teaching quality standards before the first submission matters.

I built Tour Kit (the library used in the examples), so I'm biased on the implementation side. But the onboarding patterns and data apply regardless of which tool you use.
