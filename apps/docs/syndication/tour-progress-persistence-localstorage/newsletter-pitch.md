## Subject: How to persist React product tour progress with localStorage (tutorial)

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a tutorial on persisting product tour state across page refreshes in React, covering a storage adapter pattern that handles SSR (no "window is not defined" errors), pluggable backends (localStorage, sessionStorage, cookies, or custom server adapters), and tour versioning to avoid stale step indices after deployment.

The approach uses a three-method Storage interface where each method can return a Promise, making it easy to swap from localStorage to a server backend for multi-device sync. Total storage per tour: about 200 bytes.

Link: https://usertourkit.com/blog/tour-progress-persistence-localstorage

Thanks,
Domi
