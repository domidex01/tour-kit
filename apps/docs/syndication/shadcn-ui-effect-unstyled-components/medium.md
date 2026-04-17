# The shadcn/ui Effect: Why Unstyled Components Won

## How a copy-paste component collection reshaped React development

*Originally published at [usertourkit.com](https://usertourkit.com/blog/shadcn-ui-effect-unstyled-components)*

Something shifted in React's ecosystem around 2023, and most developers felt it before they could name it. shadcn/ui hit 104,000 GitHub stars and 560,000 weekly npm downloads by early 2026. Those numbers rival established frameworks, not component libraries. But the interesting part isn't the adoption curve. It's what shadcn/ui revealed about how developers actually want to build.

The unstyled component model won. Not because it's newer, but because it solves a real problem that styled libraries papered over for years: who owns the code?

## Styled libraries stopped scaling

For most of the 2010s, the pitch was simple. Install a component library, import a Button, ship it. Material UI, Ant Design, Chakra UI: they all followed the same model.

That worked when teams shipped one app with one design system. It stopped working when three things happened at once.

First, design systems diverged. Every serious product team now maintains its own tokens, and wrapping a styled library's opinions in overrides produces `!important` chains and CSS specificity fights that nobody wins.

Second, React Server Components killed CSS-in-JS at runtime. styled-components and Emotion relied on client-side style injection, which added 12–15KB of runtime overhead per bundle. When the rendering model moved server-first, those libraries couldn't follow without breaking hydration.

Third, AI code generation exposed a hidden cost. When you ask an AI agent to modify a component from node_modules, it can't. The code sits behind an abstraction wall. Tony Dinh, creator of TypingMind, called it directly: "shadcn is the default UI lib of LLMs." As of 2026, Bolt, Lovable, Vercel v0, and Replit all default to shadcn/ui.

## Ownership is the feature

shadcn/ui's official docs are blunt: "This is NOT a component library. It's a collection of re-usable components that you can copy and paste into your apps."

The traditional model creates a dependency graph. You install a package, import components, and hope the library's API surface covers your use case. When it doesn't, you fork, wrap, or hack around the limitation.

The unstyled model inverts this. You get behavior primitives (focus management, keyboard navigation, ARIA attributes) from a headless layer, then compose your own UI on top.

As of April 2026, the numbers back this up:

- Radix UI Primitives: 9.1M+ weekly npm downloads
- React Aria (Adobe): 50+ components, 30+ language i18n
- Base UI (MUI): 35 components, released February 2026
- Ark UI (Chakra team): 45+ components across React, Solid, Vue, Svelte

Combined: over 14 million weekly installs.

Supabase's auth UI migration provides the clearest real-world validation. Ivan Vasilov explained why they moved to shadcn/ui's model: "The main reason shadcn approach is good for us is that it transfers the ownership of the code to the user."

## The honest counterargument

Unstyled components push more work onto you. A team using Chakra UI gets 80+ pre-styled components out of the box. Building that same visual consistency from headless primitives takes real effort.

There's also a learning curve. Understanding how to compose Radix's asChild pattern, or how React Aria's 50+ hooks map to rendered output, takes time that installing Material UI doesn't.

And the copy-paste model has a versioning gap. When shadcn ships a bug fix, you don't get it automatically.

These are genuine costs. But they scale well. The overhead of building your own component layer is front-loaded. The overhead of fighting a styled library's opinions compounds every sprint.

## What this means beyond buttons and dialogs

Here's where this gets specific. (I built Tour Kit, so read this with appropriate skepticism.)

Most product tour libraries followed the old model. React Joyride ships at 37KB gzipped with its own tooltip styles. Shepherd.js adds 28KB with AGPL licensing restrictions. You're expected to accept those defaults or override them.

The shadcn/ui pattern maps directly to onboarding. Separate behavior (step sequencing, element targeting, accessibility) from presentation (how your tooltip looks, what animation plays between steps).

The architectural pattern is the same: **behavior as a dependency, presentation as owned code**. shadcn/ui proved this works for buttons and dialogs. It works for product tours too.

Full article with code examples and comparison table: [usertourkit.com/blog/shadcn-ui-effect-unstyled-components](https://usertourkit.com/blog/shadcn-ui-effect-unstyled-components)

---

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
