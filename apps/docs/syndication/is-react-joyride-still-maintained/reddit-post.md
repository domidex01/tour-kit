## Subreddit: r/reactjs

**Title:** React Joyride V3 just shipped — here's what changed and what's still broken

**Body:**

I've been tracking React Joyride's status since the React 19 compatibility mess. A lot of articles from late 2025 declared it dead, and Snyk's automated health check even flagged it as "discontinued."

Turns out the maintainer (gilbarbara) was quietly building a V3 rewrite the whole time. It dropped March 23 with three releases in nine days.

The highlights: React 19 support is fixed, Floating UI replaced Popper.js, there's a proper `useJoyride()` hook instead of the old `getHelpers` callback, and the bundle is ~30% smaller. The V2→V3 migration isn't trivial though — imports changed, `run` defaults to false now, and the event system was completely replaced.

What's still not great: inline styles only (Tailwind users still have to override default components), touch device double-tap issue persists, and multiple Joyride instances on one page still conflict. Also still a solo-maintainer project — the 4-month silence happened because one person was heads-down with no communication channel.

I wrote up the full timeline with a comparison table against Shepherd.js, Driver.js, and a few other options: https://usertourkit.com/blog/is-react-joyride-still-maintained

Disclosure: I work on User Tour Kit (a headless alternative), so take the comparison section with a grain of salt. Tried to be fair — React Joyride's 673K weekly downloads speak for themselves.

Anyone here migrated from V2 to V3 yet? Curious how the migration went.
