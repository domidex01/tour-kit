## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote a tutorial on pushing product tour events into GTM from a React app. 28 lines of TypeScript for the analytics plugin, plus the full GTM configuration (variables, triggers, GA4 tags). Main gotcha: don't use History Change triggers in React — they fire 2-3x per navigation. Custom Event triggers are the way.

https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager

If anyone has experience with GTM + SPAs, curious how you handle consent mode with custom events.
