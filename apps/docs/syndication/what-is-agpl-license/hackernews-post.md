## Title: What Is AGPL? Why License Choice Matters for Open-Source Libraries

## URL: https://usertourkit.com/blog/what-is-agpl-license

## Comment to post immediately after:

I wrote this after noticing how many JavaScript developers install AGPL-licensed packages without understanding the obligations.

The key issue: when you bundle an AGPL package into a React app, your bundler combines it into a single output. Whether that constitutes a "derivative work" is legally ambiguous. And unlike backend code where the "SaaS loophole" might apply, frontend JavaScript is *distributed* to browsers — triggering traditional copyleft obligations on top of AGPL's network clause.

Some data points: only ~3% of open-source projects use AGPL (2025 OSSRA report), and 62% of organizations have formal policies blocking it (Tidelift 2024). Google bans it company-wide. The practical result is measurable — Shepherd.js under AGPL gets 120K weekly npm downloads while the MIT-licensed React Joyride gets 520K+.

I build Tour Kit (MIT-licensed product tour library), so I have a perspective on the license choice tradeoff. The article tries to be balanced about when AGPL does and doesn't make sense. Self-hosted services like Nextcloud and Grafana are reasonable AGPL use cases. npm packages that get bundled into other people's apps are a harder sell.
