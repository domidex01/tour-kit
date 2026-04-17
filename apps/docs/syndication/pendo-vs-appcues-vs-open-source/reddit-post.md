## Subreddit: r/reactjs

**Title:** I compared the real cost of Pendo, Appcues, and open-source tour libraries — here's a decision framework

**Body:**

I spent time researching the actual costs and tradeoffs of the three main approaches to product tour tooling: enterprise SaaS (Pendo), mid-market SaaS (Appcues), and open-source libraries.

The pricing differences are dramatic. Pendo's median contract is $48K/year according to Vendr marketplace data. Appcues Growth starts at $879/month for just 2,500 MAU and scales non-linearly — doubling your users more than doubles your bill. Open-source options like React Joyride, Shepherd.js, Driver.js, and Tour Kit range from free to $99 one-time.

The real decision comes down to three questions: (1) who edits tours — PMs or developers? (2) what's your annual budget? (3) does the 200-300KB script injection affect your Core Web Vitals?

Both Pendo and Appcues inject third-party JavaScript at runtime. If you're tracking Lighthouse scores or have mobile users on slower connections, that matters. Open-source libraries compile into your bundle and tree-shake.

The tradeoff with open source is no visual builder. Your PM can't drag-and-drop tooltips. Every change goes through code. For teams that deploy daily, that's fine. For monthly release cycles, it's friction.

I built Tour Kit (one of the open-source options), so take my perspective with appropriate skepticism. But all the pricing data comes from Vendr, Featurebase, and Userorbit — you can verify it.

Full comparison with tables, code examples, and migration guides: https://usertourkit.com/blog/pendo-vs-appcues-vs-open-source
