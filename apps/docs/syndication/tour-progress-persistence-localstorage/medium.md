# How to Save Product Tour Progress with localStorage in React

*Your users shouldn't have to restart onboarding because they refreshed the page.*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-progress-persistence-localstorage)*

A user clicks through three steps of your onboarding tour, gets pulled into a Slack thread, and refreshes the page. The tour starts over from step one. They close it and never come back.

Most React tour libraries treat persistence as an afterthought. Tour Kit takes a different approach: persistence is a first-class config option that works with localStorage, sessionStorage, cookies, or any custom backend.

## The problem

Product tour platforms like Appcues and Userflow all save progress automatically. But if you're building tours in React with an open-source library, you're usually on your own. You end up wiring localStorage calls into event handlers, dodging SSR errors in Next.js, and hoping key names don't collide.

## The solution: a persistence hook

Tour Kit's `usePersistence` hook stores five pieces of state under a namespaced key prefix: current step index, completed tour IDs, skipped tour IDs, "don't show again" flags, and tour version markers. Total storage per tour: about 200 bytes.

The hook handles SSR automatically. On the server, it returns a no-op adapter. On the client, it reads from localStorage. No `typeof window` guards needed.

## What you can swap in one line

The storage backend is pluggable. Change `storage: 'localStorage'` to `'sessionStorage'` for ephemeral preview tours, `'cookie'` for enterprise environments that block localStorage, or pass a custom object with `getItem`/`setItem`/`removeItem` methods for server-side persistence.

Full tutorial with 5 step-by-step code examples, troubleshooting for common issues (SSR errors, stale step indices after deployment, cross-tab sync), and a pluggable adapter pattern:

[Read the full article on usertourkit.com](https://usertourkit.com/blog/tour-progress-persistence-localstorage)

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
