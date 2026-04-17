---
title: "Why most product tour libraries break in React Strict Mode (and how to audit yours)"
published: false
description: "React Strict Mode double-invokes effects, which breaks tour libraries that rely on imperative DOM manipulation. Here are the 7 patterns that fail and a 5-point audit checklist."
tags: react, javascript, webdev, typescript
canonical_url: https://usertourkit.com/blog/why-product-tour-libraries-break-strict-mode
cover_image: https://usertourkit.com/og-images/why-product-tour-libraries-break-strict-mode.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/why-product-tour-libraries-break-strict-mode)*

# Why most product tour libraries break in strict mode

You add a product tour library to your React app. Works fine in production. Then you enable `<React.StrictMode>` and everything falls apart: overlays flash twice, tooltips render in the wrong position, keyboard listeners fire double, scroll locks freeze the page permanently. You search the library's GitHub issues and find the same advice repeated in every thread: "just remove StrictMode."

That advice is wrong. And the real problem runs deeper than most developers realize.

React Strict Mode is a development-only wrapper that stress-tests your components by double-invoking renders, effects, and state initializers. It exists to catch bugs before they reach production. But most product tour libraries were built on patterns that cannot survive this double invocation, and the resulting failures expose architectural decisions that will cause real problems in production too.

```bash
npm install @tourkit/core @tourkit/react
```

We built Tour Kit with Strict Mode compatibility as a design constraint from day one. Here's what we learned about why other libraries break, what React actually does under the hood, and how to audit your tour library before it bites you.

## What is React Strict Mode?

React Strict Mode is a development-only component wrapper (`<React.StrictMode>`) that stress-tests your application by double-invoking renders, effects, and state initializers to catch unsafe patterns before they reach production. Unlike linters or type checkers, Strict Mode runs your actual code twice and surfaces bugs that static analysis cannot detect. As of April 2026, Vite, Create React App, and Next.js all enable it by default in their project templates.

Three specific stress tests make up the Strict Mode gauntlet. Render functions and state initializers (`useState`, `useMemo`, `useReducer`) are double-invoked to catch impure rendering. Every `useEffect` goes through a mount-unmount-remount cycle to verify cleanup functions exist and work correctly. And since React 19, ref callbacks are re-run to ensure refs are properly cleaned up. None of this runs in production.

## Why strict mode compliance matters for tour libraries

Product tour libraries that break under Strict Mode aren't just inconvenient during development. They have real cleanup bugs that surface in production during route changes, code splitting, and component unmounting.

Teams that disable Strict Mode to work around library incompatibility lose three things: Fast Refresh reliability during development, preparation for React's upcoming Activity API (formerly Offscreen), and early detection of memory leaks from orphaned event listeners and DOM nodes. When a tour library tells you to remove `<React.StrictMode>`, what it's really saying is "our code has bugs we don't want you to see."

The mount-unmount-remount cycle is the one that kills tour libraries. When React mounts your component, it runs all effects. Then it simulates an unmount by running all cleanup functions. Then it mounts again, running all effects a second time. The intent is straightforward: if your effect creates a resource, the cleanup should destroy it, and the second mount should recreate it cleanly.

Here's what that looks like in practice:

```tsx
// src/hooks/use-strict-mode-demo.ts
useEffect(() => {
  console.log('effect: setting up tour overlay');
  const overlay = document.createElement('div');
  document.body.appendChild(overlay);

  return () => {
    console.log('cleanup: removing tour overlay');
    document.body.removeChild(overlay);
  };
}, []);

// In StrictMode, console output:
// 1. "effect: setting up tour overlay"    (first mount)
// 2. "cleanup: removing tour overlay"     (simulated unmount)
// 3. "effect: setting up tour overlay"    (remount)
```

If your effect has proper cleanup, this cycle is invisible. The overlay gets created, destroyed, and created again. One overlay in the DOM. But skip that cleanup function and you get two overlays, two sets of event listeners, and a debugging session that makes you question your career choices.

React's own documentation states it plainly: "If your effect breaks when it runs twice, it would have broken in production anyway. You just wouldn't have caught it during development" ([react.dev](https://react.dev/reference/react/StrictMode)).

## Why are tour libraries especially vulnerable?

Product tour libraries sit at the intersection of every pattern that Strict Mode punishes. They combine imperative DOM manipulation with global state, event listener management, scroll locking, and positioning calculations, all triggered from `useEffect` hooks that often lack cleanup. No other category of React component touches this many imperative APIs simultaneously.

Here are the seven patterns that break, ranked by how hard they are to detect:

| Pattern | What breaks | Symptom you'll see |
|---|---|---|
| Singleton tour instance (`new Tour()` in effect) | Two tour objects created; second overwrites first mid-step | Tour jumps to step 0 randomly |
| DOM overlay injection without cleanup | Two overlay `<div>` elements appended to body | Overlay flickers or has double opacity |
| `useEffect` without return for init | Tour initializes twice over stale DOM state | First step content appears then vanishes |
| Ref-guarded event listeners | Listeners added twice (React ref bug #24670) | Keyboard shortcuts fire twice per press |
| Global scroll lock | Set twice, cleanup runs in wrong order | Page stays locked after tour closes |
| Module-level step index | Index resets but side effects from first mount persist | Step counter shows wrong number |
| Popper.js instance without `.destroy()` | Two positioning instances fight each other | Tooltip jitters between two positions |

As React Query's maintainer noted in GitHub issue #24502: "even in react-query, the strict effects fires the fetch twice. We just deduplicate multiple requests." React Query was designed with idempotent operations in mind. Tour libraries were not.

## Which libraries break and how?

We tested the four most popular React tour libraries under Strict Mode in a Vite 6 + React 19 + TypeScript 5.7 project. Results aren't pretty.

**React Joyride** has the most documented Strict Mode issues. GitHub Discussion #805 ("Does it work with React 18?") captures the pattern perfectly: a developer reports breakage, and the first reply asks "Are you using strict mode?" Discussions #872 and #973 both document overlay flickering between steps, caused by the double `useEffect` cycle creating two beacon instances whose cleanup race-conditions with setup. As of April 2026, React Joyride has approximately 603K weekly npm downloads and these issues remain open.

**Shepherd.js** uses a framework-agnostic singleton `Tour` class. React wrappers instantiate this object inside `useEffect` without idempotent cleanup, meaning Strict Mode creates two `Tour` objects attached to the same container. The library itself isn't broken; the React integration pattern is.

**Driver.js** directly manipulates the DOM by adding `data-driver-*` attributes and injecting overlay elements. Under Strict Mode, the setup effect fires twice and the overlay `<div>` is appended twice before cleanup removes the first one. No GitHub issues specifically reference Strict Mode, but the architecture makes the failure inevitable.

**Intro.js** has a thin React wrapper (`intro.js-react`) that doesn't implement proper `useEffect` cleanup. The double invocation leaves orphaned Intro.js instances. The official React docs for Intro.js don't mention Strict Mode compatibility at all.

The most telling real-world example comes from Atlassian. After upgrading to React 18, their atlaskit onboarding spotlights started "appearing in the top left of the screen" or not appearing at all ([Atlassian Developer Community](https://community.developer.atlassian.com/t/react-18-strict-mode-not-working-with-portals-and-poppers/90705)). If Atlassian's own component library couldn't handle the transition, your tour library probably can't either.

## The ref bug nobody talks about

Even libraries with proper cleanup functions hit an additional layer of breakage that few developers know about. React's GitHub issue #24670 documents a bug where Strict Mode's simulated unmount does not clear `ref.current`. Tagged "Needs Investigation" since April 2024, it remains unresolved as of April 2026.

Expected behavior: refs get cleared before effect cleanup, then re-attached before effects run again (matching real unmounts). What actually happens is different. Refs persist through the simulated unmount, so code that guards listener attachment with `if (ref.current)` adds listeners twice because the ref was never nulled.

```tsx
// src/hooks/use-tour-target.ts — the pattern that leaks
useEffect(() => {
  if (targetRef.current) {
    // This runs TWICE because ref.current persists
    // through Strict Mode's simulated unmount
    targetRef.current.addEventListener('click', handleClick);
  }

  return () => {
    // Cleanup only removes ONE listener
    // The duplicate from the first mount survives
    targetRef.current?.removeEventListener('click', handleClick);
  };
}, []);
```

Developer @Razzwan summarized the frustration on the issue thread: "Everything related refs that worked in version 17 just stopped working in version 18" ([GitHub #24670](https://github.com/facebook/react/issues/24670)).

Tour libraries are particularly exposed because they rely on refs to track target DOM elements for tooltip anchoring. Every library that uses the ref-guard pattern above silently leaks event listeners in development.

## Why "just remove StrictMode" is the worst fix

The default advice on Stack Overflow and GitHub issue threads is to wrap your app without `<React.StrictMode>` or to selectively exclude components from it. Bitsrc's documentation for Hookrouter captures this pattern plainly: "you can remove the `<React.StrictMode>` component from your index.js to use Hookrouter" ([blog.bitsrc.io](https://blog.bitsrc.io/hookrouter-a-modern-approach-to-react-routing)). Tour library issues suggest the same workaround.

This is like disabling your smoke detector because it keeps going off.

Strict Mode prepares your code for three production-critical scenarios. First, Fast Refresh in Vite and Next.js uses identical mount-unmount-remount semantics, as confirmed by the React docs: "If a component or a library breaks because of occasionally re-running its effects, it won't work with Fast Refresh or other React 18 features well" ([react.dev](https://react.dev/reference/react/StrictMode)).

Second, React's upcoming Activity API (formerly Offscreen) will preserve and restore component trees without full remounting. Libraries that can't handle Strict Mode today will break when Activity ships. And third, double-invoked effects catch real bugs: leaked subscriptions, missing cleanup, race conditions that surface during route changes in production.

One frustrated developer on GitHub issue #24502 wrote: "I should not see different number of renders in dev and prod modes." They received 45 laugh reactions. But React's position is clear: the renders aren't different. Production just doesn't tell you about the bugs.

## How to audit your tour library for strict mode compliance

You don't need to read source code to catch the most common failures. Run these five checks against any tour library in a fresh Vite + React project with Strict Mode enabled:

**Check 1: Overlay count.** Open DevTools, start a tour, and count overlay `<div>` elements in the DOM. If there are two, the library doesn't clean up its DOM injection.

**Check 2: Event listener leak.** Open Chrome DevTools' "Event Listeners" tab on `document`. Start a tour, then close it. If keyboard or scroll listeners remain after the tour closes, cleanup is broken.

**Check 3: Scroll lock release.** Start a tour that locks scrolling. Close the tour. Try scrolling. If the page stays locked, the cleanup function doesn't restore `overflow`.

**Check 4: Step counter integrity.** Start a tour, advance two steps, then trigger a hot reload (save any file in Vite). If the tour resets to step 0 or shows the wrong step, state management doesn't survive remount.

**Check 5: Console noise.** Watch for `findDOMNode` deprecation warnings, duplicate effect logs, or React warnings about unmounted component state updates. These are leading indicators of Strict Mode incompatibility.

## How Tour Kit handles strict mode

Tour Kit treats every `useEffect` as a function that will run twice. That's not a workaround; it's the design constraint. Every effect that creates a resource has a cleanup function that destroys it. Every resource creation is idempotent: calling it twice produces the same result as calling it once.

```tsx
// src/components/TourOverlay.tsx — Tour Kit's approach
import { useTour } from '@tourkit/react';

function TourOverlay() {
  const { currentStep, isActive } = useTour();

  // No imperative DOM manipulation
  // No singleton instances
  // No ref-guarded event listeners
  // Just React state driving React rendering

  if (!isActive || !currentStep) return null;

  return (
    <div role="dialog" aria-label={currentStep.title}>
      {currentStep.content}
    </div>
  );
}
```

The approach is straightforward: keep tour state in React state, render tour UI with React components, and let React handle the DOM. No `document.createElement`, no `appendChild`, no manual event listeners. Positioning uses Floating UI with proper cleanup via `autoUpdate`'s return value. Keyboard navigation hooks return cleanup functions. Scroll management restores original values on unmount.

This isn't a technical achievement. It's just the way React components are supposed to work. But when we surveyed the existing tour library ecosystem, none of them followed this pattern consistently. Tour Kit's core ships at under 8KB gzipped precisely because we don't carry the imperative DOM manipulation layer that other libraries need.

One honest caveat: Tour Kit is React 18+ only. We made this tradeoff deliberately. Supporting React 16/17 would require the exact class-based and imperative patterns that break under Strict Mode. If you need React 16 support, that's a legitimate reason to choose a different library.

## FAQ

### Does React Strict Mode affect production performance?

React Strict Mode runs exclusively in development builds. The double-invocation of renders, effects, and state initializers is stripped entirely from production bundles. Your users never see or pay for Strict Mode's stress tests. The only cost is development-time computation, which on modern hardware is negligible for tour components.

### Can I wrap only some components in StrictMode to avoid tour library conflicts?

React supports partial Strict Mode wrapping where you place `<React.StrictMode>` around specific subtrees rather than the entire app. But this defeats the purpose. Tour libraries that break under Strict Mode have cleanup bugs that affect production reliability during navigation, code splitting, and route changes. Partial wrapping hides the symptom without addressing the architectural problem.

### Why did React 18 change Strict Mode to double-invoke effects?

The React team introduced the mount-unmount-remount cycle in React 18 to prepare for the Offscreen API (now called Activity). This API will let React preserve component state while removing components from the visible tree, then restore them later without remounting. Libraries that can't handle this cycle will break when Activity reaches stable release. The React Working Group explained the motivation in Discussion #19.

### Do any product tour library roundups test for Strict Mode compliance?

As of April 2026, no major comparison article or roundup tests tour libraries for Strict Mode compliance. The Userorbit 2026 open-source roundup, Chameleon's comparison, and every alternative list we reviewed evaluate bundle size, TypeScript support, and API design, but none test whether the library actually works with `<React.StrictMode>` enabled. This is a significant gap given that Vite, Create React App, and Next.js all enable Strict Mode by default in their templates.

### How can I tell if my current tour library is Strict Mode safe?

Run the five-point audit from this article: check overlay count in DevTools, verify event listener cleanup, test scroll lock release, confirm step counter integrity after hot reload, and watch for console deprecation warnings. If any check fails, the library has cleanup bugs that Strict Mode is correctly exposing. File an issue with the library maintainer referencing the specific failing check.
