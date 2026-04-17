---
title: "Theming product tours for dark mode in React"
slug: "dark-mode-product-tour"
canonical: https://usertourkit.com/blog/dark-mode-product-tour
tags: react, javascript, web-development, css, dark-mode
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/dark-mode-product-tour)*

# Theming product tours for dark mode in React

Your app has dark mode. Your design system toggles flawlessly between light and dark. Then you add a product tour and the whole thing falls apart. Bright white tooltips flash against a dark UI, the spotlight overlay vanishes into the dark background, and accent colors bleed on low-contrast surfaces.

This tutorial walks through building a dark-mode-aware product tour in React using CSS custom properties. You'll define theme tokens once, override them for dark mode, handle the overlay opacity problem, detect system preferences, and verify WCAG AA contrast ratios in both modes.

**What you'll need:** React 18.2+, TypeScript 5.0+, a working dark mode toggle.

```bash
npm install @tourkit/core @tourkit/react
```

## Why dark mode is hard for product tours

Tours layer overlays, tooltips, highlights, and progress bars on top of your UI simultaneously. Three specific problems break in dark mode:

1. **Overlay invisibility** — `rgba(0, 0, 0, 0.5)` is barely visible on dark backgrounds
2. **Flat tooltips** — same-shade tooltips lose elevation against dark pages
3. **Color vibration** — saturated accents bleed on dark surfaces

## The CSS variable approach

Define your tour palette on `:root` and override for dark mode:

```css
:root {
  --tour-bg: #ffffff;
  --tour-text: #1a1a2e;
  --tour-overlay: rgba(0, 0, 0, 0.5);
  --tour-accent: #0033cc;
}

[data-theme='dark'] {
  --tour-bg: #1e1e2e;
  --tour-text: #e2e8f0;
  --tour-overlay: rgba(0, 0, 0, 0.75);
  --tour-accent: #809fff;
}
```

Key decisions: overlay bumps from 0.5 to 0.75 in dark mode. Background uses `#1e1e2e` instead of pure black (which causes halo effects). Accent desaturates from `#0033cc` to `#809fff`.

## System preference detection

```tsx
export function useTourTheme(initialTheme: 'light' | 'dark' | 'system' = 'system') {
  const [theme, setTheme] = useState(initialTheme);
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme !== 'system') { setResolved(theme); return; }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setResolved(mq.matches ? 'dark' : 'light');
    const handler = (e: MediaQueryListEvent) => setResolved(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return { theme, resolved, setTheme };
}
```

Three-state toggle: light, dark, system. Listens for OS changes in real time.

## Contrast verification

WCAG 2.1 SC 1.4.3 requires 4.5:1 for normal text. Our pairings:

| Pairing | Light | Dark | Pass? |
|---|---|---|---|
| Text on bg | 16.5:1 | 12.3:1 | Yes |
| Accent text | 8.9:1 | 6.2:1 | Yes |

Gotcha: `#809fff` on `#2d2d3f` surfaces drops to 4.1:1. Check every combination.

## Flash of incorrect theme fix

```html
<script>
  const theme = localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
</script>
```

Runs synchronously before CSS applies.

---

Full article with complete code examples, troubleshooting, and FAQ: [usertourkit.com/blog/dark-mode-product-tour](https://usertourkit.com/blog/dark-mode-product-tour)

Tour Kit is a headless product tour library for React (React 18+ required, no visual builder).
