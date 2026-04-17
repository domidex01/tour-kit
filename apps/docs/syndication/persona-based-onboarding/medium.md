# Stop Showing Every User the Same Product Tour

## How persona-based onboarding with TypeScript cuts activation time and boosts retention

*Originally published at [usertourkit.com](https://usertourkit.com/blog/persona-based-onboarding)*

Your project management tool has three types of users. The marketing manager wants campaign dashboards. The developer wants API docs. The team lead wants sprint views. You're showing all three the same 12-step tour.

That's not onboarding. That's a slideshow.

Personalized onboarding increases 30-day retention by 52% and feature adoption by 42% compared to one-size-fits-all flows. ProdPad cut their activation time from six weeks to ten days by segmenting users into distinct personas.

This guide walks through the complete pattern in React: modeling personas as TypeScript discriminated unions for compile-time safety, resolving them from auth data or onboarding surveys, rendering persona-specific tours using conditional step logic, and measuring which personas convert best.

The key insight is separating roles from personas. A role determines what a user *can* do (permissions). A persona describes what a user *wants* to do (intent). The same "admin" role might contain a technical founder who wants API access and a non-technical CEO who wants dashboards. Same permissions, completely different onboarding needs.

The implementation uses a PersonaProvider context that resolves once and makes the active persona available to all tour components. Each persona gets its own tour ID, so completion tracking is independent. An admin who finishes their 8-step tour doesn't mark the developer's 5-step tour as complete.

For shared tours where most steps are common but a few are persona-specific, a `when` prop on individual steps handles conditional rendering. The step is evaluated before render. If the condition returns false, the step is skipped entirely with no DOM manipulation.

The article includes working TypeScript code for persona type definitions, runtime resolution, separate tour configs, shared tours with conditional steps, lazy loading per persona, analytics integration, and accessibility patterns for persona-conditional flows.

**Read the full guide with all code examples:** [usertourkit.com/blog/persona-based-onboarding](https://usertourkit.com/blog/persona-based-onboarding)

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
