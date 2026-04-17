## Title: Why most product tour libraries break in React Strict Mode

## URL: https://usertourkit.com/blog/why-product-tour-libraries-break-strict-mode

## Comment to post immediately after:

I tested React Joyride, Shepherd.js, Driver.js, and Intro.js under React 18/19 Strict Mode. All four have patterns that don't survive the mount-unmount-remount cycle that Strict Mode uses to stress-test effects.

The main finding: tour libraries uniquely combine singleton instances, imperative DOM injection, ref-guarded listeners, and scroll locks — all from effects that typically lack cleanup. Each pattern individually would be a minor issue, but together they make tour components one of the hardest categories to get right under Strict Mode.

The most technically interesting part is React's unresolved bug #24670 (open since April 2024): Strict Mode's simulated unmount doesn't clear ref.current. Even libraries with proper cleanup can leak event listeners through the ref-guard pattern because the ref persists when it shouldn't.

I also found that no existing tour library comparison or roundup tests for Strict Mode compliance at all — they evaluate bundle size, TypeScript support, and API design, but not whether the library works with StrictMode enabled. Given that Vite, CRA, and Next.js all enable it by default, this seems like a significant gap.

The article includes a 5-point audit checklist any developer can run to test their tour library in about 2 minutes.

Disclosure: I maintain Tour Kit, which is built around Strict Mode compliance. The audit checklist is library-agnostic.
