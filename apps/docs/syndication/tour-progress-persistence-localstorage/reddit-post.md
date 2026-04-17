## Subreddit: r/reactjs

**Title:** I wrote up how to persist product tour progress with localStorage (step resume, SSR-safe, pluggable backends)

**Body:**

Been working on a headless tour library and ran into the persistence problem: user refreshes mid-tour, progress is gone. Figured others building custom onboarding flows hit the same thing.

The approach I landed on: a `usePersistence` hook that stores step index, completion state, and "don't show again" flags under a namespaced key prefix (`tourkit:step:{tourId}`). Total storage is about 200 bytes per tour. The hook uses lazy initialization (function in `useState`) so it only reads localStorage once on mount, not every render.

The SSR part was the trickiest. Instead of `typeof window === 'undefined'` guards everywhere, I built a storage adapter factory. On the server it returns a no-op (all reads return null, writes are ignored). On the client it hands back real localStorage. The component code doesn't need to know which environment it's in.

The storage backend is pluggable too. Same three-method interface (`getItem`, `setItem`, `removeItem`) for localStorage, sessionStorage, cookies, or a custom fetch-based adapter for multi-device sync. Swap it in one line of provider config.

The gotcha nobody warns you about: when you change your tour steps (add, remove, reorder), the persisted step index becomes stale. A user on step 3 of your old 4-step tour is now on step 3 of your new 5-step tour with completely different content. I solve this with a version number that resets persistence on mismatch.

Full writeup with all the code: https://usertourkit.com/blog/tour-progress-persistence-localstorage

Curious if anyone has dealt with cross-tab sync for this. I'm using the native `storage` event but wondering if there's a cleaner React-native approach.
