## Thread (6 tweets)

**1/** User refreshes mid-tour. Progress gone. They never come back.

Most React tour libraries treat persistence as an afterthought. Here's how to fix it with a 200-byte localStorage adapter that handles SSR, cross-tab sync, and pluggable backends.

**2/** Tour Kit's `usePersistence` hook stores 5 things:
- Current step index
- Completed tour IDs
- Skipped tour IDs
- "Don't show again" flags
- Tour version (for invalidation)

Total: ~200 bytes per tour. That's 0.002% of localStorage's 10MB limit.

**3/** The SSR trap nobody warns about: your localStorage call crashes Next.js with "window is not defined."

Tour Kit uses a storage adapter factory. Server = no-op (reads return null). Client = real localStorage. Your component code never checks `typeof window`.

**4/** The sneakier bug: you add a step to your tour, deploy, and users who were on step 3 now see step 3 of the NEW tour (wrong content).

Fix: store a version number, reset persistence on mismatch. Takes 8 lines of code.

**5/** The backend is pluggable. Same 3-method interface for localStorage, sessionStorage, cookies, or a custom fetch adapter. Swap in one line:

`config={{ persistence: { storage: 'sessionStorage' } }}`

Need multi-device sync? Write a server adapter.

**6/** Full tutorial with all the code:
https://usertourkit.com/blog/tour-progress-persistence-localstorage

Covers: step resume, completion tracking, "don't show again" checkbox, SSR handling, cross-tab sync, and tour versioning.
