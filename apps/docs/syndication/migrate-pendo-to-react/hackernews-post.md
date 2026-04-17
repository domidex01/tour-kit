## Title: Migrating Pendo product tours to code-owned React components

## URL: https://usertourkit.com/blog/migrate-pendo-to-react

## Comment to post immediately after:

I wrote this after migrating our Pendo guides to React components we own. Pendo is a solid product for teams that need the full platform (analytics + session replay + guides), but if you're a React team primarily using the guides, the economics stop making sense at $40K-$80K/year.

The migration pattern is surprisingly mechanical: Pendo stores guides as CSS selectors + HTML content + targeting rules, which map directly to React component props. The API endpoint (`/api/v1/guide`) gives you everything you need as JSON.

Some specific data points from our migration:
- Pendo's agent script is 54KB loaded on every page. The replacement is under 8KB gzipped and tree-shakeable
- Full data export from Pendo requires their Ultimate tier ($100K+/year). Standard tiers only give you guide configs via API
- Pendo claims WCAG 2.2 AA accessibility but their own documentation recommends workarounds for their default guide types

The main tradeoff is losing the visual guide builder. If your product managers create and iterate on guides independently, Pendo's no-code workflow has genuine value. If engineering owns guide creation, the code-owned approach is cheaper and more flexible.

Disclosure: I used Tour Kit (my project) as the target, but the migration process works with any React tour library.
