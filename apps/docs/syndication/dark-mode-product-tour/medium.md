# Why Your Product Tour Breaks in Dark Mode (and How to Fix It)

*Your onboarding experience deserves to look good in every theme*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/dark-mode-product-tour)*

---

Your app has dark mode. Your design system toggles flawlessly between light and dark. Then you add a product tour and the whole thing falls apart. Bright white tooltips flash against a dark UI, the spotlight overlay vanishes, and accent colors bleed on low-contrast surfaces.

About 70% of developers use dark mode by default. If your onboarding tour looks broken in dark mode, you're making a bad first impression on the majority of your technical users.

## The three problems

Product tours stack overlays, tooltips, and progress indicators on top of your existing UI. In dark mode, three things go wrong:

**Invisible overlays.** Tour libraries use a semi-transparent black backdrop to dim the page. On a dark UI, `rgba(0, 0, 0, 0.5)` is nearly invisible. The spotlight that's supposed to guide attention disappears entirely.

**Flat tooltips.** Designer Steve Schoger's elevation principle says closer surfaces should be lighter in dark mode, not the same shade as the background. A tooltip at the same darkness as the page looks flat and illegible.

**Color vibration.** Saturated accent colors that look crisp on white backgrounds vibrate or bleed on dark surfaces. You need to desaturate them for dark themes.

## The fix: CSS custom properties

The solution is defining your tour's color palette as CSS variables on `:root` and overriding them for dark mode. One selector swap changes everything.

Light mode gets `rgba(0, 0, 0, 0.5)` for the overlay. Dark mode bumps it to `rgba(0, 0, 0, 0.75)`. The tooltip background uses `#1e1e2e` instead of pure black (which causes a halo effect around text). Accent colors shift from `#0033cc` to `#809fff` — same hue, lower saturation.

Your tooltip component references these variables directly. When the user toggles themes, the browser repaints at the CSS layer with zero React re-renders. No conditional class logic. No forked stylesheets.

## System preference detection

Many users rely on their OS to schedule dark mode. A `useTourTheme` hook that reads `prefers-color-scheme` and listens for changes handles this automatically. It supports three states — light, dark, and system — so users can override their OS preference if they want.

## Don't forget WCAG

WCAG 2.1 requires a 4.5:1 contrast ratio for normal text regardless of whether dark mode is "optional." No exceptions. We verified every color pairing in both themes passes AA requirements.

One gotcha worth checking: your accent color on a secondary surface (like a progress bar) might drop below the 4.5:1 threshold even when it passes on the primary background. Test every surface combination, not just the obvious pairs.

## Flash of incorrect theme

If your dark mode is JavaScript-driven, users see a flash of light theme before JS executes. The fix is a synchronous script tag in `<head>` that reads the preference from localStorage before the first paint.

---

Full tutorial with working TypeScript code, complete CSS variable definitions, and a contrast ratio verification table: [usertourkit.com/blog/dark-mode-product-tour](https://usertourkit.com/blog/dark-mode-product-tour)

*Tour Kit is a headless product tour library for React. It requires React 18+ and doesn't include a visual builder — you write the tour configuration in code.*

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, Level Up Coding
