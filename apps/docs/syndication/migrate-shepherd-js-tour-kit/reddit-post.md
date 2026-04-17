## Subreddit: r/reactjs

**Title:** Shepherd.js uses AGPL-3.0 — here's what that means for your SaaS app and how to migrate off it

**Body:**

I've been building product tours in React for a while and recently dug into the licensing situation around Shepherd.js. Wanted to share what I found because it caught me off guard.

Shepherd.js core (`shepherd.js` on npm) is AGPL-3.0. The React wrapper (`react-shepherd`) is MIT, which makes it look safe — but AGPL obligations cascade through dependencies. If your SaaS product ships Shepherd.js and users interact with it over a network, the copyleft kicks in. You either open-source your frontend or buy a commercial license ($50-$300 depending on tier).

Google outright bans AGPL-licensed software internally. A FossID analysis documented how this pattern (MIT wrapper around AGPL core) creates "licensing time bombs" that companies don't discover until legal review.

On top of that, `react-shepherd` had a months-long React 19 compatibility gap because it accessed `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher`, which React 19 moved. Issue #3102 was open from mid-2025 through January 2026.

I wrote up a migration guide for moving to Tour Kit (MIT, headless, <8KB gzipped core). The key difference: Tour Kit is React-native (hooks + context) rather than a vanilla JS library with React bindings. So React upgrades don't break it.

The migration covers converting step definitions, event callbacks, multi-page persistence, and cleanup. A 10-step tour takes about 15-20 minutes to convert.

Full article with before/after code: https://usertourkit.com/blog/migrate-shepherd-js-tour-kit

Disclosure: I built Tour Kit, so take this with skepticism. Happy to answer questions about either library.
