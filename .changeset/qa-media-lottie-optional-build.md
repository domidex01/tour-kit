---
"@tour-kit/media": patch
---

Fix a build failure for consumers who don't install the optional `@lottiefiles/react-lottie-player` peer. The Lottie player is now dynamically imported with `/* webpackIgnore: true */ /* @vite-ignore */`, and the package is built with granular minification (`minifyIdentifiers`/`minifySyntax` only, whitespace off) so those magic comments survive — preventing webpack/Vite from resolving the optional dependency at build time. Because `@tour-kit/react` depends on `@tour-kit/media`, this previously broke every React-package consumer that didn't also install the Lottie player. Mirrors the existing `@tour-kit/analytics` optional-SDK pattern.
