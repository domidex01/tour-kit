---
title: "Visual regression testing for product tours with Chromatic"
slug: "visual-regression-testing-product-tours-chromatic"
canonical: https://usertourkit.com/blog/visual-regression-testing-product-tours-chromatic
tags: react, storybook, testing, visual-regression, chromatic
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/visual-regression-testing-product-tours-chromatic)*

# Visual regression testing for product tours with Chromatic

Product tours break in ways unit tests can't catch. A tooltip drifts 12 pixels to the left after a CSS refactor. An overlay mask bleeds past the viewport on tablet. The highlight ring disappears behind a sticky header at z-index 1000. These are visual regressions, and they ship silently unless you have screenshot-level testing in your pipeline.

This tutorial walks through setting up Storybook stories that render each tour step at multiple viewports, using play functions to simulate multi-step flows, configuring Chromatic to capture and diff every state on each PR, and adding a GitHub Actions workflow that blocks merges on visual changes.

## The testing gap for product tours

| Testing method | Catches tooltip drift | Catches z-index bugs | Catches overlay bleed |
|---|---|---|---|
| Unit tests (Vitest) | No | No | No |
| Integration tests (Testing Library) | No | No | No |
| E2E tests (Playwright) | Partial | Partial | Yes |
| Visual regression (Chromatic) | Yes | Yes | Yes |

## Quick setup

```bash
npm install --save-dev chromatic @chromatic-com/storybook
npx chromatic
```

## Writing stories for tour states

Each visual state of your tour component needs its own story. A tour tooltip at step 1 looks different from step 3, and Chromatic diffs each one independently:

```tsx
const meta: Meta<typeof TourWrapper> = {
  title: "Tour/TourTooltip",
  component: TourWrapper,
  parameters: {
    layout: "fullscreen",
    chromatic: { viewports: [375, 768, 1440] },
  },
};

export const Step1: Story = { args: { initialStep: 0 } };
export const Step2: Story = { args: { initialStep: 1 } };
export const Step3: Story = { args: { initialStep: 2 } };
```

## Simulating tour flow with play functions

```tsx
import { expect, userEvent, within } from "@storybook/test";

export const AdvanceTwoSteps: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nextButton = canvas.getByRole("button", { name: /next/i });
    await userEvent.click(nextButton);
    await userEvent.click(nextButton);
    await expect(canvas.getByText("Invite team")).toBeInTheDocument();
  },
};
```

Chromatic captures the screenshot after the play function completes, giving you visual proof that step 3's tooltip lands at the right element.

## Snapshot budget on the free tier

- 3 stories x 3 viewports x 2 themes = 18 snapshots per PR
- 10 PRs/month = 180 snapshots (3.6% of the 5,000 free tier)

Read the full tutorial with dark mode testing, GitHub Actions config, troubleshooting guide, and accessibility testing: [usertourkit.com/blog/visual-regression-testing-product-tours-chromatic](https://usertourkit.com/blog/visual-regression-testing-product-tours-chromatic)
