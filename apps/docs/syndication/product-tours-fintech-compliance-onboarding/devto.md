---
title: "Building compliance-friendly product tours for fintech apps"
published: false
description: "68% of users abandon fintech onboarding. Here's how to build product tours that satisfy KYC, GDPR, PCI DSS, and WCAG without killing the UX."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/product-tours-fintech-compliance-onboarding
cover_image: https://usertourkit.com/og-images/product-tours-fintech-compliance-onboarding.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tours-fintech-compliance-onboarding)*

# Product tours for fintech: compliance-friendly onboarding

Financial onboarding has a dropout problem. As of 2022, 68% of users abandon fintech onboarding flows before completing them, up from 40% in 2016 ([Jumio](https://www.jumio.com/how-to-reduce-customer-abandonment/)). The average user drops out at 18 minutes and 53 seconds. KYC-heavy flows see abandonment rates between 70% and 80%.

Product tours can fix the UX side of this problem. But in regulated industries, a standard product tour library creates new compliance risks: PII leaking into analytics events, third-party scripts running in payment flows, inaccessible tooltips that violate ADA requirements. This guide covers how to build fintech onboarding product tours that satisfy compliance requirements without sacrificing the user experience.

```bash
npm install @tourkit/core @tourkit/react
```

## What is a compliance-friendly product tour?

A compliance-friendly product tour is a guided onboarding flow that meets the regulatory requirements of financial services while reducing user friction during mandatory steps like KYC, AML verification, and account setup. Unlike standard SaaS product tours that freely track user interactions and inject UI overlays anywhere, a fintech product tour must enforce consent gating, avoid capturing personally identifiable information in analytics events, and remain fully keyboard-navigable and screen-reader-accessible. As of April 2026, only 31% of Europe's largest fintechs fully meet basic web accessibility requirements ([TestDevLab](https://www.testdevlab.com/blog/only-31-percent-of-fintech-companies-meet-digital-accessibility-requirements)), which means 70% of fintech platforms carry legal exposure from their onboarding flows alone.

## Why compliance-friendly onboarding matters for fintech

Standard SaaS onboarding collects an email and maybe a company name. Fintech? Government IDs, bank account numbers, tax identifiers, selfie photos for liveness checks. The average mobile fintech onboarding flow spans 14 screens, 16 required fields, and 29 clicks to complete ([Eleken](https://www.eleken.co/blog-posts/fintech-onboarding-simplification)). Six minutes from start to finish, and every additional field increases the chance a user walks away before they ever see your product.

The compliance stack compounds this friction:

| Regulation | What it requires | How it affects product tours |
|---|---|---|
| KYC / AML | Identity verification before full account access | Tours cannot skip or obscure verification steps |
| GDPR | Explicit consent before tracking user interactions | Tour analytics must wait for consent; no auto-initialized localStorage |
| CCPA | Transparency and opt-out rights for behavioral data | Must disclose what tour interaction data is collected |
| PCI DSS | Payment card data isolation | Tour overlays must never access card input fields; no DOM snapshots |
| ADA / WCAG 2.1 AA | Accessible UI for all users | Tour tooltips need ARIA labels, focus trapping, keyboard navigation |
| EAA (EU) | WCAG 2.1 AA for digital financial services | Enforcement began June 2025; applies to onboarding tours |
| SOC 2 Type II | Vendor data processing accountability | SaaS tour tools are data sub-processors requiring due diligence |

Each regulation adds a constraint to how your product tour can behave. But here's the reframe most fintech teams miss: compliance isn't the enemy of good onboarding. A well-designed product tour turns mandatory compliance steps into trust-building moments.

## The PII-safe tour architecture

The most common compliance mistake in fintech product tours is leaking personally identifiable information into analytics events. When a tour step targets a form field containing a user's SSN or passport number, a naive analytics callback sends that field's value along with the step completion event. In a regulated environment, this is a data breach waiting to happen.

Tour Kit's analytics callbacks give you explicit control over what gets sent:

```tsx
// src/components/KycTour.tsx
import { TourProvider, useTour } from '@tourkit/react';
import type { TourStep, TourAnalyticsEvent } from '@tourkit/core';

const kycSteps: TourStep[] = [
  {
    id: 'welcome',
    target: '#onboarding-header',
    title: 'Welcome to your account setup',
    content: 'We need to verify your identity before you can send or receive funds. This takes about 3 minutes.',
  },
  {
    id: 'id-upload',
    target: '#document-upload',
    title: 'Upload your government ID',
    content: 'We accept passports, driver licenses, and national ID cards. Your document is encrypted in transit.',
  },
  {
    id: 'selfie-check',
    target: '#liveness-check',
    title: 'Quick selfie verification',
    content: 'Match your face to your ID. No images are stored after verification completes.',
  },
];

function handleTourEvent(event: TourAnalyticsEvent) {
  // Strip PII: only send step ID, timestamp, and completion status
  const safePayload = {
    stepId: event.stepId,
    action: event.action,
    timestamp: Date.now(),
    // Never include: event.targetElement, event.formValues, event.userData
  };
  posthog.capture('tour_step', safePayload);
}

export function KycOnboardingTour() {
  return (
    <TourProvider
      steps={kycSteps}
      onStepChange={handleTourEvent}
      onComplete={handleTourEvent}
    >
      <KycTourContent />
    </TourProvider>
  );
}
```

The key pattern: your analytics callback receives the full event, but you choose what to forward. No PII hits your analytics pipeline because you construct the payload yourself.

## Consent-gated tour initialization

GDPR requires explicit consent before tracking user interactions. CCPA requires transparency and opt-out. Most product tour libraries auto-initialize when the component mounts, setting localStorage keys and firing events before the user has consented to anything.

In a fintech context, this means your tour library is already in violation the moment the page loads.

The fix is lazy initialization. Don't mount the tour provider until consent is captured:

```tsx
// src/components/ConsentGatedTour.tsx
import { useState, useEffect } from 'react';
import { TourProvider } from '@tourkit/react';
import { useConsent } from '@/hooks/useConsent';

export function ConsentGatedTour({ steps, children }) {
  const { analyticsConsent, isLoaded } = useConsent();
  const [tourEnabled, setTourEnabled] = useState(false);

  useEffect(() => {
    if (isLoaded && analyticsConsent) {
      setTourEnabled(true);
    }
  }, [isLoaded, analyticsConsent]);

  if (!tourEnabled) {
    // Render nothing — no tour state in localStorage, no events fired
    return <>{children}</>;
  }

  return (
    <TourProvider steps={steps}>
      {children}
    </TourProvider>
  );
}
```

With Tour Kit, the provider only initializes state when it mounts. No mount means no localStorage writes, no analytics events, no cookies. You get compliance by default, not by patching behavior after the fact.

## KYC-aware tour branching

Fintech users aren't a single group. A user who completed identity verification sees a completely different app than someone still waiting on KYC approval, and the onboarding experience should reflect that gap rather than pretending everyone is at the same stage. Your product tours need to branch accordingly.

Risk-based approaches (RBA) are now standard in fintech compliance. Low-risk users see a simplified flow; high-risk users get expanded verification steps ([Veratad](https://veratad.com/blog/compliant-fintech-customer-onboarding-4-best-practices)). Your tours should mirror this:

```tsx
// src/tours/adaptive-onboarding.tsx
import type { TourStep } from '@tourkit/core';

const baseSteps: TourStep[] = [
  { id: 'dashboard-overview', target: '#main-dashboard', title: 'Your dashboard', content: 'Here is where you track balances and recent activity.' },
  { id: 'send-money', target: '#send-btn', title: 'Send funds', content: 'Transfer to any account in your contacts.' },
];

const kycPendingSteps: TourStep[] = [
  { id: 'verify-prompt', target: '#kyc-banner', title: 'Complete verification first', content: 'You need to verify your identity before sending funds. Tap here to start.' },
];

const enhancedDueDiligenceSteps: TourStep[] = [
  { id: 'edd-docs', target: '#additional-docs', title: 'Additional documents needed', content: 'For accounts above $10,000, we need proof of address and source of funds.' },
];

export function getStepsForUser(kycStatus: 'verified' | 'pending' | 'enhanced') {
  switch (kycStatus) {
    case 'verified':
      return baseSteps;
    case 'pending':
      return [...kycPendingSteps, ...baseSteps];
    case 'enhanced':
      return [...enhancedDueDiligenceSteps, ...baseSteps];
  }
}
```

This isn't theoretical. French fintech Shine achieved an 80% onboarding conversion rate by using gamified, progressive onboarding that adapted to user state ([Userpilot](https://userpilot.com/blog/fintech-onboarding/)). The pattern works.

Check out the [conditional product tour guide](https://usertourkit.com/blog/conditional-product-tour-user-role) for more on role-based branching.

## Why headless tours are a compliance advantage

SaaS tour tools like Appcues, Pendo, and Intercom inject third-party JavaScript that executes inside your app's DOM. In a fintech context, this creates three compliance problems:

**PCI DSS risk.** A third-party script with DOM access can read payment card inputs. Even if the vendor promises not to, the capability exists. Your auditor will flag it.

**SOC 2 sub-processor burden.** Every SaaS vendor that processes user data must be listed in your Data Processing Agreement. That means ongoing due diligence, vendor security reviews, and risk assessments. All for your tour tool.

**Audit trail gaps.** SaaS tour analytics live on the vendor's infrastructure. When a regulator asks for onboarding completion records, you're dependent on a third party's retention policy.

Code-owned headless tours eliminate all three. Tour Kit ships as an npm package in your bundle. No external scripts, no vendor DOM access, no data leaving your infrastructure unless you explicitly send it:

| Concern | SaaS tour tool | Code-owned headless tour |
|---|---|---|
| Third-party DOM access | Yes, full DOM read/write | No external scripts |
| SOC 2 sub-processor | Yes, requires vendor DPA | No, runs in your bundle |
| PCI DSS scope | Expands scope (vendor code in payment flows) | No scope change |
| Data residency | Vendor's infrastructure (may cross borders) | Your infrastructure, your rules |
| Audit trail ownership | Vendor-controlled retention | You own the logs |
| Bundle size impact | 50-200KB+ injected at runtime | Tour Kit core: <8KB gzipped |

We built Tour Kit, so take this comparison with appropriate skepticism. But the compliance argument for code-owned tours is structural, not marketing. Your security team will agree.

Tour Kit's current limitation: no visual builder. Fintech product managers who want to edit tours without code need to work with developers. For teams where compliance auditing matters more than drag-and-drop convenience, that's a reasonable tradeoff.

## Accessibility as compliance risk reduction

Here's a number that should concern fintech CTOs: 70% of European fintechs fail basic web accessibility requirements ([TestDevLab](https://www.testdevlab.com/blog/only-31-percent-of-fintech-companies-meet-digital-accessibility-requirements)). Under the European Accessibility Act, enforcement began June 2025. Under ADA Title III, fintech platforms are "places of public accommodation" with legal exposure for inaccessible interfaces ([Netguru](https://www.netguru.com/blog/ada-compliance-for-fintech)).

Product tour overlays are a common accessibility failure point. A tooltip that traps keyboard focus incorrectly, a modal without an ARIA label, an animation that ignores `prefers-reduced-motion` — each one is a potential compliance violation.

Tour Kit addresses this at the architecture level. Focus trapping is built into every tooltip and modal, keeping focus within the active tour step until the user dismisses or advances. ARIA attributes (`role="dialog"`, `aria-labelledby`, `aria-describedby`) are applied automatically to every step.

Keyboard navigation supports Enter/Space for advancement, Escape for dismissal, and Tab for cycling through interactive elements. When the OS-level `prefers-reduced-motion` setting is active, all tour animations are suppressed (WCAG 2.3.3). Every step includes a visible close mechanism by default, satisfying WCAG 2.1 SC 2.1.2.

See the [screen reader product tour guide](https://usertourkit.com/blog/screen-reader-product-tour) and [keyboard navigation guide](https://usertourkit.com/blog/keyboard-navigable-product-tours-react) for implementation details.

## Wiring tour events into an audit trail

The USA PATRIOT Act, BSA, and FFIEC guidelines require financial institutions to maintain records of each verification step. If your onboarding product tour is part of the KYC flow, tour step completion events may need to be part of your audit trail.

Most tour libraries store progress in localStorage and call it done. That's insufficient for regulated environments where an auditor needs to know exactly when a user completed each onboarding step, server-side, with tamper-resistant timestamps.

Here's how to wire Tour Kit's analytics callbacks into a server-side audit log:

```tsx
// src/lib/audit-tour-events.ts
import type { TourAnalyticsEvent } from '@tourkit/core';

interface AuditEntry {
  userId: string;
  stepId: string;
  action: 'view' | 'complete' | 'dismiss';
  timestamp: string;
  sessionId: string;
}

export async function logTourAuditEvent(
  event: TourAnalyticsEvent,
  userId: string,
  sessionId: string,
) {
  const entry: AuditEntry = {
    userId, // Already known from auth context, not from tour state
    stepId: event.stepId,
    action: event.action,
    timestamp: new Date().toISOString(),
    sessionId,
  };

  await fetch('/api/audit/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
}
```

```tsx
// src/components/AuditedKycTour.tsx
import { TourProvider } from '@tourkit/react';
import { logTourAuditEvent } from '@/lib/audit-tour-events';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';

export function AuditedKycTour({ steps, children }) {
  const { userId } = useAuth();
  const { sessionId } = useSession();

  return (
    <TourProvider
      steps={steps}
      onStepChange={(event) => logTourAuditEvent(event, userId, sessionId)}
      onComplete={(event) => logTourAuditEvent(event, userId, sessionId)}
    >
      {children}
    </TourProvider>
  );
}
```

The audit entry contains only what the regulator needs: who, what step, what action, when. No form values, no PII, no document data.

## Common mistakes in fintech product tours

**Overlaying secure input fields.** Never position a tour tooltip directly on top of a password field, card number input, or SSN field. The overlay's z-index can interfere with autofill, and screen recordings may capture sensitive data. Target the field's label or a nearby landmark instead.

**Tracking without consent.** If your tour fires analytics on mount in the EU, you're likely violating GDPR before the user's first click. Gate it.

**Skipping reduced-motion support.** Tour animations that ignore `prefers-reduced-motion` violate WCAG 2.3.3. Accessibility bugs are compliance bugs in regulated industries.

**Storing tour state with PII.** Don't persist `{ step: 'ssn-field', value: '123-45-6789' }`. Use opaque step IDs: `{ step: 'id-upload', completed: true }`.

**Forgetting to update your DPA.** Adding Appcues or Pendo means adding a data sub-processor to your Data Processing Agreement. If your SOC 2 auditor finds a vendor that isn't listed, that's a finding that could delay your audit by weeks.

## FAQ

### Can product tours handle KYC onboarding flows?

Product tours guide users through KYC steps without replacing the verification process itself. Tour Kit's step-based architecture walks users through document upload, selfie verification, and form completion while the actual KYC logic runs through your identity provider (Jumio, Veriff, Onfido). The tour reduces friction by explaining why each step exists and what to expect, which addresses the 38% of users who abandon because the process feels too long.

### Do fintech product tours need GDPR consent?

Any fintech onboarding product tour that tracks user interactions, stores progress in localStorage, or fires analytics events requires GDPR consent in the EU. Tour Kit supports consent-gated initialization: don't mount the provider until consent is captured. Without consent, no tour state is written and no events fire. CCPA requires opt-out transparency rather than upfront consent, but the technical implementation is similar.

### How do product tours affect PCI DSS compliance?

SaaS product tour tools inject third-party JavaScript with full DOM access, which expands your PCI DSS scope because the vendor's code can theoretically read payment card inputs. Code-owned tour libraries like Tour Kit ship as npm packages in your bundle with no external script execution, keeping your PCI scope unchanged. If your tour overlays appear on pages with payment forms, ensure tooltips never target or overlay card number, CVV, or expiration fields.

### Are product tour overlays accessible enough for regulated fintech?

Most product tour libraries fail WCAG 2.1 AA compliance. Tour Kit provides focus trapping, ARIA dialog roles, keyboard navigation, and `prefers-reduced-motion` support out of the box. The European Accessibility Act, enforced since June 2025, requires WCAG 2.1 AA compliance for digital financial services across the EU. Given that 70% of European fintechs currently fail basic accessibility requirements, accessible tour overlays are a compliance differentiator.

### What's the bundle size cost of adding product tours to a fintech app?

Tour Kit's core package ships at under 8KB gzipped with zero runtime dependencies. For comparison, SaaS tour tools inject 50-200KB+ of JavaScript at runtime. In fintech apps where page load performance directly affects onboarding completion rates, the difference matters. Google's Core Web Vitals research shows that pages loading a 45KB+ JavaScript bundle see 23% higher bounce rates on mobile ([web.dev](https://web.dev/vitals/)).

---

Get started with [Tour Kit](https://usertourkit.com/) to build compliance-friendly fintech onboarding tours. Install with `npm install @tourkit/core @tourkit/react`, or explore the [documentation](https://usertourkit.com/docs) and [GitHub repository](https://github.com/AmanVarshney01/tour-kit) for code examples.
