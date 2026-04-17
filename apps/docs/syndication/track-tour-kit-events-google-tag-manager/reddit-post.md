## Subreddit: r/reactjs

**Title:** I wrote a 28-line TypeScript plugin to push product tour events into Google Tag Manager

**Body:**

I've been working on hooking product tour analytics into GTM for a React app and figured I'd share the approach since most guides only cover GA4 directly.

The core idea: instead of scattering `window.dataLayer.push()` calls across your tour components, you write a single analytics plugin that receives structured event objects and maps them to GTM's dataLayer. 28 lines of TypeScript. Each push includes the `event` key (without it, GTM stores data but no trigger fires), snake_case parameter names matching GA4's conventions, and the tour/step metadata.

On the GTM side, you create Data Layer Variables for the parameters, Custom Event Triggers for each event name (`tour_started`, `step_viewed`, `tour_completed`, etc.), and GA4 Event Tags to forward everything.

The biggest gotcha I hit: don't use GTM's History Change trigger for React apps. React Router dispatches 2-3 history events per navigation, so your trigger fires multiple times per route change. Custom Event triggers work correctly because they only fire on explicit `dataLayer.push` calls.

Other things worth knowing:
- Event names are case-sensitive in GTM (`tour_started` ≠ `Tour_Started`)
- You need `window.dataLayer = window.dataLayer || []` before any push, but never reassign with `= []` after GTM loads
- For Next.js App Router, guard the analytics init with `typeof window !== 'undefined'`
- If you're running both a direct GA4 plugin and a GTM plugin, you'll get double events

Full writeup with code, GTM configuration tables, consent mode setup, and debugging walkthrough: https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager

Happy to answer questions about the GTM config or the plugin pattern.
