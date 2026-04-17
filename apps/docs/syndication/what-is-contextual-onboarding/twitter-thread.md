## Thread (6 tweets)

**1/** Linear product tours have a 19.2% average completion rate. Most users click "Next" until it stops and retain nothing.

There's a better pattern. It's called contextual onboarding. Here's how it works:

**2/** NNG calls traditional tours "push revelations" — they push information regardless of what the user needs.

Contextual onboarding is "pull revelations" — help triggered by a signal that the user would benefit from it at that exact moment.

**3/** Three things happen in sequence:

1. A trigger fires (first visit, idle time, completed prerequisite)
2. The system checks context (seen before? mid-task? user role?)
3. One relevant element appears

Not five. Research shows 3–5 items per session max before "help fatigue" kicks in.

**4/** The data backs this up:

- 20–30% reduction in support tickets (Chameleon)
- 16–21% fewer docs lookups with in-app guides (Whatfix)
- FinTech onboarding: 24.5% completion vs MarTech at 12.5%

Context matters more than sequence.

**5/** The part nobody talks about: accessibility.

Tooltips need role="tooltip" + aria-describedby
Announcements need role="status" + aria-live="polite"
Modal hints trap focus, inline hints don't steal it

Your onboarding UI has the same a11y requirements as any other component.

**6/** I wrote the full breakdown with React code examples, a comparison table of trigger patterns, and the NNG research that frames this well.

https://usertourkit.com/blog/what-is-contextual-onboarding
