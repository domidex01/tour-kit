## Subreddit: r/javascript (or r/webdev)

**Title:** TIL only ~4,200 npm packages use AGPL, but one in your dependency tree can trigger source code disclosure for your entire app

**Body:**

I've been researching open-source licensing for a side project and was surprised by how misunderstood the AGPL license is among JavaScript developers.

The short version: AGPL-3.0 requires you to share your source code when users interact with modified AGPL software over a network. For SaaS apps, that's basically always. And here's the part that surprised me — JavaScript delivered to a browser is *distributed* code, so the "SaaS loophole" that AGPL was designed to close doesn't even apply to frontend bundles. You're distributing in the traditional GPL sense too.

Some numbers that stood out:
- Only ~3% of open-source projects use AGPL (92% use permissive licenses like MIT)
- Google bans AGPL company-wide across all 180K+ employees
- 62% of organizations have formal license policies where AGPL is on the "do not use" list (Tidelift 2024)
- 30% of license conflicts come from hidden transitive dependencies in node_modules (Black Duck 2025)

The most interesting example: Shepherd.js (product tour library) uses AGPL-3.0 with dual licensing. It has ~120K weekly downloads. React Joyride, which does similar things under MIT, pulls 520K+. The license choice measurably affects adoption.

I wrote up a full explainer with a risk matrix for different AGPL scenarios (bundling vs separate service, etc.): https://usertourkit.com/blog/what-is-agpl-license

What's your team's approach to license auditing in node_modules? Do you use any automated tooling?
