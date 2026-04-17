# What Are the Best Appcues Alternatives for Developers?

### Comparing 7 developer-friendly options by price, bundle size, and React support

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-appcues-alternatives-developers)*

Appcues starts at $249 per month, injects a ~180 KB third-party script outside your React component tree, and gates custom CSS behind its Growth plan. If your engineering team wants to own the onboarding experience in code rather than hand it to a product manager with a visual builder, seven alternatives give you more control for less money.

We built Tour Kit, one of the tools on this list. Take our recommendations with that context. Every data point below is verifiable against npm, GitHub, or the vendor's public pricing page.

## Why developers leave Appcues

Three patterns come up repeatedly on Reddit and in GitHub discussions.

**Pricing scales fast.** Appcues charges per monthly active user. A SaaS app with 5,000 MAUs pays roughly $249-$399/month. At 10,000 MAUs you're looking at custom quotes. One Reddit user put it plainly: "They've gotten insanely expensive." That's $2,988/year minimum before feature add-ons.

**Customization requires developer help anyway.** Appcues markets a no-code builder, but real customization needs CSS overrides and sometimes JavaScript callbacks. Custom CSS is gated behind the Growth plan.

**Third-party script injection.** That ~180 KB payload sits outside your React tree, can't participate in your component lifecycle, and creates a dependency on Appcues' CDN uptime.

## The quick comparison

Here's how seven alternatives stack up:

- **Tour Kit** — ~8 KB gzipped, React 19 native, WCAG 2.1 AA, $0 MIT / $99 one-time Pro
- **Flows.sh** — SDK-based managed service, React 19, free tier + paid plans
- **React Joyride** — ~45 KB, no React 19, free MIT, 603K weekly npm downloads
- **Shepherd.js** — ~25 KB, AGPL licensed (open-source your app or buy commercial)
- **Driver.js** — ~5 KB, vanilla JS (no React wrapper), MIT
- **Intro.js** — ~15 KB, AGPL, $9.99+ commercial license
- **OnboardJS** — headless open source + $59/mo SaaS analytics

## Which one should you pick?

If you need full design control with shadcn/ui or Tailwind, Tour Kit renders your components instead of its own. If you want managed infrastructure, Flows.sh gives you a developer API without a visual builder. If you're prototyping fast, React Joyride has the biggest install base. If you need Vue/Angular support, Shepherd.js covers it (watch the AGPL license). If bundle size is everything, Driver.js is 5 KB.

For a React team replacing Appcues, we'd recommend starting with Tour Kit's free MIT tier. The Pro license at $99 one-time is still less than a single month of Appcues.

Tour Kit has real limitations: no visual builder, no mobile SDK, and a smaller community than React Joyride. If your team doesn't write React and needs a visual builder, Appcues might actually be the right choice.

Full article with comparison table and code examples: [usertourkit.com/blog/best-appcues-alternatives-developers](https://usertourkit.com/blog/best-appcues-alternatives-developers)

---

*Suggest submitting to: JavaScript in Plain English, Better Programming, or The Startup on Medium*
