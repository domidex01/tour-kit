Building onboarding in-house sounds like a quick project. Then you do the math.

Year-one cost: ~$70,784. That's $45K for the initial build and $26K in annual maintenance — before accessibility compliance, analytics, or the iteration tax of every copy change requiring an engineering sprint.

I compared 5 open-source product tour libraries (Tour Kit, React Joyride, Shepherd.js, Driver.js, Onborda) in the same React 19 project. Two findings surprised me:

1. Almost no library ships with complete WCAG 2.1 AA accessibility. Focus trapping, keyboard navigation, screen reader support — you're still doing most of the work yourself.

2. Licensing is a minefield. Intro.js uses AGPL v3, which many legal teams reject for proprietary SaaS. All five libraries in this comparison are MIT-licensed.

The real killer isn't building v1. It's maintaining versions 2 through 20 while your product evolves underneath.

Full comparison with bundle sizes, accessibility scores, and a decision framework: https://usertourkit.com/blog/best-alternatives-building-onboarding-in-house

#react #javascript #webdevelopment #producttours #opensource #uxdesign
