## Subreddit: r/opensource (primary), r/reactjs (secondary), r/indiehackers (secondary)

**Title:** I spent months figuring out how to monetize an open-source React library. Here's what actually works in 2026.

**Body:**

I'm a solo developer who built a React library (product tours / onboarding). After the initial excitement of stars and downloads, I had to figure out how to not go broke maintaining it.

I looked at the three main models:

- **Open core** — MIT core, proprietary extended features. This is what GitLab and SonarQube do. The key insight from Open Core Ventures: segment by buyer type, not by effort. Features for individual devs stay free. Features for VPs and product teams go paid.

- **Dual licensing** — AGPL + commercial. Works for databases and engines. Doesn't work well for React UI libraries because most users are already building proprietary apps. Remember when Facebook tried BSD+Patents on React? The Apache Foundation banned it, WordPress dropped React. Restrictive licensing backfires even when you're dominant.

- **Open-source SaaS** — Full open source, sell hosting. The Postiz solo dev hits $14.2k/mo this way. But if your library runs inside someone else's app (like a React hook), there's no server to host.

The tooling has gotten much better. Polar.sh handles license keys and payments for 4% + 40c per transaction. GitHub Sponsors is 0% fee for personal accounts.

My five rules after going through this:
1. Free tier must be genuinely complete, not crippled
2. Never reclassify a free feature as paid
3. Price for the buyer (VP with budget), not the builder
4. License validation at build time, never runtime
5. Open source your business decisions too, not just code

Full article with code examples and a pricing tier breakdown: https://usertourkit.com/blog/open-source-business-model-developer-libraries

Curious what models others here are using. Anyone tried something besides these three?
