## Subreddit: r/reactjs (primary), r/SaaS (secondary — pricing angle)

**Title:** I compared 6 Intercom product tour alternatives — here's what the pricing actually looks like

**Body:**

I got curious about what Intercom actually charges for product tours, so I dug into the numbers. The minimum is $273/month (base plan + tours add-on), and the tours themselves are limited to linear sequences with no mobile support. Intercom's own data shows a 34% median completion rate for 5-step tours.

I tested six alternatives in a Vite 6 + React 19 project. The price range is wild:

- Product Fruits: $79/mo (all-in-one with surveys)
- UserGuiding: $174/mo (4.7/5 on G2, 15-minute setup)
- Appcues: $249/mo (visual builder, mobile SDK)
- Chameleon: $279/mo (enterprise, deep analytics integrations)
- Intro.js: $9.99 one-time (vanilla JS, framework-agnostic)
- Tour Kit: free (MIT) / $99 one-time for Pro (headless React library, full disclosure — this is my project)

The thing nobody talks about in these comparisons is bundle size. Intercom loads the entire Messenger SDK even if you only use tours. For apps where Core Web Vitals matter, that's worth measuring.

Full breakdown with comparison table, accessibility data, and code examples: https://usertourkit.com/blog/best-intercom-product-tour-alternatives

Happy to answer questions about any of the tools. I installed and built a 5-step tour with each one.
