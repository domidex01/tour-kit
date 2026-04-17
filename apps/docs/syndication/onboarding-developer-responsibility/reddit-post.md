## Subreddit: r/reactjs

**Title:** Who actually owns onboarding at your company? (A case for developer-owned product tours)

**Body:**

I've been thinking about this for a while and wanted to get the community's take.

At most SaaS companies I've worked at, the PM configures product tours in some no-code tool (Appcues, Userpilot, etc.), and those tours inject third-party scripts into production. When the script causes a performance regression or breaks after a React upgrade, the PM doesn't get paged. The developer does.

There's an accountability gap here that doesn't get talked about enough. ProductPlan actually acknowledged it: "Product management may not feel the same level of ownership or accountability [for onboarding] as they do for other features."

Some numbers that made me rethink the whole approach:
- Average page already loads ~449KB of third-party JS (HTTP Archive). Each no-code onboarding tool adds 50-500KB on top
- Page load going from 1s to 3s = 32% more bounces (Google's data)
- WCAG 2.1 SC 4.1.2 explicitly says accessibility for custom UI components is "primarily for web authors who develop or script" them. Product tours are custom UI components

I ended up building a code-first onboarding library (Tour Kit, <8KB gzipped) because I wanted the onboarding code to live in the same repo, go through the same CI checks, and follow the same accessibility standards as everything else.

Not saying no-code tools are never the right call. Early-stage startups with 2-person teams probably can't justify developer time on onboarding. And PMs should still own the strategy (what to show, when, to whom). The argument is about implementation ownership.

Curious how others handle this. Does your team treat onboarding as engineering-owned code, or is it configured by PMs in a third-party tool?

Full writeup with code examples and a comparison table: https://usertourkit.com/blog/onboarding-developer-responsibility

---

## Alternate post for r/webdev

**Title:** The accountability gap in product onboarding: who gets paged when the tour breaks?

**Body:**

(Same body, replace "React upgrade" with "framework upgrade" and remove React-specific references)
