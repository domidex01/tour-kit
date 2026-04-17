---
title: "React Compiler and product tours: what automatic memoization actually does to overlay UIs"
published: false
description: "We tested React Compiler with product tour libraries. Here's what happened to step-driven re-renders, DOM-ref positioning, and portal overlays under automatic memoization."
tags: react, javascript, webdev, typescript
canonical_url: https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization
cover_image: https://usertourkit.com/og-images/react-compiler-product-tours-automatic-memoization.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-compiler-product-tours-automatic-memoization)*

# React Compiler and product tours: what automatic memoization means

React Compiler hit stable v1.0 in October 2025. It analyzes your components at build time and inserts memoization automatically, eliminating most manual `useMemo` and `useCallback` calls. Meta's Quest Store saw interactions speed up 2.5x after enabling it. Expo SDK 54 ships with it on by default. Next.js 16 marks it stable.

But what does automatic memoization mean for product tour libraries? Tours sit in an unusual spot in the component tree. They depend on step-driven re-renders, portal-based overlays, DOM-ref positioning, and callback prop stability. All of those interact with the compiler in specific ways that generic "React Compiler is amazing" articles don't cover.

We tested Tour Kit with React Compiler enabled across three different app configurations. Here's what we found, what broke in other libraries, and why headless architecture turns out to be the safest bet in a compiler-first world.

```bash
npm install @tourkit/core @tourkit/react
```

## What is React Compiler and how does it work?

React Compiler is a build-time tool that analyzes React function components and hooks, then inserts granular memoization at the expression level, not just at the component or hook level. Unlike manual `useMemo` which requires developers to specify dependency arrays, the compiler builds a Control Flow Graph (CFG) of your code, identifies values safe to memoize, and inserts guards automatically. As of April 2026, it ships as stable v1.0 with support for Babel, Vite, Rsbuild, and Metro ([react.dev](https://react.dev/learn/react-compiler)).

The key difference from manual memoization: the compiler can memoize after early returns and inside conditional branches. That's impossible with `useMemo`, which must be called unconditionally per the Rules of Hooks.

Here's what the compiler does to a simple tour step component:

```tsx
// src/components/TourStep.tsx - before compilation
function TourStep({ step, onNext, onSkip }: TourStepProps) {
  const position = useStepPosition(step.target);
  const content = formatStepContent(step.content, step.index);

  if (!position) return null;

  return (
    <div style={{ top: position.y, left: position.x }}>
      <p>{content}</p>
      <button onClick={onNext}>Next</button>
      <button onClick={onSkip}>Skip</button>
    </div>
  );
}
```

The compiler sees that `content` depends only on `step.content` and `step.index`. If those haven't changed, it skips the `formatStepContent` call entirely. It also stabilizes the JSX output so React's reconciler can bail out of diffing the subtree. No `useMemo` wrapper needed. No dependency array to get wrong.

Non-compliant code (components that mutate props, read refs during render, or call setState in render) gets silently skipped. The compiler doesn't crash or error. It just leaves that component untouched. Run `npx react-compiler-healthcheck` to see what percentage of your codebase compiles cleanly.

## Why automatic memoization matters for product tour libraries

Product tours combine four patterns that interact with automatic memoization in non-obvious ways. Generic UI components (buttons, inputs, cards) don't hit these edge cases because they render statically. Tours are dynamic, positional, and deeply coupled to the DOM.

**Step-driven re-renders** are the core mechanic. When `currentStep` changes from 2 to 3, every component receiving that value as a prop must re-render to show the new tooltip, highlight the new element, and update the progress indicator. The compiler respects state changes as memoization boundaries, so this should work correctly. But if a library wraps step data in an object that gets reconstructed each render, the compiler might memoize the wrong thing.

**DOM-ref positioning** is where things get tricky. Tour libraries read `ref.current.getBoundingClientRect()` to position tooltips next to target elements. The compiler's new `refs` lint rule (shipping with `eslint-plugin-react-hooks`) specifically warns about reading refs during render. Libraries that calculate position inside the render function instead of `useLayoutEffect` will trigger warnings and potentially get skipped by the compiler.

**Portal-based overlays** are safer. `ReactDOM.createPortal` renders outside the normal tree, and compiler memoization doesn't cross portal boundaries. Backdrop components and overlay containers should be unaffected.

**Callback stability** is the subtle one. If your app passes `onNext` and `onComplete` callbacks to a tour component, the compiler will memoize those callbacks. That's usually desirable. But some libraries internally depend on callbacks being a *new* reference each render to trigger effects (an antipattern, but one that exists in the wild). And the compiler breaks that pattern silently.

## Real-world performance data from production apps

The performance gains are real, but they're concentrated in interaction speed rather than initial load.

| App | Metric | Before | After | Source |
|---|---|---|---|---|
| Meta Quest Store | Interaction speed | Baseline | 2.5x faster | [react.dev](https://react.dev/blog/2025/10/07/react-compiler-1) |
| Meta Quest Store | Page load/navigation | Baseline | Up to 12% faster | [react.dev](https://react.dev/blog/2025/10/07/react-compiler-1) |
| Sanity Studio | Render time (87% compiled) | Baseline | 20-30% reduction | [InfoQ](https://www.infoq.com/news/2025/12/react-compiler-meta/) |
| Wakelet | LCP | 2.6s | 2.4s (-10%) | [InfoQ](https://www.infoq.com/news/2025/12/react-compiler-meta/) |
| Wakelet | INP | 275ms | 240ms (-15%) | [InfoQ](https://www.infoq.com/news/2025/12/react-compiler-meta/) |
| Independent test (Nadia Makarevich) | Total blocking time (theme toggle) | 280ms | 0ms | [developerway.com](https://www.developerway.com/posts/i-tried-react-compiler) |

For product tours specifically, the INP improvement matters most. A tour tooltip that appears 240ms after clicking "Next" instead of 275ms feels noticeably snappier. Multiply that across a 7-step onboarding flow and you've shaved nearly a quarter-second off the total experience.

But there's a critical nuance. Nadia Makarevich tested the compiler on three real apps (150k, 30k, and small codebases) and found it fixed only 15-20% of re-render cases automatically. Her conclusion: "The compiler managed to fix only 1-2 cases of noticeable unnecessary re-renders out of 8-10 that I spotted" ([developerway.com](https://www.developerway.com/posts/i-tried-react-compiler)). The compiler amplifies well-structured code. It doesn't rescue poorly structured state management.

## How different tour library architectures handle the compiler

Not all tour libraries are equal under React Compiler. Architecture determines how much benefit you get and how much risk you carry.

### Framework-agnostic libraries (unaffected)

Driver.js and Shepherd.js operate outside React's render cycle. They manipulate the DOM directly with vanilla JavaScript. React Compiler doesn't process non-React code, so these libraries are completely unaffected.

### Non-headless React libraries (highest risk)

React Joyride and older Reactour versions ship pre-built tooltip and overlay components. Those internal components must also be compiler-safe. As of April 2026, most haven't been audited or pre-compiled with React Compiler.

The specific risks:

1. Internal state objects reconstructed each render may confuse memoization boundaries
2. DOM ref reads during render (for positioning) trigger the new `refs` lint rule
3. Libraries using `forceUpdate` patterns or mutable state won't compile cleanly

### Headless React libraries (best positioned)

Headless tour libraries like Tour Kit separate logic from rendering. Hooks handle step sequencing, position calculation, and state management. The consumer writes the actual JSX.

```tsx
// src/components/OnboardingTour.tsx - headless + compiler-safe
import { useTour, useStep } from '@tourkit/react';

function OnboardingTour() {
  const { currentStep, next, skip, isActive } = useTour('onboarding');
  const { position, content } = useStep(currentStep);

  if (!isActive) return null;

  return (
    <div
      className="tour-tooltip"
      style={{ top: position.y, left: position.x }}
      role="dialog"
      aria-label={`Step ${currentStep.index + 1}: ${content.title}`}
    >
      <h3>{content.title}</h3>
      <p>{content.body}</p>
      <button onClick={next}>Next</button>
      <button onClick={skip}>Skip tour</button>
    </div>
  );
}
```

Tour Kit doesn't need to ship a pre-compiled build because the consumer's components *are* the compiled units. Sanity Studio demonstrated this pattern at scale, achieving 87% compilation across 1,411 components with a 20-30% render time reduction ([InfoQ](https://www.infoq.com/news/2025/12/react-compiler-meta/)).

## The compatibility risks you should actually test for

React Compiler can break product tour libraries through three specific patterns: memoized callback identity changes, ref reads during render that get skipped by the compiler, and context value instability that causes unnecessary consumer re-renders.

### Memoized callback identity

If a tour library internally uses `useEffect` with a callback prop in the dependency array, and the compiler memoizes that callback, the effect won't re-run when the parent re-renders. This is actually correct behavior. But some libraries depend on effects firing every render as a mechanism for syncing state.

Test: step through your tour while watching the React DevTools profiler. Verify every step transition triggers the expected re-renders.

### Ref reads during render

The compiler skips components that read refs during render. If your tour library calculates tooltip position like this:

```tsx
// This pattern triggers the compiler's refs rule
function Tooltip({ targetRef }: { targetRef: RefObject<HTMLElement> }) {
  const rect = targetRef.current?.getBoundingClientRect(); // ref read in render
  return <div style={{ top: rect?.top, left: rect?.left }}>...</div>;
}
```

The component won't be compiled. Move the read into `useLayoutEffect`:

```tsx
// Compiler-safe: ref read in useLayoutEffect
function Tooltip({ targetRef }: { targetRef: RefObject<HTMLElement> }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (targetRef.current) {
      setRect(targetRef.current.getBoundingClientRect());
    }
  }, [targetRef]);

  if (!rect) return null;
  return <div style={{ top: rect.top, left: rect.left }}>...</div>;
}
```

### Context value stability

Tour libraries using React Context to propagate step state need stable context values. If your provider creates a new object each render:

```tsx
// Unstable context value: compiler may not help
<TourContext.Provider value={{ step, next, skip, isActive }}>
```

The compiler will try to memoize this, but if `step` is a new object reference each time (even with the same data), consumers will still re-render.

## How to enable React Compiler with your tour library

### Step 1: Run the health check

```bash
npx react-compiler-healthcheck
```

This scans your codebase and reports what percentage of components are compilable. Aim for 95%+.

### Step 2: Install and configure

For Vite:

```bash
npm install -D babel-plugin-react-compiler
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
});
```

For Next.js 16+:

```ts
// next.config.ts
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
```

### Step 3: Pin the version

```json
{
  "devDependencies": {
    "babel-plugin-react-compiler": "1.0.0"
  }
}
```

### Step 4: Profile your tours

Open React DevTools, enable the profiler, and step through your tour flow with the compiler enabled. Compare render counts and render durations against a build without the compiler.

## Common mistakes to avoid

**Don't remove existing `useMemo`/`useCallback` calls preemptively.** Leave manual memoization in place. Removing it can change which code paths the compiler memoizes, and it can alter `useEffect` dependency arrays in subtle ways.

**Don't assume the compiler fixes all re-render problems.** Independent testing shows it catches 15-20% of cases automatically. The remaining 80% require architectural fixes.

**Don't enable the compiler globally without testing.** Start with specific routes or components using the compiler's opt-in directives.

**Don't ignore the new ESLint rules.** The `eslint-plugin-react-hooks` recommended preset now includes `set-state-in-render`, `set-state-in-effect`, and `refs` rules.

## Bundle size: the trade-off nobody mentions

The compiler adds runtime overhead. Each memoization guard costs about 0.02 kB, and the compiler runtime itself adds roughly 1 kB.

For product tour libraries, the math works out in your favor. Tour Kit's core ships at under 8 kB gzipped. The compiler's ~1 kB overhead is a 12.5% increase in absolute terms, but the INP improvement from memoized tour transitions more than compensates. Wakelet saw their INP drop from 275ms to 240ms, a 15% improvement that directly affects Core Web Vitals scores.

## FAQ

### Does React Compiler work with product tour libraries?

React Compiler works with product tour libraries that follow the Rules of React. Headless libraries like Tour Kit compile cleanly. Framework-agnostic libraries (Driver.js, Shepherd.js) aren't affected. Non-headless React libraries carry the most risk.

### Should I remove useMemo and useCallback after enabling React Compiler?

Keep existing `useMemo` and `useCallback` calls in place. Removing them can change compilation output and affect `useEffect` dependency arrays. New code written after enabling the compiler doesn't need manual memoization.

### How much does React Compiler improve product tour performance?

React Compiler primarily improves interaction performance (INP) rather than initial load times. Production data from Wakelet shows a 15% INP improvement (275ms to 240ms). The compiler fixes 15-20% of unnecessary re-renders automatically.

### Is React Compiler stable enough for production in 2026?

React Compiler v1.0 shipped stable on October 7, 2025. As of April 2026, it's production-ready and battle-tested at Meta. Expo SDK 54 enables it by default, and Next.js 16 marks compiler support as stable.

### What happens if a component doesn't follow Rules of React?

React Compiler silently skips non-compliant components. No build error, no crash, no runtime exception. The component renders exactly as before, just without automatic memoization. Run `npx react-compiler-healthcheck` to see your compilable percentage.
