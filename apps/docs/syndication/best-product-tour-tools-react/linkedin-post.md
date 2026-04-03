Only 4 out of 10 product tour tools support React 19. I tested all of them.

I spent a week installing every major product tour library into the same React 19 project. The gap between what marketing pages promise and what actually works is... significant.

A few things engineering leads should know:

Bundle sizes range from 5KB (Driver.js) to 90KB (SaaS snippets from Appcues and Userpilot). That's an 18x difference loading into your users' browsers.

Two of the most popular open-source options — Shepherd.js and Intro.js — use AGPL-3.0 licensing. Unless you're ready to open-source your entire application, you need a commercial license. Most teams don't catch this until legal review.

The real split in this space isn't "open source vs. SaaS." It's who builds the tours. If your engineering team owns onboarding, open-source libraries cost $0-99 one-time. If your product team needs a visual builder without filing engineering tickets, SaaS platforms start at $249/month ($3K/year).

Full comparison with bundle sizes, TypeScript support, React 19 compatibility, and accessibility scores for all 10 tools:

https://usertourkit.com/blog/best-product-tour-tools-react

#react #javascript #webdevelopment #opensource #productdevelopment
