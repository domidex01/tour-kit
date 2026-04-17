## Subreddit: r/reactjs

**Title:** I wrote a tutorial on building feature announcement banners with persistence and frequency control — here's what I learned about the role="alert" gotcha

**Body:**

I've been building an announcement system for a React library and kept running into the same three problems every tutorial ignores: persistence across sessions, controlling how often a banner shows, and getting screen readers to actually announce the thing.

The role="alert" problem was the most surprising. If you conditionally render the entire container, screen readers miss the announcement because ARIA live regions only fire when content changes dynamically inside an existing container. The container has to be in the DOM and empty before you inject text into it. Most banner tutorials get this wrong.

For frequency control, I ended up implementing 5 modes: show once ever, once per session, always (for incidents), N times total, and every N days. All tracked in localStorage with view counts and dismissal timestamps. The "every N days" pattern is useful for migration warnings — persistent enough to be noticed, not annoying enough to trigger banner blindness.

The other thing that helped was tracking 7 different dismissal reasons (close button, escape key, CTA click, overlay click, etc.) instead of just "dismissed: true." When you can see that 80% of users hit the close button instead of the CTA, you know the copy or placement needs work.

Full tutorial with TypeScript code examples (under 60 lines total): https://usertourkit.com/blog/feature-announcement-banner-react

Built this using @tour-kit/announcements, which is a library I'm working on. Happy to answer questions about the implementation.
