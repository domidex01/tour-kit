## Thread (7 tweets)

**1/** Most "product tour best practices" are written for product managers. If you're building tours in React, you need different patterns. I compiled 14 React-specific practices backed by data from 550M interactions. 🧵

**2/** Three-step tours complete at 72%. Seven steps? 16%.

But the React angle matters more: structure each step around a user ACTION, not a UI element. And don't start tours in useEffect — self-serve tours see 123% higher completion.

**3/** Lazy-load your tour components with React.lazy(). We saved 11KB gzipped from initial bundles.

Tour UI should never be in your main chunk. Users see onboarding once, maybe twice. Don't penalize every page load for that.

**4/** The React 19 situation is rough. React Joyride's next version doesn't work reliably. Shepherd's React wrapper is broken entirely. Intro.js has multiple WCAG violations.

If you're on React 19, audit your tour library carefully.

**5/** Accessibility isn't optional. 71.5% of screen reader users have issues with overlays and popups (WebAIM).

Three requirements: focus trapping with aria-modal, keyboard navigation (Escape to dismiss), and live region announcements when steps change.

**6/** Smart pattern from Sentry's team: use useRef instead of useState for the step registry. Prevents cascading re-renders when steps register themselves.

Tour state belongs outside the tour component. Context + reducer for simple apps, Zustand for complex ones.

**7/** Full guide with all 14 practices, code examples, library comparison table, and FAQ:

https://usertourkit.com/blog/product-tour-best-practices-react
