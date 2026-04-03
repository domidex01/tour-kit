## Title: Comparing 10 product tour tools for React: bundle sizes, licensing, and React 19 support

## URL: https://usertourkit.com/blog/best-product-tour-tools-react

## Comment to post immediately after:

I've been building onboarding flows and was frustrated by the lack of apples-to-apples comparisons for React tour libraries. Most "best of" lists just reword marketing copy.

So I installed all 10 into the same Vite 6 + React 19 + TS 5.7 project and actually measured things. A few findings worth noting:

Bundle sizes are all over the place. Driver.js is 5KB. React Joyride is 30KB (6x larger). The SaaS platforms inject 80-90KB at runtime. The headless libraries (User Tour Kit, OnboardJS) sit around 8-10KB.

Licensing is the hidden gotcha. Shepherd.js and Intro.js both use AGPL-3.0, which requires you to open-source your app or buy a commercial license. I didn't realize this until I actually checked package.json files — their marketing sites don't make it obvious.

React 19 compatibility is spotty. Only 4 out of 10 support it natively. React Joyride just rewrote their entire library (v3, released March 23) to drop class components for hooks. Driver.js and Intro.js don't have React bindings at all — they manipulate the DOM directly.

Full disclosure: I built one of the tools on this list (User Tour Kit). I've tried to keep the evaluation honest — every number comes from npm, GitHub, or bundlephobia. If you disagree with any of the rankings, I'd genuinely like to hear why.

**Best posting time:** Tuesday–Thursday, 8–10 AM EST
