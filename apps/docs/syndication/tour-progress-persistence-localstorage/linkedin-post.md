Product tours that forget where users left off are worse than no tour at all.

I wrote a tutorial on persisting React product tour state with localStorage. The approach: a storage adapter pattern where server = no-op, client = real localStorage. No SSR errors, no `typeof window` checks in component code.

The non-obvious problem is tour versioning. When you deploy new steps, persisted indices go stale. A user on step 3 of your old tour sees step 3 of the new tour with completely different content. The fix is a version number that resets persistence on mismatch.

Total localStorage usage: about 200 bytes per tour. Read time: 0.02ms. The storage backend is pluggable, same three-method interface for localStorage, sessionStorage, cookies, or a server adapter for multi-device sync.

Full tutorial with code examples: https://usertourkit.com/blog/tour-progress-persistence-localstorage

#react #javascript #webdevelopment #producttours #opensource
