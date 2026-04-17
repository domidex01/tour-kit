## Title: Show HN: Tour Kit – Headless product tour library for React (12 packages, solo dev)

## URL: https://usertourkit.com/blog/how-i-built-10-package-react-library-solo-developer

## Comment to post immediately after:

I built Tour Kit over the last 3.5 months as a solo developer. It's a headless product tour library for React — 12 packages, 31K lines of TypeScript, zero runtime dependencies, core under 8KB gzipped.

The article is an honest retrospective. I publish the uncomfortable numbers: zero npm downloads, zero GitHub stars, 141 commits. I built 10 packages before a single user had reason to install any of them. That was a mistake — the correct first release was 3 packages, not 10.

Some specific things I cover:
- Why I split core from React bindings in month one (and why that boundary held through every feature addition)
- Turborepo's turbo.json is 36 lines — that's the entire build config for 12 packages
- TypeScript strict mode with `noUncheckedIndexedAccess` caught real bugs but tripled development time for generic types
- AI-generated code (Claude Code) shipped faster but I caught type-safety gaps that would have gone unreviewed without a team

The three biggest lessons: ship the smallest useful thing first, set bundle budgets from day one, write docs before you think you need them.

Source: https://github.com/DomiDex/tour-kit

Happy to answer questions about the architecture, tooling choices, or the building-in-public experience.
