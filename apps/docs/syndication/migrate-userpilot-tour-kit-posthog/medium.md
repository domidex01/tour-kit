# Migrating from Userpilot to an open-source stack

## How we replaced a $799/month onboarding platform with Tour Kit and PostHog

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-userpilot-tour-kit-posthog)*

Your Userpilot contract renewal is coming up. The Growth plan costs $799/month as of April 2026, and your team already pays for PostHog (or Mixpanel, or Amplitude) for product analytics. You're paying twice for event tracking you only use once.

That's the pattern we keep hearing from teams who migrate. Userpilot bundles analytics, session tracking, and in-app guidance into one platform. The problem is most engineering teams already have better analytics elsewhere.

Tour Kit is a headless React product tour library (core under 8KB gzipped) that handles the onboarding UX layer. PostHog handles analytics and experimentation. Together they replace Userpilot at a fraction of the cost.

**Disclosure:** We built Tour Kit. Every claim is verifiable against npm and GitHub.

---

## Why teams leave Userpilot

Userpilot has a 4.6/5 rating on G2 with 905 reviews. Teams don't leave because it's bad. They leave because the architecture creates friction:

**Analytics duplication.** Your team already uses PostHog or Amplitude. You're maintaining two event pipelines for the same data.

**Cost at scale.** Starter at $299/month, Growth at $799/month. Average Growth plan cost runs ~$8,500/year.

**SPA friction.** Userpilot requires calling `userpilot.reload()` on every URL change in React apps. Miss a call and your tour silently breaks.

**Limited customization.** G2 reviewers flag targeting difficulties: "Hard to target specific elements or get the flow to pop up...You need to test it a lot."

To be fair: Userpilot's visual flow builder is genuinely useful for non-technical product managers. Tour Kit doesn't have a visual builder.

---

## The migration in 5 steps

**Step 1:** Install Tour Kit alongside Userpilot (both run simultaneously).

**Step 2:** Map your Userpilot flow configs to Tour Kit tour definitions using `createTour()` and `createStep()`.

**Step 3:** Replace Userpilot components with Tour Kit's headless React components. You write the tooltip JSX, so your design system stays intact.

**Step 4:** Test side-by-side for a week. Compare completion rates between Userpilot's dashboard and your PostHog funnel.

**Step 5:** Remove the Userpilot script and npm package. Delete all `userpilot.reload()` calls.

Budget 3-5 hours for a typical setup with 2-3 tours.

---

## What you gain and lose

**Gains:** $0-99 one-time cost (vs $3,588-9,588/year). Single analytics source of truth. Full UI control. No vendor lock-in. Tour Kit core is under 8KB gzipped.

**Losses:** No visual flow builder (every tour change requires a React developer). Smaller community. No managed hosting.

---

## Bottom line

If your engineering team owns onboarding and you already run PostHog for analytics, the migration pays for itself immediately. If your PM team creates tours independently using Userpilot's visual builder, the workflow change is real and worth weighing.

Full article with TypeScript code examples, API mapping table, and troubleshooting: [usertourkit.com/blog/migrate-userpilot-tour-kit-posthog](https://usertourkit.com/blog/migrate-userpilot-tour-kit-posthog)

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, The Startup*
