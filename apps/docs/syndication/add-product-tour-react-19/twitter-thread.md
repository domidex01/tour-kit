## Thread (7 tweets)

**1/** Most React tour libraries were built for React 16. They still use forwardRef wrappers, fight with Server Components, and ship opinionated CSS.

I wrote a tutorial on adding a product tour to a React 19 app in 5 minutes using the new primitives.

**2/** React 19 dropped the forwardRef requirement. Refs are just props now.

That means tour target elements don't need wrapper components. Pass a ref directly to your element and userTourKit picks it up. Zero boilerplate.

**3/** The bigger win: async useTransition for multi-page tours.

React 18 forced you to chain setState + useEffect to navigate routes between tour steps.

React 19 lets you do this:

startTransition(async () => {
  await router.push('/settings')
  next() // advance the tour
})

No spinners. No layout shift. isPending gives you a loading state for free.

**4/** The tutorial builds a 4-step product tour:
- Sidebar navigation
- Search bar (with Cmd+K shortcut)
- Dashboard content area
- Settings panel

Uses userTourKit (headless, under 8KB gzipped core). Works with shadcn/ui, Radix, Tailwind, anything.

**5/** React 19 feature support comparison:

- Ref as prop: userTourKit supports it. React Joyride still uses forwardRef internally.
- Async useTransition: Works with useTour().next() inside startTransition.
- Server Components: Only TourProvider needs 'use client'.
- Context as provider: No more .Provider suffix.

**6/** The honest limitation: userTourKit has no visual builder.

Non-technical teammates can't create tours without developers. If that's a dealbreaker, Appcues or Userpilot give you drag-and-drop (at $249/month).

The tradeoff: sub-8KB bundle, full design system control, native React 19 support.

**7/** Full tutorial with all code examples, troubleshooting, and FAQ:

https://usertourkit.com/blog/add-product-tour-react-19

5 minutes from npm install to a working tour. Vite 6 + React 19.1 + TypeScript 5.7.

(Disclosure: I built userTourKit.)
