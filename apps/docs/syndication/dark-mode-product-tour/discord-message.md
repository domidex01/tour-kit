## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up how to handle dark mode theming for product tour overlays and tooltips in React. The overlay opacity / tooltip elevation / accent color vibration problems are surprisingly annoying to get right. CSS variables with a `[data-theme='dark']` selector override turned out to be the cleanest approach.

https://usertourkit.com/blog/dark-mode-product-tour

Would be curious if anyone has a different approach for the overlay opacity problem specifically — bumping from 0.5 to 0.75 works but feels like a magic number.
