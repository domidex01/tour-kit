## Thread (6 tweets)

**1/** "Headless UI" gets confused with headless CMS all the time. They're completely different concepts. Here's what headless UI actually means for React developers:

**2/** A headless UI component gives you behavior (keyboard nav, focus management, ARIA) without rendering any HTML or CSS. You get the brain. You build the body. Martin Fowler's team traced it back to the Presentation Model pattern from 2004.

**3/** Three ways to implement it in React: - Custom hooks (most common) - Compound components (Radix UI's approach) - Render props (mostly replaced by hooks after React 16.8)

**4/** The numbers are wild: Radix UI has 9.1M weekly npm downloads. An engineer at Gloat spent 6 months migrating between styled libraries. Same component, headless refactor? "A couple of hours."

**5/** The tradeoff is real though — you write more JSX. No `<Button variant="primary" />` that renders a finished component. You own every class name. Teams without a design system may find it slower at first.

**6/** Full breakdown with a comparison table of 6 headless React libraries (Radix, React Aria, Ariakit, Base UI, Headless UI, Tour Kit): https://usertourkit.com/blog/what-is-headless-ui
