---
title: "How I set up visual regression testing for product tour components with Chromatic"
published: false
description: "Product tours break in ways unit tests can't catch — tooltip drift, z-index bugs, overlay bleed. Here's how to use Storybook stories and Chromatic to screenshot every tour state on every PR."
tags: react, storybook, testing, webdev
canonical_url: https://usertourkit.com/blog/visual-regression-testing-product-tours-chromatic
cover_image: https://usertourkit.com/og-images/visual-regression-testing-product-tours-chromatic.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/visual-regression-testing-product-tours-chromatic)*

# Visual regression testing for product tours with Chromatic

Product tours break in ways unit tests can't catch. A tooltip drifts 12 pixels to the left after a CSS refactor. An overlay mask bleeds past the viewport on tablet. The highlight ring disappears behind a sticky header at z-index 1000. These are visual regressions, and they ship silently unless you have screenshot-level testing in your pipeline.

Tour Kit gives you headless product tour logic (step sequencing, scroll management, element highlighting) while you control the rendering. That rendering is exactly what needs visual regression coverage. Storybook isolates each tour component as a story. Chromatic captures pixel-perfect snapshots of every story on each PR, diffs them, and blocks merges when something changes unexpectedly.

By the end of this tutorial, you'll have Storybook stories for Tour Kit components that simulate multi-step tour flows using play functions, Chromatic running visual diffs on every pull request, and a GitHub Actions workflow that catches tooltip drift before your users do.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

A complete visual regression testing pipeline for Tour Kit product tour components. You'll write Storybook stories that render each tour step at multiple viewports, wire up play functions that simulate clicking through a multi-step flow, configure Chromatic to capture and diff every state on each pull request, and add a GitHub Actions workflow that blocks merges when tour visuals change unexpectedly.

## Why product tours are hard to test visually

Product tours combine several UI patterns that are notoriously brittle under visual regression. Tooltips attach to DOM elements that may shift when content changes. Overlay masks cover the entire viewport except for a highlighted target, and a single pixel offset in the cutout is visible to users.

Traditional unit tests verify that `isOpen` is `true` and `currentStep` equals `2`. They can't verify that the tooltip actually points at the right button, or that the overlay doesn't cover the CTA your user needs to click.

| Testing method | Catches tooltip drift | Catches z-index bugs | Catches overlay bleed |
|---|---|---|---|
| Unit tests (Vitest) | No | No | No |
| Integration tests (Testing Library) | No | No | No |
| E2E tests (Playwright) | Partial | Partial | Yes |
| Visual regression (Chromatic) | Yes | Yes | Yes |

## Step 1: Install Storybook and Chromatic

```bash
npx storybook@latest init
npm install --save-dev chromatic @chromatic-com/storybook
```

Add Chromatic to your `.storybook/main.ts`:

```typescript
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
```

Then run `npx chromatic` to create your first baseline.

## Step 2: Write stories for tour components

Each visual state of your tour needs its own story:

```tsx
// src/components/tour-tooltip.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { TourProvider } from "@tourkit/react";
import { TourTooltip } from "./tour-tooltip";

const steps = [
  { id: "welcome", target: "#btn-create", title: "Create a project", content: "Click here to start." },
  { id: "settings", target: "#btn-settings", title: "Settings", content: "Configure your workspace." },
  { id: "invite", target: "#btn-invite", title: "Invite team", content: "Collaboration starts here." },
];

function TourWrapper({ initialStep = 0 }: { initialStep?: number }) {
  return (
    <TourProvider steps={steps} initialStep={initialStep}>
      <div style={{ padding: "100px", position: "relative" }}>
        <button id="btn-create">Create</button>
        <button id="btn-settings">Settings</button>
        <button id="btn-invite">Invite</button>
        <TourTooltip />
      </div>
    </TourProvider>
  );
}

const meta: Meta<typeof TourWrapper> = {
  title: "Tour/TourTooltip",
  component: TourWrapper,
  parameters: {
    layout: "fullscreen",
    chromatic: { viewports: [375, 768, 1440] },
  },
};

export default meta;
type Story = StoryObj<typeof TourWrapper>;

export const Step1: Story = { args: { initialStep: 0 } };
export const Step2: Story = { args: { initialStep: 1 } };
export const Step3: Story = { args: { initialStep: 2 } };
```

Three stories, three viewports = 9 screenshots per PR. On Chromatic's free tier (5,000 snapshots/month), that's plenty of headroom.

## Step 3: Simulate tour progression with play functions

Play functions use Testing Library APIs to interact with your component after it renders. Chromatic captures a snapshot after the play function completes:

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

## Step 4: Dark mode and theme testing

Chromatic's `modes` parameter captures both themes without duplicating stories:

```typescript
// .storybook/preview.ts
const preview: Preview = {
  parameters: {
    chromatic: {
      modes: {
        light: { theme: "light" },
        dark: { theme: "dark", backgrounds: { value: "#0a0a0a" } },
      },
    },
  },
};
```

## Step 5: GitHub Actions for PR checks

```yaml
name: Visual Regression Tests
on:
  pull_request:
    branches: [main]
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: false
          onlyChanged: true
          autoAcceptChanges: "main"
```

## Snapshot budget

- 3 stories x 3 viewports x 2 themes = 18 snapshots/PR
- 10 PRs/month = 180 snapshots (3.6% of free tier)
- Starter plan ($179/mo) gives 35,000 snapshots + Safari/Firefox/Edge

Full article with troubleshooting guide, accessibility testing details, and all code examples: [usertourkit.com/blog/visual-regression-testing-product-tours-chromatic](https://usertourkit.com/blog/visual-regression-testing-product-tours-chromatic)
