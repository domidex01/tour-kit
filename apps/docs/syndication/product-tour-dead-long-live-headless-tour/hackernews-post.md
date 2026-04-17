## Title: The Product Tour Is Dead. Long Live the Headless Tour

## URL: https://usertourkit.com/blog/product-tour-dead-long-live-headless-tour

## Comment to post immediately after:

I wrote this after looking at the current state of product tour libraries in the React ecosystem and finding the situation worse than expected.

The data: 78% of users abandon traditional product tours (Pendo, 847 B2B SaaS apps). 76.3% of tooltips are dismissed within 3 seconds. React Joyride (400K weekly downloads) hasn't had a stable release in 9 months and doesn't support React 19. Shepherd.js's React wrapper is also broken on React 19. Intro.js implements tour step buttons as `<a>` tags instead of `<button>` elements.

The thesis: the same headless pattern that worked for Radix UI, shadcn/ui, and React Aria should apply to product tours. Separate the logic (positioning, scroll management, focus trapping, keyboard navigation) from the rendering. Let teams use their own components for the actual UI.

I built Tour Kit (open-source, MIT, ~8KB gzipped) to test this thesis. The article includes a comparison table, code examples, and three steelmanned counterarguments against the headless approach (setup cost, non-technical access, community size). I tried to be honest about where no-code platforms like Appcues are the better call.

Would appreciate feedback on the architectural argument, especially from anyone who's dealt with tour library CSS conflicts in production.
