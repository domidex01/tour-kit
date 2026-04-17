## Subreddit: r/electronjs (primary), r/reactjs (secondary)

**Title:** I wrote a guide on adding product tours to Electron apps — here's what's different from web

**Body:**

I've been working on adding onboarding tours to an Electron app and realized there's basically zero guidance out there for the desktop-specific challenges. Every tutorial assumes you're building for a browser.

Here are the three things that tripped me up that don't apply to web:

**1. Native menus live outside the DOM.** Electron's `Menu` and `MenuItem` are rendered by the OS. No DOM-based tour overlay can highlight them. You either point to the title bar area and describe the action in text, or you switch to a custom HTML title bar where you get full DOM access.

**2. Multi-window coordination is tricky.** Each BrowserWindow has its own renderer process and React tree. A single `TourProvider` can't span windows. The solution is IPC-based state synchronization — the main process broadcasts tour events to all windows.

**3. localStorage isn't reliable across auto-updates.** Electron's auto-updater can clear localStorage in certain scenarios. `electron-store` (backed by a JSON file in `userData`) persists across updates and works offline.

Some other things I ran into: global shortcuts conflicting with tour keyboard navigation (Escape especially), CSP headers blocking inline styles from tour overlays, and lazy-loaded panels not being in the DOM when the tour starts.

I wrote the full thing up with working TypeScript code examples, a comparison of tour libraries for Electron (bundle size, tree-shaking, offline support), and troubleshooting for common issues.

Full article: https://usertourkit.com/blog/electron-app-product-tour

Would be curious if anyone else has tackled desktop onboarding and what patterns worked for you.
