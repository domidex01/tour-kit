---
title: "Dark mode breaks your product tour — here's how to fix it with CSS variables"
published: false
description: "Most React tour libraries ship light-theme-only styles. Here's how to build product tours that adapt to dark mode automatically using CSS custom properties, adaptive overlays, and WCAG-compliant contrast ratios."
tags: react, webdev, tutorial, css
canonical_url: https://usertourkit.com/blog/dark-mode-product-tour
cover_image: https://usertourkit.com/og-images/dark-mode-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/dark-mode-product-tour)*

# Theming product tours for dark mode in React

Your app has dark mode. Your design system toggles flawlessly between light and dark. Then you add a product tour and the whole thing falls apart. Bright white tooltips flash against a dark UI, the spotlight overlay vanishes into the dark background, and accent colors bleed on low-contrast surfaces.

Most React tour libraries treat dark mode as an afterthought. They ship with hardcoded light-theme styles and leave you to override everything yourself. Tour Kit takes a different approach: you define CSS variables for your tour theme, and every component (tooltips, overlays, progress indicators) respects them automatically. No forked stylesheets, no conditional class gymnastics.

By the end of this tutorial you'll have a product tour that adapts to light mode, dark mode, and system preferences with zero conditional rendering logic.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

A 3-step product tour with a tooltip, overlay, and progress bar that switches between light and dark themes automatically. The tour reads the user's system preference via `prefers-color-scheme`, applies the correct CSS variables, and lets you toggle themes mid-tour without any re-render. All colors pass WCAG AA contrast requirements in both modes.

## Prerequisites

- React 18.2+ or React 19
- TypeScript 5.0+
- A working dark mode toggle in your app (Tailwind `dark:` class, `data-theme` attribute, or `prefers-color-scheme` media query)
- Basic familiarity with CSS custom properties

## What makes dark mode hard for product tours

Product tours layer multiple surfaces on top of your UI (overlays, tooltips, highlights, progress bars), and each one interacts differently with background color. A dark mode product tour hits at least three problems that regular component theming never encounters because tours combine transparent overlays, floating surfaces, and accent-colored controls in a single view.

The **overlay problem** is the most visible. Tour libraries typically render a semi-transparent black backdrop (`rgba(0, 0, 0, 0.5)`) to dim the page. On a dark UI, the overlay is nearly invisible because you're layering dark transparency over an already-dark background.

**Tooltip elevation** breaks next. In dark mode, Steve Schoger's elevation principle applies: closer surfaces should be lighter, not darker ([CSS-Tricks](https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/)). A tooltip rendered at the same dark shade as the page background looks flat and illegible.

**Accent color vibration** is subtler. Saturated brand colors that look crisp on white backgrounds will visually vibrate or bleed on dark surfaces. Dark themes need desaturated variants: `#809fff` instead of `#0033cc`.

## Step 1: define CSS variables for your tour theme

CSS custom properties let you define your tour's entire color palette once and switch between light and dark themes by overriding a single selector ([CSS-Tricks](https://css-tricks.com/easy-dark-mode-and-multiple-color-themes-in-react/)).

```css
/* src/styles/tour-theme.css */
:root {
  --tour-bg: #ffffff;
  --tour-text: #1a1a2e;
  --tour-overlay: rgba(0, 0, 0, 0.5);
  --tour-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  --tour-accent: #0033cc;
  --tour-accent-text: #ffffff;
  --tour-border: #e2e8f0;
  --tour-progress-bg: #e2e8f0;
  --tour-progress-fill: #0033cc;
}

[data-theme='dark'] {
  --tour-bg: #1e1e2e;
  --tour-text: #e2e8f0;
  --tour-overlay: rgba(0, 0, 0, 0.75);
  --tour-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  --tour-accent: #809fff;
  --tour-accent-text: #1a1a2e;
  --tour-border: #2d2d3f;
  --tour-progress-bg: #2d2d3f;
  --tour-progress-fill: #809fff;
}
```

Two things to notice. First, the dark overlay opacity jumps from `0.5` to `0.75`, and that extra contrast is what makes the spotlight cutout visible on a dark background. Second, the tooltip background in dark mode uses `#1e1e2e`, not pure black. Pure black causes a halo effect around light text ([Smashing Magazine](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)).

## Step 2: build a theme-aware tooltip component

Because Tour Kit is headless, it handles step sequencing, element highlighting, and scroll management while you render the tooltip UI yourself. Your tooltip component consumes the CSS variables directly.

```tsx
// src/components/TourTooltip.tsx
import { useTour } from '@tourkit/react';

interface TourTooltipProps {
  title: string;
  content: string;
}

export function TourTooltip({ title, content }: TourTooltipProps) {
  const { currentStep, totalSteps, next, prev, stop } = useTour();

  return (
    <div
      role="dialog"
      aria-label={title}
      style={{
        backgroundColor: 'var(--tour-bg)',
        color: 'var(--tour-text)',
        border: '1px solid var(--tour-border)',
        boxShadow: 'var(--tour-shadow)',
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '320px',
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{title}</h3>
      <p style={{ margin: '0 0 16px', fontSize: '14px', lineHeight: 1.5 }}>
        {content}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={prev} disabled={currentStep === 0}>Back</button>
        <button onClick={currentStep === totalSteps - 1 ? stop : next}>
          {currentStep === totalSteps - 1 ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  );
}
```

Every color references a CSS variable. When the user toggles their theme, the tooltip repaints instantly with no React re-render.

## Step 3: handle the overlay opacity problem

The overlay is the single most common failure point for dark mode product tours. The fix: bump the overlay opacity in dark mode through the same CSS variables.

```tsx
// src/components/TourOverlay.tsx
import type { CSSProperties } from 'react';

export function TourOverlay({ children }: { children: React.ReactNode }) {
  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'var(--tour-overlay)',
    zIndex: 9998,
    transition: 'background-color 200ms ease',
  };

  return <div style={overlayStyle} aria-hidden="true">{children}</div>;
}
```

We defined `--tour-overlay` as `rgba(0, 0, 0, 0.5)` in light mode and `rgba(0, 0, 0, 0.75)` in dark mode. That 25-percentage-point bump makes the spotlight cutout pop against dark backgrounds.

## Step 4: respect system preferences automatically

About 70% of developers use dark mode by default (2020 developer survey). Your tour needs to detect the system preference on load.

```tsx
// src/hooks/useTourTheme.ts
import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTourTheme(initialTheme: Theme = 'system') {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme !== 'system') {
      setResolved(theme);
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setResolved(mq.matches ? 'dark' : 'light');
    const handler = (e: MediaQueryListEvent) => {
      setResolved(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);

  return { theme, resolved, setTheme, toggle };
}
```

## Step 5: verify contrast ratios

WCAG 2.1 SC 1.4.3 requires 4.5:1 for normal text and 3:1 for large text. No exceptions for dark mode ([BOIA](https://www.boia.org/blog/offering-a-dark-mode-doesnt-satisfy-wcag-color-contrast-requirements)).

| Pairing | Light mode | Dark mode | WCAG AA |
|---|---|---|---|
| Text on background | #1a1a2e on #ffffff = 16.5:1 | #e2e8f0 on #1e1e2e = 12.3:1 | Pass |
| Accent text on accent | #ffffff on #0033cc = 8.9:1 | #1a1a2e on #809fff = 6.2:1 | Pass |
| Border on background | #e2e8f0 on #ffffff = 1.3:1 | #2d2d3f on #1e1e2e = 1.4:1 | N/A (decorative) |

One gotcha: the dark accent color `#809fff` on a `#2d2d3f` surface drops to 4.1:1, below the threshold. Check every surface combination.

## Common issues and troubleshooting

**Overlay disappears on dark backgrounds:** Increase `--tour-overlay` opacity to `rgba(0, 0, 0, 0.7)` or higher for dark mode.

**Tour flashes light theme before dark mode loads:** Add a synchronous `<script>` in `<head>` that reads from localStorage before the first paint:

```html
<script>
  const theme = localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
</script>
```

**Accent colors vibrate on dark backgrounds:** Desaturate your accent. `hsl(220, 100%, 40%)` becomes `hsl(220, 60%, 75%)`.

## FAQ

**Does Tour Kit have built-in dark mode support?**
Tour Kit is headless, so it doesn't ship with pre-styled themes. Your tour inherits your app's existing dark mode system through CSS variables or Tailwind's `dark:` variant.

**What contrast ratio do tour tooltips need?**
WCAG 2.1 requires 4.5:1 for normal text and 3:1 for large text. No exception for optional dark mode toggles.

**Can I use Tailwind's dark mode with Tour Kit?**
Yes. Define your CSS variables under the `.dark` class selector instead of `[data-theme='dark']`.

---

Tour Kit is a headless product tour library for React. One limitation: it requires React 18+ and doesn't include a visual builder. [Full article with all code examples](https://usertourkit.com/blog/dark-mode-product-tour) | [GitHub](https://github.com/user-tour-kit/tour-kit) | [npm](https://www.npmjs.com/package/@tourkit/core)
