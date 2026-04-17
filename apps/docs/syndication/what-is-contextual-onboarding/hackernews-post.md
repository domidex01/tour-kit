## Title: Contextual onboarding: pull revelations vs push revelations in product UX

## URL: https://usertourkit.com/blog/what-is-contextual-onboarding

## Comment to post immediately after:

NNG researcher Page Laubheimer draws a useful distinction between "push revelations" (traditional product tours that dump information on login) and "pull revelations" (contextual help triggered by user behavior). Linear tours have a 19.2% average completion rate across industries — most users click through without retaining anything.

This article covers the developer implementation side: trigger patterns (first visit, idle time, prerequisite completion), context checks (dismissal history, user role), and the 3–5 items per session constraint from Chameleon's help fatigue research.

One gap I noticed in existing content: almost nobody covers the accessibility requirements for onboarding UI. ARIA roles, focus management, and screen reader announcements are non-trivial when you're injecting contextual hints into a running application. I included the patterns we use — `role="status"` with `aria-live="polite"` for non-modal hints, focus trapping for modal ones.

The code examples use Tour Kit (which I built), but the patterns apply to any onboarding implementation.
