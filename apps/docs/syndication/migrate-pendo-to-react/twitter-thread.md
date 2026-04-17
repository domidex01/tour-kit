## Thread (6 tweets)

**1/** Pendo costs $40K-$80K/year. If you're a React team only using it for product tours, here's how to migrate to code-owned components in a few hours.

**2/** The migration is mechanical: Pendo stores guides as CSS selectors + HTML content + targeting rules. All three map directly to React component props. Export via their API, convert to JSX, done.

**3/** Some numbers that pushed us to migrate:

- Pendo's script: 54KB on every page
- Replacement: <8KB gzipped, tree-shakeable
- Full data export: requires $100K+/yr Ultimate tier
- WCAG compliance: Pendo says "in process"

**4/** The process in 6 steps:

1. Export guide configs from Pendo's REST API
2. Install React tour lib alongside Pendo
3. Rebuild guides as components (one at a time)
4. Convert targeting to React conditionals
5. Migrate badges to hint components
6. Remove Pendo after one sprint of parallel testing

**5/** What you lose: visual guide builder, mobile SDK, built-in analytics. What you gain: design system control, automatic a11y, data ownership, $40K-$80K/year back in budget.

**6/** Full guide with TypeScript code, API commands, and comparison table:

https://usertourkit.com/blog/migrate-pendo-to-react
