## Title: Onboarding Chrome Extensions Compared: JS payload, accessibility, and selector breakage (2026)

## URL: https://usertourkit.com/blog/best-onboarding-chrome-extensions

## Comment to post immediately after:

I built Tour Kit (open-source React tour library), so I have obvious bias here. That said, I tried to make this comparison useful regardless of which tool you pick.

The two findings that surprised me most: (1) JS payloads range from 65KB to 180KB gzipped, with several exceeding Google's 100KB recommendation for third-party scripts on their own, and (2) not a single existing listicle mentions WCAG compliance, even though these tools overlay your UI and intercept keyboard focus.

The selector breakage problem is well-known but rarely quantified. Chrome extension builders record CSS selectors to anchor tooltips. Any DOM restructuring breaks them. Teams at scale report spending hours per sprint re-recording flows after UI updates.

Methodology: Vite 6 + React 19 + TypeScript 5.7 project. Same 5-step tour in each tool. Measured via Chrome DevTools Network tab. Accessibility tested with keyboard navigation and VoiceOver on macOS.
