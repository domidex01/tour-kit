Most product tour analytics setups break in SPAs.

GTM's History Change trigger fires 2-3 times per React Router navigation. The `event` key gets forgotten in dataLayer pushes (GTM stores data but no tag fires). Parameter names diverge between developers. Over 60% of GA4 implementations have configuration issues.

I wrote a tutorial on routing product tour events into Google Tag Manager with a 28-line TypeScript plugin. The approach: a single analytics plugin that receives typed event objects and pushes them to GTM's dataLayer with consistent snake_case naming. Custom Event triggers handle the routing.

Covers the full GTM setup — variables, triggers, GA4 tags, Preview Mode debugging, Consent Mode v2 for EU compliance, and SSR gotchas for Next.js App Router.

https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager

#react #javascript #googletagmanager #analytics #webdevelopment #productmanagement
