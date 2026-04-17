# Why web components don't work for product tours (and what does)

## Shadow DOM encapsulation fights every feature a tour needs

*Originally published at [usertourkit.com](https://usertourkit.com/blog/web-components-vs-react-product-tour)*

The idea is compelling: build your product tour as web components and it works everywhere. React, Vue, Angular, plain HTML. GitHub, Salesforce, and Adobe all use web components in their design systems. Why not tours?

Because product tours aren't buttons. They're coordination layers. An overlay that covers the viewport, a spotlight that tracks elements, a focus trap that handles keyboard navigation, a state machine that sequences steps, a persistence layer that saves progress. These pieces share state constantly and need to render as a unified system.

We tried building Tour Kit's overlay as a custom element. Shadow DOM turned a straightforward positioning problem into a multi-day debugging session.

## Where shadow DOM breaks down

**Overlays can't escape shadow roots.** Each shadow root creates its own stacking context. Your tour overlay inside a shadow root can't sit above elements in other shadow roots without manual z-index coordination.

**No style piercing.** Want to style your tour tooltip with Tailwind? If it's inside a shadow root, you need a separate Tailwind build scoped to that root. CSS custom properties work for colors, but that's about it.

**Focus trapping requires recursive shadow traversal.** WCAG 2.1 AA says modal overlays must trap keyboard focus. Shadow DOM hides elements from `querySelectorAll`. Closed shadow roots? Completely inaccessible.

**Events lose context.** Click events crossing shadow boundaries get retargeted. Your analytics can't tell which button was clicked without `composedPath()` in every listener.

## React's model fits tours naturally

React's context, hooks, and batched rendering were designed for exactly this kind of stateful, coordinated UI. One `useContext` call shares tour state across all subsystems. One render cycle updates everything atomically.

The bundle math favors React too. If your app already loads React, Tour Kit adds 20KB gzipped. A Lit-based tour adds 17KB of Lit plus the tour logic — on top of the React you're already shipping.

## When web components do make sense

They're great for what they were designed for: isolated, self-contained UI pieces.

If your company ships a web component design system, small onboarding hints as custom elements make sense. If you're building an embeddable widget for third-party sites, shadow DOM is exactly the encapsulation you want.

But full product tours — with overlays, spotlights, focus management, and step coordination — need a richer component model. React provides that. Vue and Svelte do too.

## The pragmatic approach

Build your tour logic in framework-agnostic TypeScript (pure functions, state machines). Build the rendering layer in your framework of choice. That gives you real portability at the logic level without fighting shadow DOM at the rendering level.

That's what Tour Kit does: `@tour-kit/core` is pure TypeScript, `@tour-kit/react` is the thin rendering adapter. The architecture could support Vue or Svelte adapters without touching the core.

Full deep-dive with code examples and benchmarks: [usertourkit.com/blog/web-components-vs-react-product-tour](https://usertourkit.com/blog/web-components-vs-react-product-tour)

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
