shadcn/ui has 75,000+ GitHub stars — but no Tour component.

Issue #999 asked for one in 2023 and was closed. Radix UI has the same gap since 2022. The accessibility requirements for tour-style UI are genuinely hard, which is why neither project has shipped one.

I compared 7 tour libraries specifically for shadcn/ui compatibility. The core finding: every established library (React Joyride, Shepherd.js, Driver.js, Intro.js) ships its own CSS system that conflicts with Tailwind's utility-first approach. None makes explicit WCAG 2.1 AA compliance claims.

Three architecture patterns emerged:
- Own-CSS libraries that require style overrides
- shadcn-styled wrappers that look right but limit flexibility
- Headless libraries that provide tour logic while you render with your own components

For teams using shadcn/ui + Tailwind, the headless approach aligns best with the "copy, don't install" philosophy that made shadcn popular.

Full comparison with bundle sizes, React 19 support, and a decision framework: https://usertourkit.com/blog/best-shadcn-ui-compatible-tour-library

#react #shadcnui #tailwindcss #webdevelopment #opensource #productdevelopment
