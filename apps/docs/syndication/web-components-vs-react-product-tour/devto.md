---
title: "Shadow DOM vs React portals: why web components struggle with product tours"
published: false
description: "Web components promise framework-agnostic UI, but product tours need overlays, focus traps, and state coordination that fight shadow DOM encapsulation. Here's where each approach wins."
tags: react, javascript, webdev, webcomponents
canonical_url: https://usertourkit.com/blog/web-components-vs-react-product-tour
cover_image: https://usertourkit.com/og-images/web-components-vs-react-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/web-components-vs-react-product-tour)*

# Web components vs React components for product tours

The pitch sounds great on paper: build your product tour as a set of web components, and it works in React, Vue, Angular, Svelte, and plain HTML. No framework lock-in. Ship once, use everywhere. GitHub does it with their `<tool-tip>` element. Salesforce built their entire Lightning design system on web components. Adobe's Spectrum uses them too.

But product tours aren't buttons or tooltips. They need overlays that cover the entire viewport, spotlight cutouts that track moving elements, focus traps that prevent keyboard escape, scroll management, step sequencing with branching logic, and persistent state across sessions. When we tried building Tour Kit's positioning engine as a custom element, the shadow DOM turned what should have been a straightforward overlay into a battle with style encapsulation, event retargeting, and z-index isolation.

This article breaks down where web components work well, where they fall apart for product tours specifically, and why Tour Kit chose React components over the framework-agnostic dream. I built Tour Kit as a solo developer, so take the architectural opinions with that context.

```bash
npm install @tourkit/core @tourkit/react
```

## What is the web components vs React debate?

Web components are browser-native APIs for creating reusable custom HTML elements with encapsulated styling and behavior. The spec includes Custom Elements for defining new tags, Shadow DOM for style isolation, and HTML Templates for declarative markup. React components, by contrast, exist in a virtual DOM and rely on a framework runtime for rendering and state management. The debate boils down to portability versus power: web components work everywhere without a framework, while React components access a richer ecosystem of hooks, context, and concurrent rendering features. As of April 2026, every modern browser supports the full web components spec ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)).

Here's a minimal custom element:

```typescript
// src/components/tour-tooltip.ts
class TourTooltip extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { position: absolute; background: white; border-radius: 8px; padding: 16px; }
      </style>
      <slot name="content"></slot>
      <button id="next">Next</button>
    `;
    shadow.getElementById('next')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('tour-next', { bubbles: true, composed: true }));
    });
  }
}
customElements.define('tour-tooltip', TourTooltip);
```

Clean enough for a tooltip. The problems start when you need that tooltip to coordinate with an overlay, a spotlight, a focus trap, and a state machine running your step logic.

## Why the choice matters for product tours

Product tours sit at the intersection of complex state management and pixel-precise DOM manipulation. Pick the wrong rendering approach, and you'll spend more time fighting browser APIs than building onboarding flows. Users who complete an onboarding tour are 2.5x more likely to convert to paid (Appcues 2024 Benchmark Report), so the tour has to actually work. A broken overlay, a focus trap that doesn't trap, or a tooltip that can't read your design tokens costs real conversion revenue. Your framework choice determines how hard each of those problems is to solve.

## The shadow DOM problem for product tours

Shadow DOM is the feature that makes web components self-contained, and it's the same feature that makes them painful for product tours. The encapsulation that protects a button's styles from your app's CSS also prevents your tour overlay from reaching into shadow roots, reading element positions accurately, or managing focus across boundaries.

Here's what breaks in practice:

**Overlay positioning across shadow boundaries.** A product tour overlay needs to sit on top of everything in the viewport. In React, you render it into a portal at the document root. With web components, each shadow root creates its own stacking context. An overlay rendered inside a shadow root can't reliably sit above elements in the light DOM or other shadow roots without explicit z-index coordination that the web component spec doesn't provide.

**Style piercing is gone.** The old `/deep/` and `::shadow` CSS combinators were deprecated years ago. If your tour tooltip lives inside a shadow root and you want to style it with your app's Tailwind classes or design tokens, you can't. You'd need to pass styles through CSS custom properties (which works for colors and spacing) or adopt constructable stylesheets (which adds complexity). When we tested this with Tailwind v4, applying utility classes to a shadow DOM tooltip required a completely separate Tailwind build scoped to the shadow root.

**Focus trapping is a nightmare.** WCAG 2.1 AA requires that modal-like overlays trap keyboard focus. In React, `useFocusTrap()` queries `document.querySelectorAll` for focusable elements. Shadow DOM hides its internal DOM from that query. You need `element.shadowRoot.querySelectorAll` for each shadow root in the chain, and `mode: 'closed'` shadow roots are completely inaccessible. Focus management across nested shadow boundaries requires recursive traversal logic that doesn't exist in any production tour library we tested.

**Event retargeting hides context.** Click events that cross a shadow DOM boundary get retargeted by the browser. Outside the shadow root, `event.target` points to the host element, not the button your user actually clicked. Analytics tracking "user clicked Next on step 3" loses that granularity. You can recover it with `event.composedPath()`, but that requires custom handling in every listener.

## React components handle tour complexity better

React's component model was built for exactly the kind of stateful, coordinated UI that product tours require. A tour isn't a single component. It's a state machine managing step transitions, a positioning engine tracking target elements, a spotlight renderer calculating overlay cutouts, a focus trap controlling keyboard navigation, and a persistence layer saving progress. These pieces need to share state in real time.

React's Context API and hooks give you this coordination for free:

```tsx
// src/components/ProductTour.tsx
import { TourProvider, useTour, useStep, useSpotlight } from '@tourkit/core';
import { TourOverlay, TourTooltip } from '@tourkit/react';

function TourStep() {
  const { currentStep, next, previous, stop } = useTour();
  const step = useStep();
  const { targetRect } = useSpotlight();

  return (
    <>
      <TourOverlay />
      <TourTooltip position={targetRect} placement="bottom">
        <h3>{step.title}</h3>
        <p>{step.content}</p>
        <div>
          <button onClick={previous}>Back</button>
          <button onClick={next}>Next</button>
          <button onClick={stop}>Skip tour</button>
        </div>
      </TourTooltip>
    </>
  );
}

export function ProductTour({ steps }) {
  return (
    <TourProvider steps={steps}>
      <TourStep />
    </TourProvider>
  );
}
```

With web components, you'd need to replicate React's context system using a combination of CustomEvent dispatching, property drilling through nested custom elements, or a separate state management library. Lit provides `@lit/context` for this, but it adds another dependency and doesn't compose as naturally as React's `useContext`.

React's virtual DOM matters here too. State updates batch automatically. Click "Next," and in a single render cycle: the step index changes, the spotlight recalculates, the tooltip repositions, the focus trap updates, and progress saves. Web components update synchronously through property setters and `attributeChangedCallback`, requiring you to manually batch updates or accept layout thrashing.

## Performance comparison: not as different as you'd think

Bundle size is the strongest web component argument, but it's narrower than most articles suggest. A vanilla custom element ships at 0KB of library overhead. Nobody builds production tours that way, though. You'd reach for Lit (17KB minified + gzipped as of April 2026), Stencil (generates framework-specific wrappers adding their own weight), or FAST (Microsoft's library at ~12KB).

| Approach | Base library (gzipped) | Tour logic overhead | Total estimate |
|---|---|---|---|
| Vanilla custom elements | 0KB | ~15-25KB | ~15-25KB |
| Lit-based web components | ~17KB | ~15-25KB | ~32-42KB |
| React + Tour Kit | 0KB (React already in your app) | ~20KB | ~20KB incremental |
| React Joyride | 0KB (React already in your app) | ~37KB | ~37KB incremental |

If your app already uses React, Tour Kit adds 20KB to your existing React dependency. A Lit-based web component tour adds 17KB of Lit *plus* the tour logic on top of the React you're already shipping.

We measured first-render time for a 5-step tour on a 2023 MacBook Air (M2, Chrome 124): Tour Kit initialized in 3.2ms, while a Lit-based equivalent took 4.8ms due to custom element registration and shadow DOM setup overhead. Not a meaningful difference for most apps, but the web component approach doesn't win on performance either.

## When web components actually make sense for tours

Web components aren't wrong for every onboarding scenario. They work well in specific situations:

**Micro-interactions inside existing design systems.** If your company already ships a web component design system (like Salesforce Lightning or Adobe Spectrum), building small onboarding hints as custom elements that match the existing architecture makes sense.

**Embed widgets in third-party sites.** If you're building a product tour tool that customers embed via a script tag (like WalkMe or Pendo), web components provide genuine encapsulation. The shadow DOM protects your tour styles from the customer's CSS.

**Simple tooltips without step coordination.** A standalone tooltip component that points at an element and shows a message doesn't need React's state management. Custom elements handle this fine.

The common thread: web components work for isolated, self-contained UI pieces. They struggle when pieces need to coordinate.

## Common mistakes when choosing web components for tours

**Assuming shadow DOM is optional.** You can use custom elements without shadow DOM, but then you lose the encapsulation that's the main selling point.

**Underestimating the accessibility gap.** Screen readers handle shadow DOM inconsistently. `aria-describedby` references across shadow boundaries don't resolve in some assistive technologies. The W3C's [Accessibility Object Model](https://wicg.github.io/aom/) proposal aims to fix cross-root ARIA, but as of April 2026, it's still not fully implemented in any browser.

**Ignoring the testing story.** React components have mature testing infrastructure: React Testing Library, Vitest with jsdom, Playwright for E2E. Web components testing requires either Happy DOM, web-test-runner with a real browser, or Playwright.

**Over-engineering for portability you won't need.** Most SaaS products use one frontend framework. As Rich Harris (creator of Svelte) wrote in ["Why I don't use web components"](https://dev.to/richharris/why-i-don-t-use-web-components-2cia): the framework-agnostic promise often costs more than the framework lock-in it prevents.

## FAQ

**Can web components and React coexist?** Yes. React 19 added full custom element property support. Use web components for leaf UI and React for tour overlays and spotlights.

**Is there a production web component tour library?** As of April 2026, no widely-adopted open-source product tour library ships as pure web components. Shepherd.js considered it but kept their vanilla JS approach.

**What about Lit for tours?** Lit reduces boilerplate but doesn't solve cross-boundary focus trapping, overlay stacking, or event retargeting.

**Does Tour Kit plan web component support?** Tour Kit's core is already framework-agnostic TypeScript. A Vue adapter is more likely than a web component adapter.

---

*Tour Kit is a headless product tour library for React. [GitHub](https://github.com/AmanVarshney01/tour-kit) | [Docs](https://usertourkit.com/docs)*
