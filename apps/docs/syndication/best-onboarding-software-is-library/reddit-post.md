## Subreddit: r/reactjs

**Title:** I wrote up the case for why React libraries are better onboarding software than SaaS platforms (with pricing and bundle size data)

**Body:**

I've been thinking about this for a while and finally put together the data. The onboarding tools market is roughly $3.5B, but most of that money goes to SaaS platforms that charge $249-$299/month (Appcues, Userpilot) or $15K-$140K/year (Pendo) on MAU-based pricing.

Meanwhile, React libraries like React Joyride (7.6K stars, 11K+ dependents), Shepherd.js (100+ contributors), and Tour Kit ship the same core functionality for $0 and a fraction of the bundle weight. SaaS scripts inject 50-200KB of JavaScript on every page load. React Joyride is ~37KB. Driver.js is ~5KB. Tour Kit core is under 8KB.

The standard "build vs buy" framing from vendors like Whatfix estimates a custom build at $55K over two months. But that assumes building from scratch. Using a library eliminates ~80% of that work. It's a third option nobody talks about: use a library, own the code.

The headless UI movement (Radix, Headless UI, shadcn/ui) already proved that separating logic from presentation works for components. Same argument applies to onboarding.

Honest caveats: SaaS tools genuinely win on visual builders for non-technical teams, built-in analytics, and targeting/segmentation. Libraries require React developers and more integration work.

Full article with comparison tables, code examples, and the EU Data Act angle: https://usertourkit.com/blog/best-onboarding-software-is-library

Disclosure: I built Tour Kit, but the argument applies to any React tour library. Curious what others think about the library vs SaaS tradeoff for onboarding.
