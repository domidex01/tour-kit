## Subreddit: r/opensource (primary), r/reactjs (secondary)

**Title:** I built a React library with 10 packages. Here's why I chose MIT over AGPL and BSL, with data from HashiCorp, Redis, and Elastic.

**Body:**

I spent months building a headless product tour library for React. When it came time to pick a license, the decision took about fifteen minutes, but only because I spent weeks studying what happened to every company that went the other direction.

The short version: every company that switched from a permissive license to BSL or SSPL got forked. HashiCorp switched Terraform to BSL in August 2023 and OpenTofu launched within 5 days. Redis went to RSALv2 in March 2024 and Valkey now has 19.8K GitHub stars with 83% enterprise migration. Elastic reversed their SSPL decision entirely in August 2024. None of them achieved the stated revenue goal.

AGPL has a different problem. Google bans it company-wide. Shepherd.js (a direct competitor of mine) uses AGPL for the core with a commercial license for any revenue-generating use. The react-shepherd wrapper is MIT, but it depends on the AGPL core. Developers discover this wall after building their proof of concept, not before.

I went with MIT for the core + proprietary extensions for the premium packages. Three packages free forever, eight paid. The license boundary follows the value boundary: a solo dev building a side project doesn't need an analytics pipeline, but a team onboarding 50K users does.

The tradeoff is real — about 99% of users will never pay. But restricting usage to capture more revenue has a terrible track record for libraries with zero switching costs.

Full writeup with a license comparison table and the complete data: https://usertourkit.com/blog/why-we-open-sourced-tour-kit-mit-not-agpl-bsl

Happy to discuss the open core model tradeoffs — it's not perfect, but it's the one that doesn't poison adoption.
