## Title: Shepherd.js uses AGPL-3.0 — implications for commercial React apps

## URL: https://usertourkit.com/blog/migrate-shepherd-js-tour-kit

## Comment to post immediately after:

I wrote this after discovering the licensing situation around Shepherd.js, one of the most popular product tour libraries on npm (221K weekly downloads).

The core `shepherd.js` package is AGPL-3.0, but the React wrapper `react-shepherd` is MIT. AGPL obligations cascade through dependencies, so the MIT wrapper doesn't shield you. For SaaS products where users interact over a network, the copyleft kicks in.

Google bans AGPL internally. Open Core Ventures published a detailed analysis of why AGPL is a non-starter for most commercial companies (https://www.opencoreventures.com/blog/agpl-license-is-a-non-starter-for-most-companies).

There's also a technical concern: `react-shepherd` broke on React 19 for months because it accessed `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher`. The fix took until late January 2026 (issue #3102).

I built Tour Kit as an MIT-licensed alternative (headless, <8KB gzipped). The article is a step-by-step migration guide with before/after code. Disclosure: obvious bias since I built the alternative, but every data point is verifiable against npm and GitHub.

Curious whether others have run into AGPL issues with frontend dependencies. It seems like an underappreciated risk in the React ecosystem.
