---
'@tour-kit/react': patch
---

`TourCard` now lazy-loads `@tour-kit/media` (`React.lazy` + `Suspense`)
instead of importing it statically. Bundlers split the media stack into its
own async chunk, fetched only when a step with `media` first renders — tour
consumers without media steps no longer pay for it in their initial bundle.
The embed mounts one tick after the card; `@tour-kit/media` remains a regular
dependency so installed-case resolution keeps working in every bundler
(`webpackIgnore`-style optional imports would leave a bare specifier browsers
cannot resolve).
