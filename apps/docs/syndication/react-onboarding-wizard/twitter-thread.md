## Thread (6 tweets)

**1/** I checked the top 5 React stepper/wizard tutorials.

Zero implement aria-current="step".
Zero manage focus on step transitions.
Zero use aria-live for screen reader announcements.

Here's what they're all missing:

**2/** When a user clicks "Continue" in a wizard, browser focus stays on the now-hidden button.

Screen reader users hear nothing. Keyboard users are lost.

The fix is 3 attributes + 1 useEffect:
- tabIndex={-1} on the content container
- aria-live="polite" for announcements
- programmatic .focus() on step change

**3/** The other missing piece: aria-current="step" on the active stepper indicator.

The W3C recommends it for indicating position in a sequence, but I couldn't find a single React tutorial that implements it.

Smashing Magazine covers fieldset/legend but stops short of ARIA step patterns.

**4/** Bundle size matters for wizards too. Compared 4 approaches:

Stepperize: <1KB (impressive)
Custom DIY: ~0.5-2KB
Tour Kit: <8KB (with ARIA + analytics)
MUI Stepper: ~80KB+ (full MUI dep)

**5/** Three gotchas we hit building this:

1. aria-live must be on the persistent container, not the step component (it unmounts!)
2. Key your step components by currentStep.id or React skips re-renders
3. The focus container must persist across steps — only children should swap

**6/** Full tutorial with working TypeScript code, comparison table, and troubleshooting guide:

https://usertourkit.com/blog/react-onboarding-wizard

(Disclosure: I built Tour Kit. Every number is verifiable on bundlephobia/npm.)
