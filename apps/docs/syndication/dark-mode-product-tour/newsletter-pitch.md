## Subject: Theming product tours for dark mode in React — tutorial with CSS variable patterns

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a tutorial on handling dark mode for product tour overlays and tooltips in React. It covers a problem most tour libraries ignore: transparent overlays become invisible on dark backgrounds, tooltips lose their visual elevation, and saturated accent colors vibrate. The fix uses CSS custom properties with adaptive opacity and desaturated color palettes, verified against WCAG AA contrast ratios (4.5:1 for normal text in both themes).

Includes working TypeScript code, a `useTourTheme` hook with three-state system preference detection, and a contrast ratio verification table.

Link: https://usertourkit.com/blog/dark-mode-product-tour

Thanks,
Domi
