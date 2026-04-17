## Subject: Tour Kit + Sentry integration: catching silent product tour failures

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a tutorial on wiring React product tour lifecycle events to Sentry breadcrumbs and error boundaries, so tour failures surface in dashboards instead of support tickets. It covers the callback-to-breadcrumb mapping, scoped tags for filtering tour-only errors, and a Suspense boundary gotcha that causes silent crashes.

Your readers working on onboarding or error monitoring would find the pattern useful — it's 60 lines of TypeScript and works with Sentry's free tier.

Link: https://usertourkit.com/blog/tour-kit-sentry-error-tracking

Thanks,
Domi
