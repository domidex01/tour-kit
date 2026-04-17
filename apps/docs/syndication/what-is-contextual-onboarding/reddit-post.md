## Subreddit: r/reactjs

**Title:** Contextual onboarding vs linear product tours — what we learned implementing both patterns

**Body:**

I've been building onboarding flows in React for a while and wrote up the distinction between contextual onboarding and traditional linear tours. The short version: linear tours have a 19.2% average completion rate (Userpilot's benchmark data). Most users click through without retaining anything.

Nielsen Norman Group calls this the "paradox of the active user" — people skip tutorials because they'd rather just start using the product. Contextual onboarding works differently: instead of a fixed sequence, you trigger hints based on what the user is actually doing. First visit to a page? Show a tooltip. Completed a prerequisite? Surface the next checklist item.

The technical implementation boils down to three things: a trigger system (event listeners, intersection observers), a context check (user state, dismissal history, role), and a constraint that you never show more than 3–5 help items per session (Chameleon's research on "help fatigue").

I also covered ARIA roles for each pattern — tooltips need `role="tooltip"` with `aria-describedby`, announcements need `role="status"` with `aria-live="polite"`. Surprisingly few articles cover the accessibility side of onboarding UI.

Full writeup with code examples and a comparison table of trigger patterns: https://usertourkit.com/blog/what-is-contextual-onboarding
