## Title: Why we open-sourced our React library under MIT, not AGPL or BSL

## URL: https://usertourkit.com/blog/why-we-open-sourced-tour-kit-mit-not-agpl-bsl

## Comment to post immediately after:

I built Tour Kit, a headless product tour library for React with 10 composable packages. This post covers the licensing decision and why I went with MIT + paid extensions instead of AGPL dual-licensing (like Shepherd.js does) or BSL.

The data that shaped the decision: every company that switched to BSL or SSPL got forked within days to weeks (OpenTofu in 5 days, Valkey in 30 days). 83% of enterprises migrated away from Redis after the RSALv2 change. HashiCorp ended up acquired by IBM for $6.4B rather than growing independently. Elastic reversed their SSPL decision in August 2024.

AGPL has a different problem for libraries specifically — Google bans it company-wide, and the dual-licensing model (free AGPL core + paid commercial license) creates friction that shows up after developers have already invested time evaluating.

The open core model I went with: 3 MIT packages (core, react, hints) that work as a complete product tour library on their own, plus 8 proprietary packages (analytics, checklists, surveys, etc.) with a one-time fee. About 99% of users will never pay — that's the tradeoff.

Curious to hear from others who've faced similar decisions, especially for libraries vs. infrastructure.
