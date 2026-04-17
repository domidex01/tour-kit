## Thread (6 tweets)

**1/** Click-triggered product tours complete at 67%. Time-delay tours? 31%.

That's a 2.16x gap from Chameleon's analysis of 15M interactions.

Here are 6 behavioral trigger patterns for React apps:

**2/** Pattern 1: Click triggers — just `onClick={() => start()}`. Simple, highest completion.

Pattern 2: Route-change triggers — `useEffect` + `useLocation`, fire on first visit to a page. Use a ref to prevent re-firing.

**3/** Pattern 3: Smart Delay (inactivity) — reset a setTimeout on mousemove/keydown/scroll. Outperforms fixed timers by 21%.

Pattern 4: Visibility triggers — IntersectionObserver starts a tour when an element scrolls into view. Zero polling.

**4/** Pattern 5: Feature milestones — trigger on cumulative behavior ("5 exports", "visited pricing 3x without upgrading").

Pattern 6: Compound AND/OR rules — combine conditions that would need enterprise tiers in GUI tools.

**5/** The part nobody covers: accessibility.

Behavioral triggers inject DOM content dynamically. Screen readers miss it without aria-live regions. Custom trigger elements need keyboard handlers. Inactivity triggers must announce context on focus shift.

**6/** Full guide with working TypeScript hooks for all 6 patterns, comparison table, and FAQ:

https://usertourkit.com/blog/behavioral-triggers-product-tours-event-based-onboarding
