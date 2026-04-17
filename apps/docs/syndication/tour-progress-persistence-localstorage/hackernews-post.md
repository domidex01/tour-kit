## Title: Persisting React product tour progress with localStorage: SSR-safe adapters and pluggable backends

## URL: https://usertourkit.com/blog/tour-progress-persistence-localstorage

## Comment to post immediately after:

I built Tour Kit, a headless product tour library for React, and wrote up the persistence approach we landed on.

The core idea: a storage adapter factory that returns a no-op on the server and real localStorage on the client. This avoids the "window is not defined" crash in Next.js/Remix without wrapping everything in useEffect or dynamic imports. The Storage interface is three methods (getItem, setItem, removeItem) that can return Promises, so you can swap to a server backend for multi-device sync.

The non-obvious problem was tour versioning. When you change your steps array after deployment, persisted step indices become stale. A user on step 3 of the old tour gets step 3 of the new tour, which is a completely different screen. The fix is storing a version number alongside the step index and resetting on mismatch.

Total localStorage usage is about 200 bytes per tour. We measured read times at 0.02ms on a MacBook Pro and under 0.1ms on a low-end Android device. The synchronous API isn't a bottleneck because tour step changes are deliberate user actions, not high-frequency state updates.

Would love to hear if anyone's solved cross-tab tour sync more elegantly than the native storage event.
