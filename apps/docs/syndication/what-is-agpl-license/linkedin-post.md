Most developers never check the license field before running npm install.

That's fine 99% of the time — 92% of open-source projects use permissive licenses like MIT. But the other 8% can create real problems.

AGPL-3.0 requires you to share your source code when users interact with modified AGPL software over a network. For SaaS companies, that's every customer interaction. And when an AGPL package gets bundled into your React app, the "derivative work" question becomes legally ambiguous.

Some numbers worth knowing:
- Only ~4,200 of npm's 2.7M packages use AGPL
- Google bans AGPL company-wide (180K+ employees)
- 62% of organizations have formal policies blocking AGPL (Tidelift 2024)
- 30% of license conflicts come from hidden transitive dependencies (Black Duck 2025)

The practical impact is measurable: Shepherd.js under AGPL gets 120K weekly npm downloads. React Joyride under MIT gets 520K+. Same category, different license, different adoption curve.

AGPL makes sense for self-hosted services like Nextcloud and Grafana. For npm packages that get bundled into commercial apps, MIT remains the standard for a reason.

Full explainer with a risk matrix: https://usertourkit.com/blog/what-is-agpl-license

#opensource #javascript #react #webdevelopment #licensing
