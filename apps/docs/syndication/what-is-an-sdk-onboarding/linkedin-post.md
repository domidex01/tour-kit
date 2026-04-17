"SDK" appears on every developer tools page. Most developers use them daily. But the term gets applied inconsistently.

I wrote a glossary explainer breaking down what an SDK actually is, how it differs from an API and a standalone library, and what it means specifically in the context of onboarding tools.

The key distinction: an API is a contract. A library solves one problem. An SDK bundles multiple libraries, type definitions, documentation, and tooling into one coordinated package. The coordination is what matters. Types are shared across modules. Versioning is synced so sub-packages don't break each other.

For engineering managers evaluating onboarding tools: building a basic 5-step product tour from scratch takes roughly 40-60 hours when done properly. An onboarding SDK compresses that to an afternoon. The tradeoff is dependency management and bundle size (5KB to 37KB depending on the tool).

Full article with comparison table and code examples: https://usertourkit.com/blog/what-is-an-sdk-onboarding

#react #javascript #webdevelopment #sdk #productonboarding #opensource
