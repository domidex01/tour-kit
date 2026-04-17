## Thread (6 tweets)

**1/** React Joyride has 667K weekly downloads. But if you've outgrown it — design system conflicts, React 19 delays, no analytics — here's a step-by-step migration to a headless alternative. 🧵

**2/** The core difference: Joyride is configuration-driven (pass a steps array, get tooltips). Tour Kit is composition-driven (you write the JSX with your own components). More code upfront, but your design system stays intact.

**3/** The migration runs side-by-side. Install Tour Kit alongside Joyride, swap one tour at a time, test with a feature flag. Nothing breaks in production. Budget 1-2 hours for a 5-10 step tour.

**4/** The API mapping table covers 15 Joyride concepts → Tour Kit equivalents. Biggest shift: Joyride's `callback` prop (typed as `any`) becomes Tour Kit's `useTour()` hook with fully typed returns.

**5/** Honest tradeoff: Tour Kit is under 8KB gzipped (vs ~30KB) and adds router adapters + analytics. But Joyride has 7,690 GitHub stars and a decade of Stack Overflow answers. Smaller community is real.

**6/** Full migration guide with before-and-after code, troubleshooting, and API mapping:

https://usertourkit.com/blog/migrate-react-joyride-tour-kit
