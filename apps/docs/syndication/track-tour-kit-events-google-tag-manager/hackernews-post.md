## Title: Routing product tour events into Google Tag Manager with a 28-line TypeScript plugin

## URL: https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager

## Comment to post immediately after:

I wrote this after debugging GTM integrations with product tours in React apps. The main issues I kept hitting:

1. GTM's History Change trigger fires 2-3 times per React Router navigation (popstate + pushstate). Custom Event triggers are the only reliable option for SPAs.

2. The `event` key is mandatory in every `dataLayer.push` call. Without it, GTM stores the data but no trigger fires. This isn't obvious from the GTM UI.

3. Over 60% of GA4 implementations have configuration issues (per Tatvic Analytics, 2026). Most stem from inconsistent parameter naming across `dataLayer.push` calls made by different developers.

The approach: a single analytics plugin that implements a `track` method, receives typed event objects, and pushes them to `window.dataLayer` with consistent snake_case naming. 28 lines total. GTM Custom Event triggers handle the routing to GA4, Google Ads, or whatever other tags you need.

The article includes the full GTM configuration (variables, triggers, tags), a Preview Mode debugging walkthrough, and Consent Mode v2 considerations for EU users.
