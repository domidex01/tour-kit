# How to build an onboarding wizard in React that actually works for everyone

*A step-by-step guide to building accessible multi-step forms with proper ARIA roles, focus management, and analytics*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-onboarding-wizard)*

Most React "onboarding wizard" tutorials hand you a currentStep counter and call it done. Focus management when steps change? Missing. ARIA roles on the step indicators? Absent. Tracking where users drop off? Not even considered.

We tested five popular React stepper tutorials and found zero that implement aria-current="step" or manage focus on step transitions. That means screen reader users and keyboard-only users are left in the dark every time a step changes.

Tour Kit takes a different approach. It gives you headless primitives for step sequencing, element highlighting, and scroll management while you keep full control of the rendering. The core ships at under 8KB gzipped with zero runtime dependencies.

By the end of this tutorial, you'll have a working 4-step onboarding wizard with a stepper UI, proper ARIA roles, and optional analytics tracking.

## The key accessibility gaps in React steppers

Three things are consistently missing from stepper tutorials:

1. **aria-current="step"** on the active step indicator, so screen readers know which step the user is on
2. **Focus management** via tabIndex={-1} and useEffect to move focus when steps change
3. **aria-live="polite"** on the content container to announce new step content

These aren't nice-to-haves. Without them, step transitions are invisible to assistive technology.

## The comparison that matters

We tested four approaches in a Vite 6 + React 19 project:

- **Tour Kit:** <8KB gzipped, headless, built-in ARIA + analytics hooks
- **Stepperize:** <1KB, headless, minimal ARIA support
- **MUI Stepper:** ~80KB+ (full MUI dependency), opinionated UI
- **Custom DIY:** ~0.5-2KB, you build everything yourself

Stepperize is genuinely impressive at under 1KB. If your wizard is purely visual with no accessibility requirements, it's a solid choice. Tour Kit won't be the smallest option. It will be the one that handles focus, ARIA, and tracking without you writing that infrastructure yourself.

Fair warning: Tour Kit has no visual builder, so you'll need React developers on your team.

Full tutorial with all code examples, troubleshooting guide, and FAQ: [usertourkit.com/blog/react-onboarding-wizard](https://usertourkit.com/blog/react-onboarding-wizard)

---

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
