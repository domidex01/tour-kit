Almost no open-source product tour library claims WCAG 2.1 AA compliance. I tested 9 of them to find out why.

I spent a week installing every major open-source tour library into the same Vite 6 + React 19 project. The gap between what marketing pages promise and what actually works is significant.

A few things engineering leads should know:

Bundle sizes range from 5KB (Driver.js) to 30KB (React Joyride). That's a 6x difference loading into your users' browsers on mobile connections.

One of the most popular open-source options -- Intro.js -- uses AGPL-3.0 licensing. Unless you're ready to open-source your entire application, you need a commercial license. Most teams don't catch this until legal review.

The real gap in this space is accessibility. Almost none of these libraries publish Lighthouse scores, document ARIA role usage, or mention prefers-reduced-motion. Screen reader users and keyboard-only navigators deserve onboarding that works too.

The headless vs. opinionated split is the key architectural decision. If your engineering team uses a design system (shadcn/ui, Radix, Tailwind), headless libraries avoid style conflicts entirely. If you need a working tour in 10 minutes, opinionated libraries with pre-built UI get you there faster.

Full comparison with bundle sizes, TypeScript support, React 19 compatibility, accessibility evaluation, and a decision guide for all 9 libraries:

https://usertourkit.com/blog/best-free-product-tour-libraries-open-source

#react #javascript #webdevelopment #opensource #accessibility
