## Thread (6 tweets)

**1/** Userflow starts at $240/mo for 3K MAUs and crosses $1,000/mo at 50K users.

I tested 7 alternatives on pricing, React 19 support, and accessibility. Here's what I found:

**2/** The pricing landscape:
- Userpilot: $299/mo (2K MAUs)
- Chameleon: $279/mo (2K MTUs)
- Appcues: $249/mo (1K MAUs)
- Userflow: $240/mo (3K MAUs)
- UserGuiding: $174/mo
- Tour Kit: Free / $99 one-time
- Shepherd.js: Free (AGPL)
- React Joyride: Free (MIT)

**3/** React 19 compatibility is a mess in this space.

React Joyride (603K weekly downloads) is confirmed incompatible. SaaS tools inject opaque scripts that can interfere with concurrent features.

Tour Kit and Shepherd.js (via wrapper) work with React 19.

**4/** The biggest gap nobody talks about: accessibility.

I checked every tool's docs for WCAG compliance info. Zero SaaS platforms publish it. Not one.

If you serve enterprise, government, or healthcare customers, that matters.

**5/** MAU pricing is the hidden cost.

You pay for every user who visits your app, whether they see a tour or not. A large free tier means paying for users who never trigger onboarding.

At scale, open-source alternatives save $2,880-$12,000+/year.

**6/** Full comparison with pricing tables, code examples, and a decision framework:

https://usertourkit.com/blog/best-userflow-alternatives-saas-teams

(Disclosure: I built Tour Kit. Tried to be fair about competitor strengths too.)
