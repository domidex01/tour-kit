## Subreddit: r/reactjs

**Title:** I compared 8 onboarding tools for mobile + web support. Only 4 have real native mobile SDKs.

**Body:**

I spent time evaluating onboarding tools that work across both web and mobile, and the results were more polarized than I expected.

The short version: "mobile support" means very different things depending on the vendor. Appcues, Pendo, Plotline, and Whatfix ship actual native SDKs for iOS/Android. Everyone else (Chameleon, UserGuiding, Userflow) is web-only with responsive design. Chameleon at least lets you toggle tours off for mobile viewports, which is honest if not helpful.

The pricing cliff caught me off guard. Web-only tools: $0-69/month. Native mobile SDK: $299-999/month minimum. Enterprise (Pendo, Whatfix): $48K+/year. There's almost nothing in between.

One gap I didn't expect: none of the tools (except Tour Kit, which I built so take this with skepticism) publicly document WCAG compliance for mobile. WCAG 2.2 now explicitly covers mobile with nine new success criteria. That seems like a big miss for an industry handling first-time user experiences.

Quick platform coverage for the tools that have native SDKs:
- Appcues: iOS, Android, React Native, Flutter, Ionic
- Pendo: iOS, Android, React Native, Flutter, Jetpack Compose
- Plotline: iOS, Android, React Native, Flutter, Jetpack Compose, mobile web, web (7 platforms)
- Whatfix: iOS, Android (no RN/Flutter)

Full comparison with pricing and detailed breakdowns: https://usertourkit.com/blog/best-onboarding-tools-mobile-web

Happy to answer questions about any of the tools. What's everyone else using for cross-platform onboarding?
