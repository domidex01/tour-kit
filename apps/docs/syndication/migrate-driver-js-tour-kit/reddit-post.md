## Subreddit: r/reactjs

**Title:** I wrote a migration guide for moving from Driver.js to a headless tour library — here's what changes and what you gain

**Body:**

I've been using Driver.js for product tours in React projects and kept hitting the same walls: the popover UI doesn't match our design system, the imperative API fights React's state model, and multi-page tours require a lot of manual glue code.

I ended up migrating to a headless approach (userTourKit) and documented the whole process. The migration touches five areas:

1. **Step definitions** — Driver.js nests title/description under a `popover` key. The headless approach uses flat properties and typed `TourStep` objects. The biggest improvement is using `data-tour` attributes instead of CSS selectors, which survive refactors.

2. **Tour lifecycle** — Instead of `driverObj.drive()` and `driverObj.moveNext()`, you get a `useTour()` hook that returns reactive state. Your component re-renders when the step changes — no manual polling or callback wiring.

3. **Popover rendering** — This is the biggest change. You stop configuring `popoverClass` and `onPopoverRender` DOM hacks, and instead write a normal React component. If you have shadcn/ui or any component library, the tooltip just uses your existing Card component.

4. **Callbacks** — The mental model flips. Driver.js gives you `onNextClick` because it owns the Next button. In headless, you own the button, so you call `next()` in your onClick handler.

5. **New capabilities** — After migrating, you get conditional steps (show/hide based on user role), branching tours, multi-page support with route matching, built-in persistence, and keyboard navigation for free.

The configuration mapping is mostly 1:1 (overlayOpacity → spotlight.color, stagePadding → spotlight.padding), so the mechanical conversion is straightforward. The real work is building your tooltip component, which is 20-30 lines of JSX.

Full guide with before/after code examples and complete API mapping table: https://usertourkit.com/blog/migrate-driver-js-tour-kit

Happy to answer questions about the migration process or trade-offs.
