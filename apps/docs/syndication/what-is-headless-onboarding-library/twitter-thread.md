## Thread (6 tweets)

**1/** No one has defined "headless onboarding library" yet.

So I wrote the definition. Here's what it means, why it matters for React teams with design systems, and when you should (and shouldn't) use one.

**2/** A headless onboarding library manages step sequencing, persistence, keyboard nav, and ARIA attributes without rendering any UI.

You supply the tooltip. You supply the overlay. Your design tokens, your components.

Same pattern as Radix UI, but for product tours.

**3/** The bundle size difference is real:

Styled (React Joyride): ~37KB gzipped
Headless (Tour Kit core): <8KB gzipped

That's 200-400ms of extra parse time on mobile during the exact moment you're trying to make a first impression.

**4/** The trade-off: styled libraries get you a working tour in 5-15 minutes.

Headless takes 30-60 min because you write the tooltip component.

If you don't have a design system, styled might be the right call. Not everything needs to be headless.

**5/** When to go headless:
- Running Tailwind/shadcn with a design system
- Bundle budget under 15KB for tours
- Already using Radix, React Aria, or Headless UI
- Need WCAG 2.1 AA without auditing vendor CSS

**6/** Full breakdown with comparison table, code examples, and decision framework:

https://usertourkit.com/blog/what-is-headless-onboarding-library

(I built Tour Kit, one of the headless options. Bias disclosed in the article.)
