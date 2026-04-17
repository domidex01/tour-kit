## Title: Product tours in Electron apps: what's different from web

## URL: https://usertourkit.com/blog/electron-app-product-tour

## Comment to post immediately after:

I wrote this after struggling to find any guidance on building product tours specifically for Electron desktop apps. The web has plenty of React tour library tutorials, but they all assume a single-page browser context.

The three desktop-specific problems I ran into:

1. Native OS menus (Electron's Menu API) exist outside the DOM entirely, so no CSS overlay can target them. The only options are textual descriptions pointing at the title bar area, or switching to a custom HTML-rendered title bar.

2. Multi-window Electron apps need IPC to synchronize tour state across BrowserWindows. Each window runs its own renderer process and React tree.

3. localStorage isn't durable across Electron auto-updates. electron-store (JSON file in userData directory) is the reliable alternative and works offline.

The guide uses Tour Kit (a headless React tour library I built — under 12KB gzipped), but the Electron-specific patterns apply regardless of which library you use. The comparison table in the article covers React Joyride, Shepherd.js, Driver.js, and Reactour for Electron compatibility.

Electron powers 8,000+ Mac App Store apps as of 2026, so I was surprised this gap in documentation existed.
