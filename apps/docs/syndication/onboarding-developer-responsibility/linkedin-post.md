Who gets paged at 2am when the product tour breaks?

Not the PM who configured it. The developer.

I wrote about why onboarding should be treated as engineering-owned code, not a PM-configured SaaS tool. Three arguments:

1. The accountability gap: no-code tools let PMs push production changes without engineering review. When those changes cause regressions, nobody clearly owns the aftermath.

2. The compliance case: WCAG 2.1 explicitly scopes custom UI component accessibility to developers. Product tours are custom UI components. This isn't optional.

3. The cost reframe: "Build vs. buy" assumes building costs $50-150K. Open-source headless libraries like Tour Kit (<8KB gzipped) collapse that assumption entirely.

To be clear: PMs should own onboarding strategy. What to show, when, to whom. The argument is about implementation. Code that runs in production should be reviewed, tested, and owned by the team that gets paged when it breaks.

Full article: https://usertourkit.com/blog/onboarding-developer-responsibility

#react #webdevelopment #productmanagement #accessibility #opensource
