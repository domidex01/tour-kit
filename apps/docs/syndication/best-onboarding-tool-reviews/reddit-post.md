## Subreddit: r/reactjs

**Title:** I compared 10 onboarding/product tour tools using G2 + Capterra data and found some interesting gaps

**Body:**

I spent a few days pulling G2 and Capterra scores for onboarding tools and cross-referencing them with what developers actually use on npm. A few things surprised me.

First, open-source tools are completely invisible on review platforms. Shepherd.js has 13K GitHub stars and React Joyride has 7.6K, but neither has a G2 or Capterra profile. Product managers evaluating tools on G2 literally can't see the options most developers install.

Second, accessibility is a blind spot across the entire category. I searched both platforms for any onboarding tool mentioning WCAG, ARIA, or keyboard navigation in reviews. Zero results. Not one.

Third, React Joyride (still the most downloaded React tour library by npm numbers) hasn't shipped a stable React 19 compatible release. The last stable publish was November 2024. There's a `next` branch but it doesn't work reliably.

On the commercial side: UserGuiding leads G2 at 4.7/5, Chameleon has earned G2 Leader for five consecutive seasons, and the Capterra average entry price for onboarding software is $79/month. Most of the bigger players (Appcues, Pendo, Chameleon) hide pricing behind "contact sales."

Full writeup with a comparison table and individual tool breakdowns: https://usertourkit.com/blog/best-onboarding-tool-reviews

Disclosure: I built Tour Kit (one of the tools on the list), so take the ranking with appropriate skepticism. But the G2/Capterra data and npm numbers are all verifiable.
