## Subreddit: r/reactjs

**Title:** I replaced Pendo's product tours with code-owned React components. Here's the migration path.

**Body:**

My team was paying Pendo $40K+/year mostly for in-app guides. The analytics and session replay were nice, but the guides were the core use case. After dealing with SPA routing issues (`window.pendo.initialize` errors after navigation), fighting their theme editor to match our Tailwind design tokens, and realizing full data export required their $100K+/year Ultimate tier, we decided to own the code.

The migration was simpler than expected. The short version:

1. Export guide configs from Pendo's REST API (`/api/v1/guide` endpoint gives you step selectors, content, and targeting rules as JSON)
2. Install a React tour library alongside Pendo (they don't interfere with each other)
3. Rebuild each guide as a React component, one at a time. Pendo's `elementPathRule` CSS selectors map directly to `target` props
4. Convert Pendo segment targeting to React conditionals (e.g., "signed up within 7 days" becomes a date comparison in your auth hook)
5. Migrate badges/hotspots to hint components
6. Disable Pendo guides, test for a sprint, then remove the snippet

The whole process took about 4 hours for 8 guides. The biggest time sink was converting Pendo's HTML content strings to JSX.

Some things that surprised us:
- Pendo's bundle is 54KB loaded on every page. Our replacement is under 8KB gzipped and only loads where tours exist
- Pendo claims WCAG 2.2 AA but their own docs recommend specific guide types as workarounds for accessibility gaps
- The `data-pendo` attributes we'd added for selector stability worked perfectly as targets for the new library

Tradeoffs we accepted: we lost the visual guide builder (our PMs now file PRs for copy changes), the mobile SDK (we only used web guides), and built-in analytics (we route tour events to PostHog instead).

We used Tour Kit for this (disclosure: it's my project), but the migration pattern works with any React tour library. The key insight is that Pendo guides are just CSS selectors + HTML content + targeting rules, all of which map naturally to React component props.

Full writeup with working TypeScript code and API export commands: https://usertourkit.com/blog/migrate-pendo-to-react

Happy to answer questions about the migration process or specific Pendo pain points.
