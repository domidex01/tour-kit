## Title: React Joyride V3: a complete rewrite after being declared "dead" by automated health checkers

## URL: https://usertourkit.com/blog/is-react-joyride-still-maintained

## Comment to post immediately after:

React Joyride (673K weekly npm downloads) went silent between November 2024 and March 2026. During that gap, React 19 broke V2, Snyk flagged it as "potentially discontinued," and multiple competitor blogs ran "React Joyride alternatives" articles.

Then the maintainer (gilbarbara, solo) shipped V3 as a ground-up rewrite — three releases in nine days. Popper.js replaced with Floating UI, proper React hooks API, SVG overlays instead of CSS box-shadow, ~30% smaller bundle.

The interesting meta-story here is how automated package health scoring (Snyk, Socket, etc.) created a feedback loop: library goes quiet during major rewrite → health score drops → competitor articles cite the score → developers switch away → library ships V3 to an audience that already moved on. The "declared dead" narrative persists in cached search results even though V3 is clearly active.

I wrote this from the perspective of someone who builds a competing library (User Tour Kit), so the comparison section has that bias disclosed. The data points (downloads, stars, release dates) are all verifiable.
