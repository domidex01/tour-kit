## Channel: #articles or #testing in Reactiflux

**Message:**

Wrote up how we test product tours in CI/CD — the specific challenges are different from typical components (portal rendering, focus traps, localStorage persistence). Landed on a three-layer strategy with Vitest, Playwright, and axe-core that runs in under 90 seconds.

https://usertourkit.com/blog/test-product-tour-ci-cd

Curious if anyone else has dealt with testing tooltip positioning in jsdom (spoiler: getBoundingClientRect returns all zeros).
