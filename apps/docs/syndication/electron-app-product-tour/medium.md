# How to add product tours to your Electron desktop app

*A step-by-step guide for React developers building desktop onboarding*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/electron-app-product-tour)*

Desktop apps built on Electron still ship with the same onboarding problem as web apps: users open your tool, stare at a complex interface, and close it. The difference is that Electron adds complexity that web-only tour libraries don't handle. You have a main process that can't render tooltips, native menus that DOM overlays can't target, and multi-window layouts where a single-page tour falls apart.

As of April 2026, Electron powers over 8,000 apps on the Mac App Store alone. Yet no guide covers the specific challenges of building product tours in this environment.

This tutorial walks through building a product tour using Tour Kit, a headless React tour library, covering five key areas:

1. Installing in Electron's renderer process (works with Context Isolation out of the box)
2. Defining tour steps with `data-tour` attributes
3. Detecting first-run via `electron-store` and IPC
4. Handling keyboard conflicts between global shortcuts and tour navigation
5. Solving Electron-specific edge cases: native menus, multi-window coordination, and offline assets

The core challenge: Electron's `Menu` and `MenuItem` render through the OS, not the DOM. No web-based tour library can highlight a native menu item. The workaround is pointing users to the title bar area and describing actions textually, or using a custom HTML-rendered title bar.

For multi-window apps, IPC synchronizes tour state across BrowserWindows since each window has its own renderer process and React tree.

Performance-wise, Tour Kit's core is under 8KB gzipped. For an Electron app already shipping 80-150MB, that's negligible. The real risk is blocking startup, so lazy-loading tour components with `React.lazy()` is critical.

Full tutorial with all code examples, a library comparison table, and troubleshooting guide: [usertourkit.com/blog/electron-app-product-tour](https://usertourkit.com/blog/electron-app-product-tour)

*Submit to: JavaScript in Plain English, Better Programming, or The Startup on Medium.*
