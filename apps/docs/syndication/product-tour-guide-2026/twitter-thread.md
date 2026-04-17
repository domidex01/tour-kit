## Thread (7 tweets)

**1/** Most product tour guides are written for PMs choosing a SaaS tool. None of them show code. I wrote one for developers, backed by data from 550M tour interactions.

Here's what the numbers say:

**2/** 3-step tours hit 72% completion. 7+ step tours drop to 16%.

That's from Chameleon's analysis of 550M interactions. The lesson: if you have more than 4 things to show, split them into separate tours at different points in the user journey.

**3/** User-initiated tours complete at 67%. Auto-triggered tours: 31%.

That's a 2x difference just from letting users opt in. Add a "Take a tour" button instead of launching on page load.

**4/** The four product tour patterns:
- Action-driven tooltips (must complete task)
- Non-action tooltips (click Next)
- Modals (welcome screens)
- Hotspots (subtle, user-initiated)

Picking the wrong one is the #1 reason tours get dismissed.

**5/** Every product tour guide I found skips accessibility entirely.

But tours are interactive overlays that hijack focus. You NEED: focus trapping, keyboard nav, aria-live announcements, 4.5:1 contrast. WCAG 2.1 AA isn't optional.

**6/** Opinionated vs. headless libraries:
- React Joyride: ~30KB, ships its own UI
- User Tour Kit: under 8KB, hooks + render yourself

(I built User Tour Kit, so I'm biased. Bundle sizes verifiable on bundlephobia.)

**7/** Full guide with code examples, comparison table, FAQ, and 30+ linked articles covering every subtopic in depth:

https://usertourkit.com/blog/product-tour-guide-2026
