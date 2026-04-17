## Subreddit: r/webdev

**Title:** Slideout vs modal vs drawer vs toast — I wrote up a comparison with ARIA roles and use cases

**Body:**

I kept running into the same confusion in design reviews: someone says "add a slideout," another person calls it a "drawer," someone else suggests a modal. Turns out there's no agreed standard across design systems.

Adobe calls it a slideout. Material UI calls the same thing a drawer. PatternFly (Red Hat) also uses drawer. Appcues and Userpilot call it a slideout in their in-app messaging context. The functional difference mostly comes down to intent: slideouts are for contextual content and sub-tasks, drawers are for navigation and filters.

I wrote a glossary entry that maps the terminology, includes a comparison table (with ARIA roles for each pattern), and covers the accessibility requirements. The tl;dr on a11y: move focus into the panel on open, trap it, close on ESC, return focus to the trigger on close. Use `role="dialog"` for workflow slideouts, `role="complementary"` for notification-style ones.

The real-world examples section covers how Miro, Appcues, and SEB Group use slideouts differently.

Full article with code examples and comparison table: https://usertourkit.com/blog/what-is-a-slideout
