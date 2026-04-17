---
title: "Onboarding for AI products: teaching users to prompt"
slug: "ai-product-onboarding"
canonical: https://usertourkit.com/blog/ai-product-onboarding
tags: react, javascript, web-development, ai, ux
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/ai-product-onboarding)*

# Onboarding for AI products: teaching users to prompt

Your AI product has a problem that Notion and Figma never had. When a new user opens a traditional SaaS app, they see buttons, menus, and form fields. When they open your AI product, they see a blank text box. No affordances. No obvious next step. Just a cursor blinking in an empty input, waiting for a prompt that most users don't know how to write.

As of April 2026, the average B2B SaaS activation rate sits at 37.5% ([42DM benchmarks](https://42dm.net/b2b-saas-benchmarks-to-track/)). That means 62.5% of users drop off before reaching any "Aha!" moment.

This guide covers template activation loops, 60-seconds-to-value frameworks, and guided prompt tours you can build in React with [Tour Kit](https://usertourkit.com/).

## The blank canvas problem

Traditional onboarding guides users through a fixed sequence: click here, then here. AI products don't have fixed sequences. The user's path depends entirely on what they type. The onboarding can't just show where to click. It has to show what to say.

Only 4 out of 10 AI tools still rely on traditional tooltip-and-checklist onboarding ([UserGuiding, 2026](https://userguiding.com/blog/how-top-ai-tools-onboard-new-users)). The other 6 have moved to embedded experiences: example prompts, template pickers, and interfaces where the product teaches itself.

## The 60-seconds-to-value framework

Wes Bush at ProductLed defines the standard: "60-seconds-to-value or less is the new bar for AI companies" ([ProductLed, 2026](https://productled.com/blog/ai-onboarding)).

Four maturity levels:
1. **Inform** - Explains features
2. **Guide** - Recommends next steps
3. **Execute** - Helps do the work
4. **Orchestrate** - Adapts the system itself

Most products stop at level 2. The real gains come from levels 3 and 4.

## Template activation loops

The dominant pattern across 150+ AI products (Fishman AF Newsletter, 2026):

1. **Show a working example.** Perplexity shows queries on first load. Replit lets you execute code without an account.
2. **Let users remix.** Gamma narrows templates to the user's need. Don't give one template, give a category.
3. **Bridge to freeform.** After 2-3 template interactions, prompt users to write their own.

## Guided prompt tours in React

```tsx
import { TourProvider } from '@tourkit/react';

const promptTourSteps = [
  {
    target: '[data-tour="prompt-input"]',
    title: 'Start with a task',
    content: 'Be specific: "Summarize this quarterly report" beats "Help me."',
  },
  {
    target: '[data-tour="prompt-input"]',
    title: 'Add context',
    content: 'Mention format, audience, or constraints like word count.',
  },
  {
    target: '[data-tour="template-picker"]',
    title: 'Or start from a template',
    content: 'Pick a template. Edit before sending.',
  },
];

function PromptOnboardingTour() {
  return (
    <TourProvider steps={promptTourSteps}>
      <PromptInterface />
    </TourProvider>
  );
}
```

Each step teaches a prompting concept rather than pointing at buttons.

## Full guide

Complete article with adaptive tour examples, the AI onboarding maturity model, accessibility patterns, and a tools comparison:

**[usertourkit.com/blog/ai-product-onboarding](https://usertourkit.com/blog/ai-product-onboarding)**
