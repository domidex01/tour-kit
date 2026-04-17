## Subject: Tutorial — Routing React product tour events into GTM (28 lines of TypeScript)

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi,

I wrote a tutorial on pushing product tour lifecycle events (start, step view, complete, skip) into Google Tag Manager using a 28-line TypeScript analytics plugin. Covers the full GTM setup — Data Layer Variables, Custom Event Triggers, GA4 tags, Preview Mode debugging, and Consent Mode v2.

The main gotcha developers hit: GTM's History Change trigger fires 2-3x per React Router navigation. The tutorial shows why Custom Event triggers are the only reliable option for SPAs.

Link: https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager

Thanks,
Domi
