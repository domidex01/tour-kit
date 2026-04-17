## Subreddit: r/reactjs (also suitable for r/webdev, r/userexperience)

**Title:** I compared how Figma, Canva, Adobe XD, Sketch, and Penpot handle new user onboarding — here's what I found

**Body:**

I spent time tearing down how 5 major design tools approach the same problem: they have 200+ features packed into one screen, and new users need to discover them without getting overwhelmed.

Some interesting findings:

- The industry has converged on 3-5 cards as the ideal tour length. Slack uses 4, Canva uses 1-3 triggered contextually, Notion uses 6.
- Figma's opt-in approach (modal offering a tour choice) beats forced walkthroughs, but hasn't evolved since 2022 — a Sketch veteran sees the same beginner tooltips as a first-timer.
- Canva's contextual approach (tooltips triggered by specific actions rather than login) is the strongest for casual users but means power features stay completely hidden from people who never accidentally trigger the right context.
- Nobody combines short opt-in tours + behavior-triggered progressive disclosure + WCAG 2.1 AA accessibility. That gap is wide open.
- WCAG 2.1.4 specifically requires that keyboard shortcuts introduced during onboarding are turn-off-able or remappable — most design tools ignore this entirely.

The GitHub/Microsoft/DX study showing developers with intuitive tools feel 50% more capable of creative problem-solving was the stat that surprised me most. Makes sense though: if you never find the features, you work around them.

I also included React code examples showing how to implement behavior-triggered progressive disclosure if you're building a complex canvas-type UI. The key insight is using trigger conditions per step instead of sequential tours.

Full writeup with comparison table and code: https://usertourkit.com/blog/design-tool-onboarding-feature-discovery

Happy to answer questions about the research or implementation patterns.
