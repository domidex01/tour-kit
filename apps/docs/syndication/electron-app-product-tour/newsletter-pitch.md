## Subject: Product tours in Electron apps — desktop onboarding guide

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a tutorial covering how to build product tours in Electron desktop apps with React. It addresses the desktop-specific challenges that web-focused guides miss: main/renderer process coordination, native OS menus that can't be targeted by DOM overlays, multi-window tour synchronization via IPC, and offline persistence using electron-store instead of localStorage.

Includes working TypeScript code for all 5 steps, plus a comparison table of tour libraries (React Joyride, Shepherd.js, Driver.js, Reactour) evaluated for Electron compatibility. As of April 2026, Electron powers 8,000+ Mac App Store apps and there's no dedicated guide for this use case.

Link: https://usertourkit.com/blog/electron-app-product-tour

Thanks,
Domi
