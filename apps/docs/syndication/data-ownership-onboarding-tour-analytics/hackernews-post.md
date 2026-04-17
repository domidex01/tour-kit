## Title: Data ownership in onboarding tools: what Pendo, Appcues, and WalkMe's terms actually say

## URL: https://usertourkit.com/blog/data-ownership-onboarding-tour-analytics

## Comment to post immediately after:

I spent a week reading through the data processing agreements and export documentation of the major SaaS onboarding tools. The article covers three angles:

1. The practical gap between "you own your data" (marketing) and what vendor ToS actually allows (export formats, processing times, retention policies). WalkMe retains personal data up to 7 years and takes 90 days on deletion requests. GDPR SARs require 30 days.

2. The GDPR controller/processor distinction applied specifically to product tour analytics. When Pendo tracks that a user completed step 3 of your onboarding tour, you're the controller and Pendo is the processor. You bear accountability for data practices even though the data sits on their infrastructure.

3. The EU Data Act (enforced September 2025) now requires machine-readable exports at no cost. As of April 2026, no major onboarding vendor has documented how they comply. GDPR fines totaled over EUR 4.5 billion between 2018 and 2025.

I also cover the honest counterargument: SOC 2 Type II costs $50-100K for initial audit. Vendors amortize that across thousands of customers. For a 5-person startup, that's a real argument for SaaS.

Disclosure: I built Tour Kit, an open-source product tour library for React, so I have an obvious bias toward code-owned solutions. I tried to be fair to both sides.
