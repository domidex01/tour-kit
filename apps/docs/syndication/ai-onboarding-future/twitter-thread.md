## Thread (7 tweets)

**1/** Every onboarding tool shipped an AI feature in 2025.

But as someone who builds onboarding infrastructure — not someone who sells it — I think most of the hype misses the point.

Here's what AI will actually change about product onboarding, and what it won't:

**2/** WILL CHANGE: Dynamic step sequencing.

Static tours run steps 1-N in order. AI observes what the user already explored and adjusts. Skip the "here's what an API key is" step if they already found the docs.

This is the real value. Not generating copy.

**3/** WILL CHANGE: Personalized timing.

Userpilot's beta: 15-20% better completion when using AI-predicted timing vs fixed delays.

Most onboarding uses "show tour 3 seconds after login." AI picks the moment the user is most likely to engage.

**4/** WON'T CHANGE: Accessibility.

WCAG 2.1 AA compliance requires keyboard navigation, focus management, screen reader support. These are deterministic problems.

No AI tool handles this correctly out of the box in 2026. It has to be engineered.

**5/** WON'T CHANGE: Performance.

Loading 200KB of AI inference to decide which tooltip to show? Bad trade.

75% of users abandon within week 1 if they struggle getting started. On mobile, bundle size = abandonment.

Keep AI on the server. Keep the client lean.

**6/** WON'T CHANGE: The component layer.

Z-index stacking. Portal rendering. Overlay clipping. Focus traps.

No amount of AI personalization helps if the tooltip renders behind a modal.

**7/** My recommendation: invest in the rendering layer now, add AI later.

Separate intelligence (what to show) from rendering (how to show it). Start with rules. Add AI when your data supports it.

Full take with code examples: https://usertourkit.com/blog/ai-onboarding-future
