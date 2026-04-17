## Subreddit: r/reactjs

**Title:** SDK vs library vs API - I wrote a breakdown of what these terms actually mean in the context of onboarding tools

**Body:**

I kept running into confusion around "SDK" vs "library" vs "API" when evaluating onboarding tools, so I wrote a glossary-style breakdown.

The short version: an API is a contract (endpoints, function signatures). A library solves one problem (like tooltip positioning). An SDK bundles multiple libraries, types, docs, and tooling into one coordinated package. The Android SDK is the classic example, but the pattern shows up in the JS ecosystem too.

For onboarding specifically, the distinction matters because a product tour "library" like React Joyride handles step-by-step tours. An onboarding "SDK" is broader: tours, tooltips, checklists, announcements, analytics, all versioned together. Whether you actually need the full SDK depends on your use case.

I also included an SDK vs API comparison table and a code example showing the layered architecture pattern (core logic -> framework adapter -> optional extensions). Building tour logic from scratch takes roughly 40-60 hours for a basic 5-step flow, which is why most teams reach for a package.

Full article with code examples: https://usertourkit.com/blog/what-is-an-sdk-onboarding

Disclosure: I built Tour Kit, one of the onboarding SDKs mentioned. Tried to keep it balanced and include alternatives like Shepherd.js, React Joyride, and Driver.js with their bundle sizes.
