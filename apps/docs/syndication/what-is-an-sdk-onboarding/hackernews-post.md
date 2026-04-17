## Title: What is an SDK? How onboarding SDKs work

## URL: https://usertourkit.com/blog/what-is-an-sdk-onboarding

## Comment to post immediately after:

I wrote this because the term "SDK" gets used inconsistently in the JavaScript ecosystem. Sometimes it means a full platform toolkit (Android SDK, AWS SDK), sometimes it's just two npm packages in a trench coat.

The article breaks down SDK vs API vs library with a comparison table, then gets specific about onboarding SDKs: what they do at the code level, the layered architecture pattern (core -> framework adapter -> extensions), and how tree-shaking works when you only need a subset of the toolkit.

Some data points: building a basic 5-step tooltip tour from scratch takes roughly 40-60 hours when you account for element targeting, scroll behavior, positioning, focus trapping, and progress persistence. Onboarding SDK bundle sizes range from 5KB (Driver.js, vanilla JS) to 37KB (React Joyride, fully styled).

Disclosure: I built Tour Kit, one of the SDKs referenced. The glossary-style explanation is framework-agnostic though. Happy to answer questions about SDK architecture patterns.
