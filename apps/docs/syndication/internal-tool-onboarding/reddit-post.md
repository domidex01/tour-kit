## Subreddit: r/reactjs

**Title:** I wrote a guide on building product tours for internal tools (role-based, accessible, code-owned)

**Body:**

Most product tour content focuses on customer-facing SaaS onboarding. But internal tools get the worst training experience: a Confluence page nobody reads, a 45-minute screen share on day one, then two weeks of Slack questions.

I put together a guide on building in-app training for internal tools using React. The key patterns:

- **Role-based tours** that show each department only what they need (sales sees the pipeline, finance sees reporting, support sees the ticket queue)
- **First-time user detection** using localStorage or a backend flag so tours trigger automatically and never repeat
- **Change tours** keyed to version numbers that fire once per release to show what moved after deploys
- **Accessibility** that actually passes enterprise audits (focus management, `role="dialog"`, keyboard nav)

Some stats that surprised me during research: only 12% of US workers rate their onboarding favorably (Gallup), and structured onboarding cuts time-to-competency from 8-12 months to 4-6 months (SHRM).

The code examples use Tour Kit (<8KB gzipped), but the patterns work with React Joyride or any tour library. Full article with comparison table, analytics tracking code, and common mistakes: https://usertourkit.com/blog/internal-tool-onboarding

Interested to hear how others handle training for internal tools. Do you use product tours, or is it still the "ask your buddy" approach?
