## Title: None of the top React stepper tutorials handle ARIA roles or focus management

## URL: https://usertourkit.com/blog/react-onboarding-wizard

## Comment to post immediately after:

I went through the five most popular React stepper/wizard tutorials to see how they handle accessibility. The findings: zero implement aria-current="step", zero manage focus on step transitions, and zero use aria-live regions for screen reader announcements.

The actual fix is three attributes and a useEffect — tabIndex={-1} on the step container, aria-live="polite" for announcements, and programmatic focus on step change. Not complex, but consistently missing from every tutorial I checked.

I also compared bundle sizes across approaches. Stepperize (<1KB) is impressively small for a headless stepper. MUI Stepper pulls in ~80KB+ through the full MUI dependency. Tour Kit (my project, disclosure) lands at <8KB with built-in ARIA support and analytics hooks.

The article includes working TypeScript code for each step, a comparison table, and three specific troubleshooting patterns (step content not updating, focus jumping to page top, screen readers not announcing).

Smashing Magazine's multistep form article covers fieldset/legend semantics but stops short of ARIA step patterns. W3C's ARIA Authoring Practices has the spec but no React implementation. This tutorial tries to bridge both.
