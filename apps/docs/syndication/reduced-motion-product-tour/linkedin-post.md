35% of US adults over 40 have experienced vestibular dysfunction. Product tours — with their stacked slide-ins, pulsing spotlights, and animated progress bars — can trigger vertigo, nausea, and migraines.

I checked every major onboarding tool's 2026 best practices guide. None mention prefers-reduced-motion.

The fix isn't hard. A React hook detects the OS preference. CSS media queries catch it before JavaScript loads. You replace spatial animations with opacity fades. The content still appears — only the entrance effect changes.

One pattern I hadn't seen elsewhere: an in-tour toggle using role="switch" for users who haven't found their OS accessibility settings. Combined with localStorage persistence, it gives users control without leaving the product.

Full tutorial with code: https://usertourkit.com/blog/reduced-motion-product-tour

#react #accessibility #webdevelopment #productdevelopment #wcag
