React Joyride has 400K+ weekly npm downloads. It hasn't shipped an update in 9 months and doesn't work with React 19.

I compared every major React product tour library and the ecosystem is in a strange place. Most libraries were built for React 16 and haven't kept up with ref changes, Server Components, or strict mode double-rendering.

The accessibility story is even rougher. Intro.js has no focus trap and uses incorrect ARIA roles. No competing library explicitly claims WCAG 2.1 AA compliance.

Sentry's engineering team built custom rather than adopting any existing library. Their architecture writeup is one of the best resources on the topic.

I wrote up the full comparison with five approaches, bundle size data, and a decision framework for teams choosing in 2026: https://usertourkit.com/blog/how-add-product-tour-react-app

(Disclosure: I built Tour Kit, one of the options compared. The article covers its limitations too.)

#react #javascript #webdevelopment #productdevelopment #opensource #typescript
