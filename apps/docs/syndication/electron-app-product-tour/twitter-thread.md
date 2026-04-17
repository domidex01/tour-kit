## Thread (6 tweets)

**1/** There's no guide for building product tours in Electron desktop apps. Every tutorial assumes a browser context. So I wrote one covering the 3 things that are genuinely different from web.

**2/** Problem 1: Native menus live outside the DOM.

Electron's Menu and MenuItem are rendered by the OS. No CSS overlay can target them. You either describe them textually or switch to a custom HTML title bar for full DOM access.

**3/** Problem 2: Multi-window coordination.

Each BrowserWindow has its own renderer process and React tree. A single TourProvider can't span windows. Solution: IPC broadcasts tour events from the main process to all windows.

**4/** Problem 3: localStorage breaks on auto-update.

Electron's auto-updater can clear localStorage. Use electron-store (JSON file in userData) instead. It persists across updates and works fully offline.

**5/** Other gotchas I hit:
- Global shortcuts (Escape, arrow keys) conflict with tour navigation
- CSP headers can block inline styles from tour overlays
- Lazy-loaded panels aren't in the DOM when the tour starts

All fixable with the patterns in the guide.

**6/** Full tutorial with TypeScript code, library comparison table, and troubleshooting:

https://usertourkit.com/blog/electron-app-product-tour

Electron powers 8,000+ Mac App Store apps as of 2026. Desktop onboarding deserves its own guide.
