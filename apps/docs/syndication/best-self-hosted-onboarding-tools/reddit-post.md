## Subreddit: r/webdev (primary), r/reactjs (secondary)

**Title:** I compared 8 self-hosted onboarding tools for EU data sovereignty — here's what I found

**Body:**

I've been researching self-hosted onboarding tools for a project that needs to keep user behavior data inside the EU. The GDPR fine situation is getting wild (Meta: EUR 1.2B, Uber: EUR 290M, both for US data transfers), and Microsoft's legal director literally told the French Parliament they can't guarantee EU data protection from US government access.

The market splits into two camps: client-side JS libraries (Shepherd.js, Driver.js, React Joyride, Tour Kit, Intro.js) and Docker-deployable platforms (Usertour, Shepherd Pro, Guidefox).

Key takeaway that nobody seems to talk about: client-side libraries are architecturally the best option for data sovereignty because no user data ever hits a server at all. There's nothing to transfer, nothing to audit. The platforms give you visual builders and analytics, but then you're running a server and you become the data processor under GDPR.

Other things I learned:
- Intro.js uses AGPL which is its own compliance headache for commercial use
- Shepherd.js has the best accessibility among traditional libraries (keyboard nav, focus trapping, ARIA)
- None of the platforms document their accessibility story well
- Bundle sizes are almost never compared in these roundups

I wrote up the full comparison with a decision framework: https://usertourkit.com/blog/best-self-hosted-onboarding-tools

Disclosure: I work on Tour Kit, which is one of the tools in the list. I tried to be fair but you should know that going in.
