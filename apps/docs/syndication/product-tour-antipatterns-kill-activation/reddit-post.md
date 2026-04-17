## Subreddit: r/reactjs

**Title:** I analyzed 550M product tour interactions — here are the 10 patterns that kill activation

**Body:**

I've been building an open-source product tour library and kept running into the same structural mistakes in onboarding implementations. Decided to write them up with the actual data behind each one.

The numbers that surprised me most:

- **Seven-step tours complete at 16%.** Three-step tours: 72%. Adding even one step to a three-step tour drops completion to 45%. Most teams build 8-15 step "product overviews" that almost nobody finishes.
- **Click-triggered tours complete at 67% vs. 31% for auto-fire tours.** Users who choose to take a tour engage way more than users who get interrupted on page load.
- **76.3% of static tooltips are dismissed within 3 seconds.** Tooltip fatigue is real and it compounds across features — your onboarding tour, feature announcements, and survey prompts all degrade each other.
- **Personalization by user role lifts 7-day retention by 35%.** Figma segments by designer/developer/PM and hits 65% activation. Most apps show everyone the same tour.

The 10 antipatterns: firehose tours, click-next progression (vs. action-based), page-load triggers, forced tours with no skip, one-size-fits-all, tooltip fatigue, measuring completion instead of activation, selector rot (tours that break silently), ignoring accessibility, and one-and-done with no reinforcement.

The article has code examples for the fixes and a diagnostic table you can use to audit your existing tours.

Full writeup with code: https://usertourkit.com/blog/product-tour-antipatterns-kill-activation

Curious what antipatterns you've run into that I missed. The accessibility one (tours without ARIA attributes or keyboard nav) felt underdiscussed — almost no one writes about it.
