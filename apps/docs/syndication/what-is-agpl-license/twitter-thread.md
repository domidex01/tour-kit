## Thread (6 tweets)

**1/** Only ~4,200 of npm's 2.7M packages use AGPL. But one in your dependency tree can trigger source code disclosure for your entire SaaS app.

Here's what AGPL actually requires and why it matters for JS developers:

**2/** AGPL-3.0 = GPL + "network use" clause. If users interact with your modified AGPL code over a network, you must share your complete source.

92% of open-source projects use permissive licenses (MIT, Apache). AGPL sits at ~3%.

**3/** The JavaScript twist: when you bundle an AGPL package into your React app, your bundler combines it into one output.

Is that a "derivative work"? Lawyers disagree. And frontend JS ships to browsers, so you're distributing it in the traditional GPL sense too.

**4/** Real adoption impact:

Shepherd.js (AGPL): ~120K weekly npm downloads
React Joyride (MIT): 520K+ weekly downloads

Google bans AGPL company-wide. 62% of orgs have formal policies blocking it.

**5/** AGPL makes sense for self-hosted services (Nextcloud, Grafana, Mastodon).

It's a harder sell for npm packages that get bundled into other people's applications. The bundling = derivative work question has no settled answer.

**6/** Before you `npm install`, check the license field.

Full explainer with risk matrix for different AGPL scenarios: https://usertourkit.com/blog/what-is-agpl-license
